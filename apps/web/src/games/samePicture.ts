/** Golden slice 1: perechi de vehicule-jucărie într-o lume coerentă. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem, drawItem } from "../art/items";
import { LEARN_COLORS, learnColor } from "../art/palette";

const VEHICLES = ITEMS.filter((item) => item.category === "vehicle");
const STARTER_COLORS = LEARN_COLORS.slice(0, 4);

const CONTENT: readonly ContentItem[] = VEHICLES.flatMap((item) =>
  item.recolorable
    ? STARTER_COLORS.map((color) => ({
        id: `${item.id}--${color.id}`,
        attributes: {
          category: item.category,
          baseItem: item.id,
          color: color.id,
        },
      }))
    : [
        {
          id: item.id,
          attributes: {
            category: item.category,
            baseItem: item.id,
            color: item.color,
          },
        },
      ],
);

function vehicleVisual(id: string): {
  readonly svg: string;
  readonly label: string;
  readonly labelDef: string;
} {
  const [baseId, colorId] = id.split("--");
  const item = getItem(baseId ?? id);
  const color = colorId ? learnColor(colorId) : null;
  return {
    svg: drawItem(item.id, color?.hex),
    label: color ? `${item.label}, culoare ${color.label}` : item.label,
    labelDef: item.labelDef,
  };
}

export const samePictureGame = createChoiceGame({
  id: "same-picture",
  title: "Găsește perechea",
  skillId: "visual_discrimination",
  domain: "visual_attention",
  instruction: "Uită-te la imagine! Găsește una la fel!",
  coPlayPrompt:
    "Alegeți două mașinuțe sau două obiecte care arată la fel și puneți-le împreună.",
  icon: () => drawItem("car"),
  bubbleColor: "#FFD35C",
  axes: [
    { name: "choiceCount", values: [2, 3, 4, 5, 6, 8] },
    { name: "distractorSimilarity", values: [0, 1, 2, 3, 4] },
    { name: "targetCueDuration", values: [-1, 2500, 1500, 800, 0] },
    { name: "sceneClutter", values: [0, 1, 2, 3, 4] },
  ],
  initialDifficulty: {
    choiceCount: 2,
    distractorSimilarity: 0,
    targetCueDuration: -1,
    sceneClutter: 0,
  },
  renderer: "pixi",
  content: CONTENT,
  similarityAttribute: "baseItem",
  buildRound: (level) => {
    const target = vehicleVisual(level.targetId);
    return {
      targetSvg: target.svg,
      targetLabel: target.label,
      // Clipurile existente identifică obiectul de bază; culoarea rămâne indiciu vizual.
      roundSpeech: `Uită-te! Aici e ${target.labelDef}. Găsește una la fel!`,
      options: level.choiceIds.map((id) => {
        const visual = vehicleVisual(id);
        return { id, svg: visual.svg, label: visual.label };
      }),
      correctId: level.correctChoiceId,
      joinTargetOnSuccess: true,
    };
  },
});
