/** „Pune forma la loc" — puzzle cu forme: fiecare piesă în gaura ei. */

import { createRng, chooseDistinct, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { drawShape, drawShapeHole, SHAPE_LABELS, type ShapeId } from "../art/shapes";
import { LEARN_COLORS } from "../art/palette";

const EASY: readonly ShapeId[] = ["circle", "square", "triangle", "star", "heart"];
const SIMILAR_PAIRS: readonly ShapeId[][] = [
  ["circle", "oval"],
  ["square", "diamond"],
  ["star", "heart"],
];

export const insetPuzzleGame: WebGame = {
  id: "inset-puzzle",
  title: "Pune forma la loc",
  skillId: "spatial_matching",
  domain: "spatial_planning",
  instruction: "Fiecare formă are locul ei! Pune forma în gaura potrivită!",
  coPlayPrompt: "Căutați acasă capace și cutii care se potrivesc între ele!",
  icon: () => drawShape("heart", "#FF9EC6"),
  bubbleColor: "#FF9EC6",
  axes: [
    { name: "pieceCount", values: [2, 3, 4] },
    { name: "similarity", values: [0, 1] },
  ],
  initialDifficulty: { pieceCount: 2, similarity: 0 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const pieceCount = Math.max(2, Number(difficulty["pieceCount"] ?? 2));
    const similar = Number(difficulty["similarity"] ?? 0) >= 1;
    const rng = createRng(seed);

    const pool = similar && pieceCount <= 2 ? (SIMILAR_PAIRS[Math.floor(rng() * SIMILAR_PAIRS.length)] ?? EASY) : EASY;
    const shapes = chooseDistinct([...pool], Math.min(pieceCount, pool.length), rng);
    const colors = chooseDistinct([...LEARN_COLORS], shapes.length, rng);
    const piecesOrder = chooseDistinct(shapes, shapes.length, createRng(`${seed}:pieces`));

    return playPixiInsetRound(ctx, shapes, piecesOrder, colors);
  },
};

async function playPixiInsetRound(
  ctx: GameContext,
  shapes: readonly ShapeId[],
  piecesOrder: readonly ShapeId[],
  colors: readonly (typeof LEARN_COLORS)[number][],
): Promise<PlayResult> {
  clear(ctx.mount);
  const { createPixiDragScene } = await import("../runtime/pixiDragScene");
  const support = new SupportTracker();
  const placed = new Set<ShapeId>();
  const colorByShape = new Map(
    shapes.map((shape, index) => [
      shape,
      colors[index]?.hex ?? "#F25C4C",
    ]),
  );
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
    items: piecesOrder.map((shape) => ({
      id: shape,
      svg: drawShape(shape, colorByShape.get(shape) ?? "#F25C4C"),
      label: SHAPE_LABELS[shape],
    })),
    targets: shapes.map((shape) => ({
      id: shape,
      svg: drawShapeHole(shape),
      label: `gaura ${SHAPE_LABELS[shape]}`,
    })),
    presentation: "holes",
    reducedMotion: ctx.reducedMotion,
    onDrop(itemId, targetId) {
      if (!inputReady || settled || simplifying) return "ignore";
      const shape = itemId as ShapeId;
      const hole = targetId as ShapeId;
      if (shape !== hole) {
        const verdict = support.registerError();
        if (verdict === "hint") {
          window.setTimeout(() => scene.emphasizeTarget(shape), 180);
          speak("Uite, aici se potrivește!");
        } else if (verdict === "simplify") {
          simplifying = true;
          inputReady = false;
          void autoCompleteRemaining();
        }
        return "incorrect";
      }

      support.registerSuccess();
      placed.add(shape);
      sfxPlace();
      speak(SHAPE_LABELS[shape], { rate: 1 });
      if (placed.size >= shapes.length) {
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
    speak("Hai să le punem împreună!");
    for (const shape of shapes) {
      if (ctx.isCancelled()) return;
      if (placed.has(shape)) continue;
      scene.emphasizeTarget(shape);
      placed.add(shape);
      await scene.autoPlace(shape, shape);
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

  speak("Pune fiecare formă în gaura ei!");
  await wait(900);
  if (ctx.isCancelled()) {
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
  return result;
}
