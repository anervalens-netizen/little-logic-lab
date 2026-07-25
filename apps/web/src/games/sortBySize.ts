/** „Mic, mijlociu, mare" — sortare după mărime (același obiect, mărimi diferite). */

import { createRng, chooseOne, type ContentItem } from "@core";
import { createSortGame } from "./sortGame";
import { drawItem } from "../art/items";
import { drawShape } from "../art/shapes";
import { svg } from "../art/svg";

const BASE_ITEMS = ["ball", "car", "apple", "flower", "fish", "balloon"] as const;
const SIZES = [
  { id: "small", label: "mic", scale: 0.45 },
  { id: "medium", label: "mijlociu", scale: 0.72 },
  { id: "large", label: "mare", scale: 1 },
] as const;

/** Culori distincte pentru coșuri (nu mărimea e codată de culoare, ci claritatea). */
const BIN_HEXES = ["#4FA8E8", "#FFD35C", "#FF7A66"];

function contentForSeed(seed: string): readonly ContentItem[] {
  const item = chooseOne([...BASE_ITEMS], createRng(`${seed}:base`));
  return SIZES.map((size) => ({
    id: `${item}--${size.id}`,
    attributes: { size: size.id, item },
  }));
}

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
  instruction: "Pune obiectele după mărime: mici, mijlocii, mari!",
  coPlayPrompt: "Ordonați împreună trei jucării: mică, mijlocie, mare!",
  icon: () => drawShape("circle", "#4FA8E8"),
  bubbleColor: "#4FA8E8",
  axes: [
    { name: "itemCount", values: [2, 3] },
    { name: "binCount", values: [2, 3] },
  ],
  initialDifficulty: { itemCount: 2, binCount: 2 },
  content: [],
  contentForSeed,
  attribute: "size",
  binVisual: (value, index) => {
    const size = SIZES.find((s) => s.id === value) ?? SIZES[1];
    return {
      hex: BIN_HEXES[index % BIN_HEXES.length] ?? "#4FA8E8",
      badge: svg(
        `<circle cx="60" cy="60" r="${(40 * size.scale).toFixed(1)}" fill="#7A68E0"/>`,
      ),
      label: `coșul pentru cele ${size.label === "mic" ? "mici" : size.label === "mijlociu" ? "mijlocii" : "mari"}`,
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
