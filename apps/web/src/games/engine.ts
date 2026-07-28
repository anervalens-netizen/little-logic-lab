/**
 * Motorul care rulează un joc în shell:
 * instrucțiune → joc → evidence → mastery → persistență → laudă → cleanup.
 */

import {
  recommendDifficultyDirection,
  stepDifficulty,
  type DifficultyVector,
} from "@core";
import type { GameContext, WebGame, PlayResult } from "./types";
import { observeRoundEvidence } from "./roundEvidence";
import {
  flushPendingProfileWrites,
  getProfile,
  recordAttempt,
  setGameDifficulty,
} from "../app/appState";
import {
  speakAndWait,
  stopSpeaking,
  waitForSpeechIdle,
} from "../audio/speech";
import { praise, isMotionReduced } from "../ui/feedback";
import { demoTap, demoHand } from "../ui/feedback";
import { wait } from "../ui/dom";
import {
  CONTENT_VERSION,
  ladderStageFor,
  normalizeLadderDifficulty,
  stepLadderDifficulty,
} from "../app/content";

export interface RunOutcome {
  readonly result: PlayResult;
  readonly cancelled: boolean;
}

let cancelFlag = false;

export function cancelCurrentGame(): void {
  cancelFlag = true;
  stopSpeaking();
}

export function resetCancelFlag(): void {
  cancelFlag = false;
}

export function cancelFlagPending(): boolean {
  return cancelFlag;
}

export function makeContext(
  mount: HTMLElement,
  shell: HTMLElement,
  onCleanup: (cleanup: () => void) => void,
): GameContext {
  return {
    mount,
    shell,
    speak: (text, opts) => speakAndWait(text, opts),
    hush: () => stopSpeaking(),
    reducedMotion: isMotionReduced(),
    demonstrate: async (target) => {
      const host = shell;
      if (!host.querySelector(".demo-hand")) host.append(demoHand());
      await demoTap(host, target);
    },
    onCleanup,
    isCancelled: () => cancelFlag,
  };
}

export async function runGame(
  game: WebGame,
  mount: HTMLElement,
  shell: HTMLElement,
  sessionId: string,
  seedSalt: string,
): Promise<RunOutcome> {
  const profile = getProfile();
  const stored = profile.progressByGame[game.id];
  const storedOrInitial: DifficultyVector =
    stored && Object.keys(stored.difficulty).length > 0
      ? { ...stored.difficulty }
      : { ...game.initialDifficulty };
  const difficulty =
    normalizeLadderDifficulty(game.id, profile.ageMonths, storedOrInitial) ??
    storedOrInitial;

  const seed = `${game.id}:${new Date().toISOString().slice(0, 10)}:${seedSalt}:${stored?.timesPlayed ?? 0}`;
  const cleanups: Array<() => void> = [];
  const ctx = makeContext(mount, shell, (cleanup) => cleanups.push(cleanup));
  const evidence = observeRoundEvidence(mount);
  cleanups.push(evidence.destroy);

  try {
    const rawResult = await game.play(ctx, difficulty, seed);
    const measured = evidence.snapshot();
    const result: PlayResult = {
      ...rawResult,
      ...(rawResult.responseMs === undefined && measured.responseMs !== undefined
        ? { responseMs: measured.responseMs }
        : {}),
    };
    if (cancelFlag) {
      return { result: { ...result, abandoned: true }, cancelled: true };
    }

    if (game.scored) {
      recordAttempt(game.id, game.skillId, result, {
        sessionId,
        levelSeed: seed,
        ladderStageId: ladderStageFor(game.id, profile.ageMonths, difficulty),
        contentVersion: CONTENT_VERSION,
      });

      const updated = getProfile().progressByGame[game.id];
      const outcomes = (updated?.recentOutcomes ?? []).map((attempt) => ({
        completed: attempt.completed,
        correctFirstTry: attempt.correctFirstTry,
        correctEventually: attempt.correctEventually,
        hintsUsed: attempt.hintsUsed,
        wrongAttempts: attempt.wrongAttempts,
      }));
      const direction = recommendDifficultyDirection(outcomes);
      if (direction !== 0) {
        const ladderStep = stepLadderDifficulty(
          game.id,
          profile.ageMonths,
          difficulty,
          direction,
        );
        if (ladderStep) {
          if (ladderStep.changed) {
            setGameDifficulty(game.id, { ...ladderStep.vector });
          }
        } else {
          const step = stepDifficulty(difficulty, game.axes, direction);
          if (step.changedAxis !== null) {
            setGameDifficulty(game.id, step.vector);
          }
        }
      } else if (!stored || Object.keys(stored.difficulty).length === 0) {
        setGameDifficulty(game.id, { ...difficulty });
      }

      await flushPendingProfileWrites().catch(() => undefined);
    }

    await waitForSpeechIdle();
    if (result.completed && !cancelFlag) {
      await praise(shell, { win: result.correctFirstTry });
    }
    await wait(250);
    return { result, cancelled: false };
  } finally {
    for (const cleanup of cleanups.reverse()) cleanup();
  }
}
