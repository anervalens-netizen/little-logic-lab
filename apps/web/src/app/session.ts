/**
 * Orchestrarea sesiunii: plan adaptiv local, limită de minute,
 * card de co-play după fiecare joc și final calm.
 */

import {
  buildSessionPlan,
  defaultSessionGameCount,
  type GameCandidate,
} from "@core";
import {
  flushPendingProfileWrites,
  getProfile,
  masteryMeanFor,
  recordSession,
} from "./appState";
import { GAME_IDS, loadGame } from "../generated/game-registry";
import { GAME_METADATA } from "../generated/game-metadata";
import {
  runGame,
  cancelCurrentGame,
  resetCancelFlag,
  cancelFlagPending,
} from "../games/engine";
import { buildGameShell } from "../screens/gameScreen";
import { showScreen } from "./router";
import { wait } from "../ui/dom";
import {
  preloadSpeech,
  preloadSpeechCues,
  stopSpeaking,
} from "../audio/speech";
import { showHome } from "../screens/home";
import {
  showCoPlayCard,
  showSessionEndCard,
} from "../screens/sessionCards";
import { applyPendingUpdate } from "./update";
import { isGameAgeEligible } from "./content";
import { unlockedGameIds } from "./unlocks";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

const SESSION_SECONDS_WARN = 0;
const PRAISE_LINES = [
  "Ai găsit soluția din prima!",
  "Ai continuat cu răbdare și ai reușit!",
] as const;
const PRAISE_CUE_IDS = ["praise-first-try", "praise-persistence"] as const;

function responseLoadFor(
  recent: readonly { readonly responseMs?: number }[],
): number {
  const samples = recent
    .map((attempt) => attempt.responseMs)
    .filter(
      (value): value is number =>
        value !== undefined &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 60_000,
    );
  if (samples.length === 0) return 0;
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return Math.min(1, average / 12_000);
}

function buildCandidates(): GameCandidate[] {
  const profile = getProfile();
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));
  const now = Date.now();

  return GAME_METADATA.filter(
    (game) =>
      game.scored &&
      unlocked.has(game.id) &&
      isGameAgeEligible(game.id, profile.ageMonths),
  ).map((game) => {
    const progress = profile.progressByGame[game.id];
    const mastery = profile.masteryBySkill[game.skillId];
    const mean = masteryMeanFor(game.skillId);
    const recent = progress?.recentOutcomes ?? [];
    const supportLoad =
      recent.length === 0
        ? 0
        : Math.min(
            1,
            recent.reduce(
              (sum, attempt) =>
                sum + attempt.hintsUsed * 0.32 + attempt.wrongAttempts * 0.16,
              0,
            ) / recent.length,
          );
    const abandonRate =
      recent.length === 0
        ? 0
        : recent.filter((attempt) => attempt.abandoned).length / recent.length;
    const responseLoad = responseLoadFor(
      recent as readonly { readonly responseMs?: number }[],
    );
    const lastPracticed = mastery?.lastPracticedAtLocal ?? null;
    const parsedLastPracticed = lastPracticed ? Date.parse(lastPracticed) : NaN;
    const daysSince = Number.isFinite(parsedLastPracticed)
      ? Math.max(0, (now - parsedLastPracticed) / 86_400_000)
      : 30;
    const recency = Math.min(1, daysSince / 10);
    const lowEvidence = (mastery?.evidenceCount ?? 0) < 2 ? 1 : 0;
    const dueScore = Math.max(
      0.05,
      Math.min(
        1,
        (1 - mean) * 0.42 +
          recency * 0.3 +
          lowEvidence * 0.2 +
          supportLoad * 0.05 +
          responseLoad * 0.03,
      ),
    );

    return {
      gameId: game.id,
      skillId: game.skillId,
      mode: game.mode,
      domain: game.domain,
      masteryMean: mean,
      evidenceCount: mastery?.evidenceCount ?? 0,
      timesPlayed: progress?.timesPlayed ?? 0,
      dueScore,
      lastPracticedAtLocal: lastPracticed,
      recentSupportLoad: supportLoad,
      recentAbandonRate: abandonRate,
      recentResponseLoad: responseLoad,
      ageEligible: true,
    };
  });
}

async function showSessionEnd(
  sessionId: string,
  startedAtMs: number,
  gamesPlayed: number,
): Promise<void> {
  await showSessionEndCard(() => {
    const elapsedMinutes = Math.max(
      0.1,
      Math.round(((Date.now() - startedAtMs) / 60_000) * 10) / 10,
    );
    recordSession(sessionId, elapsedMinutes, gamesPlayed);
  });
  await flushPendingProfileWrites().catch(() => undefined);
}

export interface SessionOptions {
  readonly singleGameId?: string;
  readonly singleLevelOnly?: boolean;
  /** Preview adult: fără attempt, mastery, dificultate, sesiune sau session lock. */
  readonly previewMode?: boolean;
  /** Prima oprire promisă vizual de Home; restul sesiunii rămâne adaptiv. */
  readonly preferredGameId?: string;
}

export async function runSession(options: SessionOptions = {}): Promise<void> {
  resetCancelFlag();
  const profile = getProfile();
  const sessionId = crypto.randomUUID();
  const limitMs = profile.settings.sessionMinutes * 60_000;
  const start = Date.now();
  const nowLocal = new Date().toISOString();

  let plan: readonly { gameId: string }[];
  if (options.singleGameId !== undefined) {
    plan = [{ gameId: options.singleGameId }];
  } else {
    const candidates = buildCandidates();
    const built = buildSessionPlan(candidates, {
      // UUID-ul este stocat în attempt/session, deci planul rămâne identificabil,
      // dar două sesiuni în aceeași zi nu repetă automat aceeași selecție.
      seed: `session:${nowLocal.slice(0, 10)}:${sessionId}`,
      maxGames: defaultSessionGameCount(profile.ageMonths),
      includeHybrid: false,
      nowLocal,
    });
    const preferred = options.preferredGameId;
    if (
      preferred &&
      candidates.some((candidate) => candidate.gameId === preferred)
    ) {
      plan = [
        { gameId: preferred },
        ...built.entries
          .filter((entry) => entry.gameId !== preferred)
          .map((entry) => ({ gameId: entry.gameId })),
      ].slice(0, built.maxGames);
    } else {
      plan = built.entries;
    }
  }

  let gamesPlayed = 0;
  let levelSalt = 0;

  for (const [planIndex, entry] of plan.entries()) {
    if (Date.now() - start >= limitMs + SESSION_SECONDS_WARN) break;
    const game = await loadGame(entry.gameId);
    if (!game) continue;

    const nextEntry = plan[planIndex + 1];
    if (nextEntry) void loadGame(nextEntry.gameId);
    if (game.instructionCueId) {
      void preloadSpeechCues([game.instructionCueId, ...PRAISE_CUE_IDS]);
    } else {
      void preloadSpeech([game.instruction, ...PRAISE_LINES]);
    }

    let playAnotherLevel = true;
    let quit = false;
    let introductionPlayed = false;
    const shell = buildGameShell({
      onHome: () => {
        quit = true;
        cancelCurrentGame();
      },
      showProgress:
        options.singleGameId === undefined && options.previewMode !== true,
    });
    shell.setProgress(gamesPlayed, plan.length);
    await showScreen(() => shell.screen);

    while (playAnotherLevel && Date.now() - start < limitMs) {
      shell.setProgress(gamesPlayed, plan.length);

      if (!introductionPlayed) {
        // Jocul însuși este sursa audio autoritară. Shell-ul oferă doar o
        // tranziție vizuală scurtă, evitând două instrucțiuni consecutive.
        shell.showBubble(game.instruction);
        shell.setLumiMood("think");
        await wait(demonstrationDelay(320));
        if (cancelFlagPending()) {
          stopSpeaking();
          await showHome();
          return;
        }
        shell.hideBubble();
        introductionPlayed = true;
      }

      const { result, cancelled } = await runGame(
        game,
        shell.mount,
        shell.screen,
        sessionId,
        `${levelSalt}`,
        { persistProgress: options.previewMode !== true },
      );
      levelSalt += 1;

      if (cancelled || quit) {
        stopSpeaking();
        await showHome();
        return;
      }

      if (result.completed) {
        gamesPlayed += 1;
        shell.setLumiMood("happy");
        shell.setProgress(gamesPlayed, plan.length);
      }

      playAnotherLevel =
        options.singleGameId !== undefined &&
        options.singleLevelOnly !== true &&
        result.completed;

      if (
        !playAnotherLevel &&
        profile.settings.coPlayPrompts &&
        result.completed &&
        options.singleLevelOnly !== true &&
        options.previewMode !== true
      ) {
        await showCoPlayCard(game.coPlayPrompt);
      }
      if (cancelFlagPending()) {
        stopSpeaking();
        await showHome();
        return;
      }
    }
  }

  stopSpeaking();
  if (options.previewMode === true) {
    const { showParentScreen } = await import("../screens/parent");
    await showParentScreen();
    return;
  }

  await showSessionEnd(sessionId, start, gamesPlayed);
  if (!(await applyPendingUpdate())) {
    await showHome();
  }
}
