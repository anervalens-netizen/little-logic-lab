/** Golden slice 3: puzzle spațial pe masa atelierului de jucării. */

import { chooseDistinct, createRng } from "@core";
import {
  ALL_SHAPES,
  drawWorkshopShape,
  drawWorkshopShapeHole,
  SHAPE_LABELS,
  type ShapeId,
} from "../art/shapes";
import { LEARN_COLORS } from "../art/palette";
import { createSpatialFitGame } from "./spatialFitGame";

const EASY: readonly ShapeId[] = ALL_SHAPES;
const SIMILAR_PAIRS: readonly ShapeId[][] = [
  ["circle", "oval"],
  ["square", "diamond"],
  ["pentagon", "hexagon"],
  ["star", "heart"],
];

function outlineOpacity(value: unknown): number {
  if (value === "none") return 0.16;
  if (value === "partial") return 0.56;
  return 1;
}

export const insetPuzzleGame = createSpatialFitGame({
  id: "inset-puzzle",
  title: "Pune forma la loc",
  skillId: "spatial_matching",
  domain: "spatial_planning",
  instruction: "Pune fiecare formă în gaura ei!",
  coPlayPrompt: "Căutați acasă capace și cutii care se potrivesc între ele!",
  icon: () => drawWorkshopShape("heart", "#FF9EC6"),
  bubbleColor: "#FF9EC6",
  axes: [
    { name: "pieceCount", values: [2, 3, 4, 5, 6, 7, 8, 10] },
    { name: "rotationEnabled", values: [false, true] },
    { name: "outlineSupport", values: ["full", "partial", "none"] },
    { name: "similarity", values: [0, 1, 2, 3, 4] },
  ],
  initialDifficulty: {
    pieceCount: 2,
    rotationEnabled: false,
    outlineSupport: "full",
    similarity: 0,
  },
  buildRound(difficulty, seed) {
    const pieceCount = Math.max(2, Number(difficulty["pieceCount"] ?? 2));
    const similarity = Number(difficulty["similarity"] ?? 0);
    const rotationEnabled = difficulty["rotationEnabled"] === true;
    const rng = createRng(seed);
    const count = Math.min(pieceCount, EASY.length);
    const prioritized = SIMILAR_PAIRS.slice(0, similarity).flat();
    const priority = [...new Set(prioritized)].slice(0, count);
    const remainder = EASY.filter((shape) => !priority.includes(shape));
    const shapes = [
      ...priority,
      ...chooseDistinct(remainder, count - priority.length, rng),
    ];
    const colors = chooseDistinct(
      [...LEARN_COLORS],
      Math.min(shapes.length, LEARN_COLORS.length),
      rng,
    );
    return {
      pieces: shapes.map((shape, index) => ({
        id: shape,
        label: SHAPE_LABELS[shape],
        speech: SHAPE_LABELS[shape],
        pieceSvg: drawWorkshopShape(
          shape,
          colors[index % colors.length]?.hex ?? "#F25C4C",
        ),
        targetSvg: drawWorkshopShapeHole(shape),
        targetOpacity: outlineOpacity(difficulty["outlineSupport"]),
        rotation: rotationEnabled
          ? (rng() > 0.5 ? 1 : -1) * (Math.PI / 8 + rng() * Math.PI / 5)
          : 0,
      })),
      itemOrder: chooseDistinct(
        shapes,
        shapes.length,
        createRng(`${seed}:pieces`),
      ),
    };
  },
});
