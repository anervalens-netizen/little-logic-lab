/** Golden slice 1: perechi de vehicule-jucărie într-o lume coerentă. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem, drawItem } from "../art/items";

const VEHICLES = ITEMS.filter((item) => item.category === "vehicle");
const STARTER_ITEMS = VEHICLES.length >= 6 ? VEHICLES : ITEMS.slice(0, 12);

const CONTENT: readonly ContentItem[] = STARTER_ITEMS.map((item) => ({
  id: item.id,
  attributes: { category: item.category, color: item.color },
}));

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
    { name: "choiceCount", values: [2, 3] },
    { name: "distractorSimilarity", values: [0, 1] },
    { name: "targetCueDuration", values: [-1, 2500] },
    { name: "sceneClutter", values: [0, 1] },
  ],
  initialDifficulty: {
    choiceCount: 2,
    distractorSimilarity: 0,
    targetCueDuration: -1,
    sceneClutter: 0,
  },
  renderer: "pixi",
  content: CONTENT,
  similarityAttribute: "category",
  buildRound: (level) => {
    const target = getItem(level.targetId);
    return {
      targetSvg: drawItem(target.id),
      targetLabel: target.labelDef,
      roundSpeech: `Uită-te! Aici e ${target.labelDef}. Găsește una la fel!`,
      options: level.choiceIds.map((id) => {
        const item = getItem(id);
        return { id, svg: drawItem(id), label: item.label };
      }),
      correctId: level.correctChoiceId,
    };
  },
});
