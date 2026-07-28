import type {
  DifficultyAxisSpec,
  DifficultyVector,
} from "@core";
import type { SpeechCueId } from "../audio/speech";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
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
  readonly speechCueId?: SpeechCueId;
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
  readonly instructionCueId?: SpeechCueId;
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
  readonly hintCueId?: SpeechCueId;
  readonly helpSpeech?: string;
  readonly helpCueId?: SpeechCueId;
}

export function createSpatialFitGame(spec: SpatialFitSpec): WebGame {
  return {
    id: spec.id,
    title: spec.title,
    skillId: spec.skillId,
    domain: spec.domain,
    instruction: spec.instruction,
    ...(spec.instructionCueId
      ? { instructionCueId: spec.instructionCueId }
      : {}),
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
          instructionCueId: spec.instructionCueId,
          hint: spec.hintSpeech ?? "Uite, aici se potrivește!",
          hintCueId: spec.hintCueId,
          help: spec.helpSpeech ?? "Hai să le punem împreună!",
          helpCueId: spec.helpCueId,
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

interface SpatialFitSpeech {
  readonly instruction: string;
  readonly instructionCueId?: SpeechCueId;
  readonly hint: string;
  readonly hintCueId?: SpeechCueId;
  readonly help: string;
  readonly helpCueId?: SpeechCueId;
}

function speakWithCue(
  ctx: GameContext,
  cueId: SpeechCueId | undefined,
  text: string,
  opts: { readonly rate?: number } = {},
): Promise<void> {
  return cueId ? ctx.speakCue(cueId, text, opts) : ctx.speak(text, opts);
}

async function playSpatialFitBatch(
  ctx: GameContext,
  pieces: readonly SpatialFitPiece[],
  speech: SpatialFitSpeech,
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
  let operationGeneration = 0;
  let cancelWatch: number | null = null;
  let resolveResult: (result: PlayResult) => void = () => undefined;
  const result = new Promise<PlayResult>((resolve) => {
    resolveResult = resolve;
  });
  const active = (generation: number) =>
    generation === operationGeneration && !settled && !ctx.isCancelled();
  const finish = (outcome: PlayResult) => {
    if (settled) return;
    settled = true;
    inputReady = false;
    operationGeneration += 1;
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
          inputReady = false;
          const generation = ++operationGeneration;
          window.setTimeout(() => {
            if (active(generation)) scene.emphasizeTarget(itemId);
          }, 180);
          void speakWithCue(ctx, speech.hintCueId, speech.hint).then(() => {
            if (active(generation)) inputReady = true;
          });
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
      if (piece?.speech) {
        void speakWithCue(
          ctx,
          piece.speechCueId,
          piece.speech,
          { rate: 1 },
        );
      }
      if (placed.size >= pieces.length) {
        inputReady = false;
        const generation = ++operationGeneration;
        void wait(ctx.reducedMotion ? 380 : 720).then(() => {
          if (!active(generation)) return;
          finish({
            completed: true,
            correctFirstTry: support.wasFirstTryClean,
            correctEventually: true,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
          });
        });
      }
      return "correct";
    },
  });
  ctx.onCleanup(() => {
    operationGeneration += 1;
    scene.destroy();
  });

  async function autoCompleteRemaining(): Promise<void> {
    const generation = ++operationGeneration;
    await speakWithCue(ctx, speech.helpCueId, speech.help);
    if (!active(generation)) return;
    for (const piece of pieces) {
      if (!active(generation)) return;
      if (placed.has(piece.id)) continue;
      scene.emphasizeTarget(piece.id);
      placed.add(piece.id);
      await scene.autoPlace(piece.id, piece.id);
      if (!active(generation)) return;
      await wait(ctx.reducedMotion ? 100 : 280);
    }
    if (!active(generation)) return;
    finish({
      completed: true,
      correctFirstTry: false,
      correctEventually: true,
      hintsUsed: support.hintsUsed + 1,
      wrongAttempts: support.wrongAttempts,
    });
  }

  await Promise.all([
    speakWithCue(ctx, speech.instructionCueId, speech.instruction),
    wait(demonstrationDelay(900)),
  ]);
  if (ctx.isCancelled()) return abortedSpatial();
  inputReady = true;
  scene.readyElement.dataset.gameReady = "true";
  cancelWatch = window.setInterval(() => {
    if (!ctx.isCancelled()) return;
    finish({
      completed: false,
      correctFirstTry: false,
      correctEventually: false,
      hintsUsed: support.hintsUsed,
      wrongAttempts: support.wrongAttempts,
      abandoned: true,
    });
  }, 200);

  return await result;
}

function abortedSpatial(): PlayResult {
  return {
    completed: false,
    correctFirstTry: false,
    correctEventually: false,
    hintsUsed: 0,
    wrongAttempts: 0,
    abandoned: true,
  };
}
