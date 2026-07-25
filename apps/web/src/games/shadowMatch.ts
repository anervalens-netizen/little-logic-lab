/** Jocul 2: „Potrivește umbra" — ținta e colorată, opțiunile sunt siluete. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem, drawItem } from "../art/items";

const CONTENT: readonly ContentItem[] = ITEMS.map((item) => ({
  id: item.id,
  attributes: { category: item.category },
}));

/** Siluetă: același desen, întunecat complet prin filtru CSS. */
function shadowSvg(id: string): string {
  const markup = drawItem(id);
  return markup.replace("<svg ", `<svg style="filter:brightness(0) saturate(0) opacity(0.82);" `);
}

export const shadowMatchGame = createChoiceGame({
  id: "shadow-match",
  title: "Potrivește umbra",
  skillId: "visual_discrimination",
  domain: "visual_attention",
  instruction: "Privește imaginea! Unde e umbra potrivită?",
  coPlayPrompt: "Ieșiți afară și căutați umbre: a copacului, a casei, a voastră!",
  icon: () => shadowSvg("elephant"),
  bubbleColor: "#9B8CF2",
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
  similarityAttribute: "category",
  buildRound: (level) => {
    const target = getItem(level.targetId);
    return {
      targetSvg: drawItem(target.id),
      targetLabel: target.labelDef,
      roundSpeech: "Privește imaginea! Găsește umbra potrivită!",
      options: level.choiceIds.map((id) => {
        const item = getItem(id);
        return { id, svg: shadowSvg(id), label: `umbra ${item.label}` };
      }),
      correctId: level.correctChoiceId,
    };
  },
});
