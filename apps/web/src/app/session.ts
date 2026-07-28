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
  speakAndWait,
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
        (1 - mean) * 0.42 + recency * 0.32 + lowEvidence * 0.2 + supportLoad * 0.06,
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
  /** Disponibil numai din Parent Mode pentru verificarea unei activități. */
  readonly singleGameId?: string;
  /** Oprește testul adultului după primul nivel, indiferent de timpul rămas. */
  readonly singleLevelOnly?: boolean;
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
    const built = buildSessionPlan(buildCandidates(), {
      seed: `session:${nowLocal.slice(0, 10)}:${profile.sessions.length}`,
      maxGames: defaultSessionGameCount(profile.ageMonths),
      includeHybrid: false,
      nowLocal,
    });
    plan = built.entries;
  }

  let gamesPlayed = 0;
  let levelSalt = 0;

  for (const [planIndex, entry] of plan.entries()) {
    if (Date.now() - start >= limitMs + SESSION_SECONDS_WARN) break;
    const game = await loadGame(entry.gameId);
    if (!game) continue;

    const nextEntry = plan[planIndex + 1];
    if (nextEntry) void loadGame(nextEntry.gameId);
    void preloadSpeech([game.instruction, ...PRAISE_LINES]);

    let playAnotherLevel = true;
    let quit = false;
    let introductionPlayed = false;
    const shell = buildGameShell({
      onHome: () => {
        quit = true;
        cancelCurrentGame();
      },
      showProgress: options.singleGameId === undefined,
    });
    shell.setProgress(gamesPlayed, plan.length);
    await showScreen(() => shell.screen);

    while (playAnotherLevel && Date.now() - start < limitMs) {
      shell.setProgress(gamesPlayed, plan.length);

      if (!introductionPlayed) {
        shell.showBubble(game.instruction);
        shell.setLumiMood("think");
        await Promise.all([
          speakAndWait(game.instruction),
          wait(demonstrationDelay(1400)),
        ]);
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
        options.singleLevelOnly !== true
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
  await showSessionEnd(sessionId, start, gamesPlayed);
  if (!(await applyPendingUpdate())) {
    await showHome();
  }
}
