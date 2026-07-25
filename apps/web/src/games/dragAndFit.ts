/** „Mută și potrivește" — obiecte mari în siluetele lor. */

import { chooseDistinct, createRng, type DifficultyVector } from "@core";
import { drawItem, ITEMS } from "../art/items";
import { createSpatialFitGame, type SpatialFitPiece } from "./spatialFitGame";

const STARTER_IDS = [
  "cat",
  "fish",
  "car",
  "bus",
  "apple",
  "ball",
  "flower",
  "house",
  "sun",
  "cloud",
] as const;

function targetOpacity(difficulty: DifficultyVector): number {
  switch (difficulty["outlineSupport"]) {
    case "none":
      return 0.08;
    case "partial":
      return 0.2;
    default:
      return 0.42;
  }
}

export const dragAndFitGame = createSpatialFitGame({
  id: "drag-and-fit",
  title: "Mută și potrivește",
  skillId: "visual_motor",
  domain: "fine_motor_creativity",
  instruction: "Mută fiecare obiect peste locul lui!",
  coPlayPrompt: "Puneți capace mari în recipiente potrivite.",
  icon: () => drawItem("ball"),
  bubbleColor: "#4FA8E8",
  axes: [
    { name: "pieceCount", values: [2, 3, 4, 6, 10] },
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
    const rng = createRng(seed);
    const count = Math.max(
      2,
      Math.min(Number(difficulty["pieceCount"] ?? 2), ITEMS.length),
    );
    const similarity = Number(difficulty["similarity"] ?? 0);
    const rotationEnabled = difficulty["rotationEnabled"] === true;
    const category =
      ITEMS[Math.floor(rng() * ITEMS.length)]?.category ?? "animal";
    const similarPool = ITEMS.filter((item) => item.category === category);
    const fallbackPool = ITEMS.filter((item) =>
      STARTER_IDS.includes(item.id as (typeof STARTER_IDS)[number]),
    );
    const sameCategoryCount =
      similarity > 0
        ? Math.min(count, 2 + similarity * 2, similarPool.length)
        : 0;
    const similarItems = chooseDistinct(similarPool, sameCategoryCount, rng);
    const basePool =
      similarity > 0
        ? ITEMS.filter((item) => !similarItems.includes(item))
        : [...fallbackPool, ...ITEMS.filter((item) => !fallbackPool.includes(item))];
    const selected = [
      ...similarItems,
      ...chooseDistinct(basePool, count - similarItems.length, rng),
    ];
    const opacity = targetOpacity(difficulty);
    const pieces: SpatialFitPiece[] = selected.map((item) => ({
      id: item.id,
      label: item.label,
      pieceSvg: drawItem(item.id),
      targetSvg: drawItem(item.id),
      targetOpacity: opacity,
      rotation: rotationEnabled
        ? (rng() > 0.5 ? 1 : -1) * (Math.PI / 10 + rng() * Math.PI / 4)
        : 0,
    }));
    return {
      pieces,
      itemOrder: chooseDistinct(
        pieces.map((piece) => piece.id),
        pieces.length,
        createRng(`${seed}:pieces`),
      ),
    };
  },
});
