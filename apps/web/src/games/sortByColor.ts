/** „Coșurile de culori" — sortare după culoare (2 coșuri la început). */

import type { ContentItem } from "@core";
import { createSortGame } from "./sortGame";
import { ITEMS, drawItem } from "../art/items";
import { LEARN_COLORS, learnColor } from "../art/palette";

const RECOLORABLE = ITEMS.filter((item) => item.recolorable);
const BAND_A_COLORS = LEARN_COLORS.slice(0, 4); // roșu, albastru, galben, verde

const CONTENT: readonly ContentItem[] = RECOLORABLE.flatMap((item) =>
  BAND_A_COLORS.map((color) => ({
    id: `${item.id}--${color.id}`,
    attributes: { color: color.id, item: item.id },
  })),
);

export const sortByColorGame = createSortGame({
  id: "sort-by-color",
  title: "Coșurile de culori",
  skillId: "classification_color",
  domain: "classification",
  instruction: "Pune fiecare lucru în coșul de aceeași culoare!",
  coPlayPrompt: "Căutați în cameră lucruri roșii și lucruri albastre. În ce coș le-ați pune?",
  icon: () => drawItem("ball", "#F25C4C"),
  bubbleColor: "#F25C4C",
  axes: [
    { name: "itemCount", values: [2, 3, 4] },
    { name: "binCount", values: [2, 3] },
  ],
  initialDifficulty: { itemCount: 2, binCount: 2 },
  renderer: "pixi",
  content: CONTENT,
  attribute: "color",
  binVisual: (value) => {
    const color = learnColor(value);
    return { hex: color.hex, label: `coșul ${color.label}` };
  },
  itemVisual: (itemId) => {
    const [baseId, colorId] = itemId.split("--");
    const color = learnColor(colorId ?? "red");
    return {
      id: itemId,
      svg: drawItem(baseId ?? "ball", color.hex),
      speakOnPlace: color.label,
    };
  },
});
