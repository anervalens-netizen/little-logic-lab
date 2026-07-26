import type {
  DifficultyAxisSpec,
  DifficultyVector,
} from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

export interface SpatialFitPiece {
  readonly id: string;
  readonly label: string;
  readonly pieceSvg: string;
  readonly targetSvg: string;
  readonly rotation?: number;
  readonly targetOpacity?: number;
  readonly speech?: string;
}

export interface SpatialFitRound {
  readonly pieces: readonly SpatialFitPiece[];
  readonly itemOrder: readonly string[];
}

interface SpatialFitSpec {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  readonly instruction: string;
  readonly coPlayPrompt: string;
  readonly icon: () => string;
  readonly bubbleColor: string;
  readonly axes: readonly DifficultyAxisSpec[];
  readonly initialDifficulty: DifficultyVector;
  readonly buildRound: (
    difficulty: DifficultyVector,
    seed: string,
  ) => SpatialFitRound;
  readonly hintSpeech?: string;
  readonly helpSpeech?: string;
}

export function createSpatialFitGame(spec: SpatialFitSpec): WebGame {
  return {
    id: spec.id,
    title: spec.title,
    skillId: spec.skillId,
    domain: spec.domain,
    instruction: spec.instruction,
    coPlayPrompt: spec.coPlayPrompt,
    icon: spec.icon,
    bubbleColor: spec.bubbleColor,
    axes: spec.axes,
    initialDifficulty: spec.initialDifficulty,
    scored: true,

    async play(ctx, difficulty, seed) {
      const round = spec.buildRound(difficulty, seed);
      const pieceById = new Map(
        round.pieces.map((piece) => [piece.id, piece]),
      );
      const batches: SpatialFitPiece[][] = [];
      for (let index = 0; index < round.itemOrder.length; index += 4) {
        const batch = round.itemOrder
          .slice(index, index + 4)
          .map((id) => pieceById.get(id))
          .filter((piece): piece is SpatialFitPiece => piece !== undefined);
        if (batch.length > 0) batches.push(batch);
      }

      let correctFirstTry = true;
      let hintsUsed = 0;
      let wrongAttempts = 0;
      for (const batch of batches) {
        const result = await playSpatialFitBatch(ctx, batch, {
          instruction: spec.instruction,
          hint: spec.hintSpeech ?? "Uite, aici se potrivește!",
          help: spec.helpSpeech ?? "Hai să le punem împreună!",
        });
        correctFirstTry &&= result.correctFirstTry;
        hintsUsed += result.hintsUsed;
        wrongAttempts += result.wrongAttempts;
        if (result.abandoned) {
          return {
            completed: false,
            correctFirstTry: false,
            correctEventually: false,
            hintsUsed,
            wrongAttempts,
            abandoned: true,
          };
        }
      }

      return {
        completed: true,
        correctFirstTry,
        correctEventually: true,
        hintsUsed,
        wrongAttempts,
      };
    },
  };
}

async function playSpatialFitBatch(
  ctx: GameContext,
  pieces: readonly SpatialFitPiece[],
  speech: { readonly instruction: string; readonly hint: string; readonly help: string },
): Promise<PlayResult> {
  clear(ctx.mount);
  const { createPixiDragScene } = await import("../runtime/pixiDragScene");
  const support = new SupportTracker();
  const targets =
    pieces.length > 1 ? [...pieces.slice(1), pieces[0]!] : [...pieces];
  const placed = new Set<string>();
  let settled = false;
  let inputReady = false;
  let simplifying = false;
  let cancelWatch: number | null = null;
  let resolveResult: (result: PlayResult) => void = () => undefined;
  const result = new Promise<PlayResult>((resolve) => {
    resolveResult = resolve;
  });
  const finish = (outcome: PlayResult) => {
    if (settled) return;
    settled = true;
    if (cancelWatch !== null) window.clearInterval(cancelWatch);
    resolveResult(outcome);
  };

  const scene = await createPixiDragScene(ctx.mount, {
    items: pieces.map((piece) => ({
      id: piece.id,
      svg: piece.pieceSvg,
      label: piece.label,
      rotation: piece.rotation,
    })),
    targets: targets.map((piece) => ({
      id: piece.id,
      svg: piece.targetSvg,
      label: `locul pentru ${piece.label}`,
      ghostAlpha: piece.targetOpacity,
    })),
    presentation: "holes",
    reducedMotion: ctx.reducedMotion,
    onDrop(itemId, targetId) {
      if (!inputReady || settled || simplifying) return "ignore";
      if (itemId !== targetId) {
        const verdict = support.registerError();
        if (verdict === "hint") {
          window.setTimeout(() => scene.emphasizeTarget(itemId), 180);
          speak(speech.hint);
        } else if (verdict === "simplify") {
          simplifying = true;
          inputReady = false;
          void autoCompleteRemaining();
        }
        return "incorrect";
      }

      support.registerSuccess();
      placed.add(itemId);
      sfxPlace();
      playItemVoice(itemId);
      const piece = pieces.find((candidate) => candidate.id === itemId);
      if (piece?.speech) speak(piece.speech, { rate: 1 });
      if (placed.size >= pieces.length) {
        window.setTimeout(
          () =>
            finish({
              completed: true,
              correctFirstTry: support.wasFirstTryClean,
              correctEventually: true,
              hintsUsed: support.hintsUsed,
              wrongAttempts: support.wrongAttempts,
            }),
          ctx.reducedMotion ? 380 : 720,
        );
      }
      return "correct";
    },
  });
  ctx.onCleanup(scene.destroy);

  async function autoCompleteRemaining(): Promise<void> {
    speak(speech.help);
    for (const piece of pieces) {
      if (ctx.isCancelled()) return;
      if (placed.has(piece.id)) continue;
      scene.emphasizeTarget(piece.id);
      placed.add(piece.id);
      await scene.autoPlace(piece.id, piece.id);
      await wait(ctx.reducedMotion ? 100 : 280);
    }
    finish({
      completed: true,
      correctFirstTry: false,
      correctEventually: true,
      hintsUsed: support.hintsUsed + 1,
      wrongAttempts: support.wrongAttempts,
    });
  }

  speak(speech.instruction);
  await wait(demonstrationDelay(900));
  if (ctx.isCancelled()) {
    scene.destroy();
    return {
      completed: false,
      correctFirstTry: false,
      correctEventually: false,
      hintsUsed: 0,
      wrongAttempts: 0,
      abandoned: true,
    };
  }
  inputReady = true;
  scene.readyElement.dataset.gameReady = "true";
  cancelWatch = window.setInterval(() => {
    if (ctx.isCancelled()) {
      finish({
        completed: false,
        correctFirstTry: false,
        correctEventually: false,
        hintsUsed: support.hintsUsed,
        wrongAttempts: support.wrongAttempts,
        abandoned: true,
      });
    }
  }, 200);
  const outcome = await result;
  scene.destroy();
  return outcome;
}
