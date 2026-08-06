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

// Hexagonul nu are încă un clip local real. Nu îl introducem în nivelurile mici;
// rămâne disponibil numai în stage-ul maxim până la pachetul Higgs revizuit.
const SHAPES_WITH_AUDIO: readonly ShapeId[] = ALL_SHAPES.filter(
  (shape) => shape !== "hexagon",
);
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
  instructionCueId: "inset-instruction",
  hintSpeech: "Uite, aici se potrivește!",
  hintCueId: "inset-hint",
  helpSpeech: "Hai să le punem împreună!",
  helpCueId: "inset-help",
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
    const requestedCount = Math.max(2, Number(difficulty["pieceCount"] ?? 2));
    const similarity = Number(difficulty["similarity"] ?? 0);
    const rotationEnabled = difficulty["rotationEnabled"] === true;
    const rng = createRng(seed);
    const availableShapes =
      requestedCount > SHAPES_WITH_AUDIO.length ? ALL_SHAPES : SHAPES_WITH_AUDIO;
    const count = Math.min(requestedCount, availableShapes.length);
    const prioritized = SIMILAR_PAIRS.slice(0, similarity)
      .flat()
      .filter((shape) => availableShapes.includes(shape));
    const priority = [...new Set(prioritized)].slice(0, count);
    const remainder = availableShapes.filter((shape) => !priority.includes(shape));
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
        ...(shape === "hexagon"
          ? {}
          : { speechCueId: `shape-${shape}` }),
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
