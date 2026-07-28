/** Golden slice 2: vehicule-jucărie sortate în garaje colorate. */

import type { ContentItem } from "@core";
import { createSortGame } from "./sortGame";
import { ITEMS, drawItem } from "../art/items";
import { LEARN_COLORS, learnColor } from "../art/palette";

const VEHICLES = ITEMS.filter(
  (item) => item.recolorable && item.category === "vehicle",
);
const SORTABLE_ITEMS =
  VEHICLES.length >= 3
    ? VEHICLES
    : ITEMS.filter((item) => item.recolorable).slice(0, 8);
const BAND_A_COLORS = LEARN_COLORS.slice(0, 4);

const CONTENT: readonly ContentItem[] = SORTABLE_ITEMS.flatMap((item) =>
  BAND_A_COLORS.map((color) => ({
    id: `${item.id}--${color.id}`,
    attributes: { color: color.id, item: item.id },
  })),
);

function garageBadge(color: string): string {
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 51 L60 18 L102 51 V104 H18Z" fill="${color}" stroke="#4A3F35" stroke-width="5" stroke-linejoin="round"/>
    <rect x="35" y="57" width="50" height="47" rx="8" fill="#FFFDF7" stroke="#4A3F35" stroke-width="5"/>
    <path d="M35 70 H85 M35 83 H85" stroke="${color}" stroke-width="5" opacity=".72"/>
    <circle cx="49" cy="96" r="4" fill="#4A3F35"/><circle cx="72" cy="96" r="4" fill="#4A3F35"/>
  </svg>`;
}

export const sortByColorGame = createSortGame({
  id: "sort-by-color",
  title: "Coșurile de culori",
  skillId: "classification_color",
  domain: "classification",
  instruction: "Pune fiecare lucru în coșul de aceeași culoare!",
  coPlayPrompt:
    "Alegeți mașinuțe sau obiecte roșii și albastre și parcați-le în două locuri diferite.",
  icon: () => drawItem("car", "#F25C4C"),
  bubbleColor: "#F25C4C",
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
  attribute: "color",
  binVisual: (value) => {
    const color = learnColor(value);
    return {
      hex: color.hex,
      badge: garageBadge(color.hex),
      // Menținem termenul din clipul audio actual; pachetul Higgs va putea
      // schimba împreună copy-ul și asset-ul după auditul nativ.
      label: `coșul ${color.label}, desenat ca un garaj`,
    };
  },
  itemVisual: (itemId) => {
    const [baseId, colorId] = itemId.split("--");
    const color = learnColor(colorId ?? "red");
    return {
      id: itemId,
      svg: drawItem(baseId ?? "car", color.hex),
      speakOnPlace: color.label,
    };
  },
});
