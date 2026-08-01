/**
 * Orchestrarea sesiunii: plan adaptiv (din core), limită de minute,
 * card de co-play după fiecare joc, final calm.
 */

import { buildSessionPlan, defaultSessionGameCount, type GameCandidate } from "@core";
import { getProfile, masteryMeanFor, recordSession } from "./appState";
import {
  GAME_IDS,
  loadGame,
  loadGames,
} from "../generated/game-registry";
import { runGame, cancelCurrentGame, resetCancelFlag, cancelFlagPending } from "../games/engine";
import { buildGameShell } from "../screens/gameScreen";
import { showScreen } from "./router";
import { wait } from "../ui/dom";
import { speak, stopSpeaking } from "../audio/speech";
import { showHome } from "../screens/home";
import {
  showCoPlayCard,
  showSessionEndCard,
} from "../screens/sessionCards";
import { applyPendingUpdate } from "./update";
import { unlockedGameIds } from "./unlocks";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

const SESSION_SECONDS_WARN = 0; // nu afișăm cronometru copilului

async function buildCandidates(): Promise<GameCandidate[]> {
  const profile = getProfile();
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));
  const games = await loadGames(
    GAME_IDS.filter((gameId) => unlocked.has(gameId)),
  );
  return games
    .filter((game) => unlocked.has(game.id))
    .map((game) => {
      const progress = profile.progressByGame[game.id];
      const mean = masteryMeanFor(game.skillId);
      return {
        gameId: game.id,
        skillId: game.skillId,
        mode:
          game.domain === "hybrid_transfer"
            ? ("hybrid" as const)
            : game.scored
              ? ("digital" as const)
              : ("open_ended" as const),
        masteryMean: mean,
        evidenceCount: profile.masteryBySkill[game.skillId]?.evidenceCount ?? 0,
        timesPlayed: progress?.timesPlayed ?? 0,
        dueScore: 1 - mean,
        ageEligible: true,
      };
    });
}

/** Ecranul de final de sesiune: Lumi doarme, calm, fără stimulente. */
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
}

export interface SessionOptions {
  /** Dacă e setat, se joacă doar acest joc (ales de pe ecranul principal). */
  readonly singleGameId?: string;
}

export async function runSession(options: SessionOptions = {}): Promise<void> {
  resetCancelFlag();
  const profile = getProfile();
  const sessionId = crypto.randomUUID();
  const limitMs = profile.settings.sessionMinutes * 60_000;
  const start = Date.now();

  let plan: readonly { gameId: string }[];
  if (options.singleGameId !== undefined) {
    plan = [{ gameId: options.singleGameId }];
  } else {
    const built = buildSessionPlan(await buildCandidates(), {
      seed: `session:${new Date().toISOString().slice(0, 10)}`,
      maxGames: defaultSessionGameCount(profile.ageMonths),
      includeHybrid: true,
    });
    plan = built.entries;
  }

  let gamesPlayed = 0;
  let levelSalt = 0;

  for (const entry of plan) {
    if (Date.now() - start >= limitMs + SESSION_SECONDS_WARN) break;
    const game = await loadGame(entry.gameId);
    if (!game) continue;

    let playAnotherLevel = true;
    let quit = false;
    const shell = buildGameShell({
      onHome: () => {
        quit = true;
        cancelCurrentGame();
      },
      showProgress: options.singleGameId === undefined,
    });
    shell.screen.dataset.gameId = entry.gameId;
    shell.setProgress(gamesPlayed, plan.length);
    await showScreen(() => shell.screen);

    while (playAnotherLevel && Date.now() - start < limitMs) {
      shell.setProgress(gamesPlayed, plan.length);

      // Instrucțiune + demonstrație vizuală (fără citit).
      shell.showBubble(game.instruction);
      shell.setLumiMood("think");
      speak(game.instruction);
      await wait(demonstrationDelay(1400));
      shell.hideBubble();

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

      // După primul nivel terminat frumos, trecem la jocul următor;
      // în modul „un singur joc", continuăm niveluri până la limita de timp.
      playAnotherLevel = options.singleGameId !== undefined && result.completed;

      if (!playAnotherLevel && profile.settings.coPlayPrompts && result.completed) {
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
