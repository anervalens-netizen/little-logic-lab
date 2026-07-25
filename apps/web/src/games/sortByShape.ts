/** „Casa formelor" — sortare după formă geometrică. */

import type { ContentItem } from "@core";
import { createSortGame } from "./sortGame";
import { drawShape, SHAPE_LABELS, type ShapeId } from "../art/shapes";
import { LEARN_COLORS } from "../art/palette";

const SHAPES: readonly ShapeId[] = ["circle", "square", "triangle", "star", "heart"];
const COLORS = LEARN_COLORS.slice(0, 5);

const CONTENT: readonly ContentItem[] = SHAPES.flatMap((shape) =>
  COLORS.map((color) => ({
    id: `${shape}--${color.id}`,
    attributes: { shape, color: color.id },
  })),
);

export const sortByShapeGame = createSortGame({
  id: "sort-by-shape",
  title: "Casa formelor",
  skillId: "classification_shape",
  domain: "classification",
  instruction: "Fiecare formă are casa ei! Pune formele la locul lor!",
  coPlayPrompt: "Căutați în casă lucruri rotunde ca un cerc și colțuroase ca un pătrat!",
  icon: () => drawShape("star", "#FFD35C"),
  bubbleColor: "#7FC86B",
  axes: [
    { name: "itemCount", values: [2, 3, 4, 6, 8, 10, 12] },
    { name: "binCount", values: [2, 3, 4] },
    { name: "ruleCount", values: [1, 2] },
    { name: "ruleCueVisibility", values: ["always", "on_request", "at_switch"] },
  ],
  initialDifficulty: {
    itemCount: 2,
    binCount: 2,
    ruleCount: 1,
    ruleCueVisibility: "always",
  },
  renderer: "pixi",
  content: CONTENT,
  attribute: "shape",
  binVisual: (value, index) => ({
    hex: ["#FFB6A3", "#B9C3E8", "#A8DFA8"][index % 3] ?? "#C9C2BA",
    badge: drawShape(value as ShapeId, "#8D857C", { face: false }),
    label: `casa ${SHAPE_LABELS[value as ShapeId] ?? value}`,
  }),
  itemVisual: (itemId) => {
    const [shape, colorId] = itemId.split("--");
    const color = COLORS.find((c) => c.id === colorId) ?? COLORS[0]!;
    return {
      id: itemId,
      svg: drawShape((shape ?? "circle") as ShapeId, color.hex),
      speakOnPlace: SHAPE_LABELS[(shape ?? "circle") as ShapeId],
    };
  },
});
