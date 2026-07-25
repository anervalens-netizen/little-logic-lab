/** „Mic, mijlociu, mare" — sortare după mărime (același obiect, mărimi diferite). */

import type { ContentItem } from "@core";
import { createSortGame } from "./sortGame";
import { drawItem } from "../art/items";
import { drawShape } from "../art/shapes";
import { svg } from "../art/svg";

const BASE_ITEMS = ["ball", "car", "apple", "flower", "fish", "balloon"] as const;
const SIZES = [
  { id: "small", label: "mic", plural: "mici", scale: 0.4 },
  { id: "medium", label: "mijlociu", plural: "mijlocii", scale: 0.6 },
  { id: "large", label: "mare", plural: "mari", scale: 0.8 },
  { id: "extra-large", label: "foarte mare", plural: "foarte mari", scale: 1 },
] as const;

/** Culori distincte pentru coșuri (nu mărimea e codată de culoare, ci claritatea). */
const BIN_HEXES = ["#4FA8E8", "#FFD35C", "#FF9EC6", "#FF7A66"];

const CONTENT: readonly ContentItem[] = BASE_ITEMS.flatMap((item) =>
  SIZES.map((size) => ({
    id: `${item}--${size.id}`,
    attributes: { size: size.id, item },
  })),
);

function sizedSvg(itemId: string, sizeId: string): string {
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[1];
  const inner = drawItem(itemId);
  return svg(
    `<g transform="translate(60 60) scale(${size.scale}) translate(-60 -60)">${inner.replace(/<\/?svg[^>]*>/g, "")}</g>`,
  );
}

export const sortBySizeGame = createSortGame({
  id: "sort-by-size",
  title: "Mic, mijlociu, mare",
  skillId: "classification_size",
  domain: "classification",
  instruction: "Pune obiectele după mărime, de la mici la foarte mari!",
  coPlayPrompt: "Ordonați împreună trei jucării: mică, mijlocie, mare!",
  icon: () => drawShape("circle", "#4FA8E8"),
  bubbleColor: "#4FA8E8",
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
  attribute: "size",
  binVisual: (value, index) => {
    const size = SIZES.find((s) => s.id === value) ?? SIZES[1];
    return {
      hex: BIN_HEXES[index % BIN_HEXES.length] ?? "#4FA8E8",
      badge: svg(
        `<circle cx="60" cy="60" r="${(40 * size.scale).toFixed(1)}" fill="#7A68E0"/>`,
      ),
      label: `coșul pentru cele ${size.plural}`,
    };
  },
  itemVisual: (itemId) => {
    const [baseId, sizeId] = itemId.split("--");
    const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[1];
    return {
      id: itemId,
      svg: sizedSvg(baseId ?? "ball", sizeId ?? "medium"),
      speakOnPlace: size.label,
    };
  },
});
