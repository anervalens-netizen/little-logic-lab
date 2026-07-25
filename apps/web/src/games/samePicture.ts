/** Jocul 1: „Găsește perechea identică" — potrivire vizuală exactă. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem } from "../art/items";
import { drawItem } from "../art/items";
import { drawLumi } from "../art/lumi";

const CONTENT: readonly ContentItem[] = ITEMS.map((item) => ({
  id: item.id,
  attributes: { category: item.category, color: item.color },
}));

export const samePictureGame = createChoiceGame({
  id: "same-picture",
  title: "Găsește perechea",
  skillId: "visual_discrimination",
  domain: "visual_attention",
  instruction: "Uită-te la imagine! Găsește una la fel!",
  coPlayPrompt: "Hai să căutăm prin casă două lucruri care arată la fel!",
  icon: () => drawItem("cat"),
  bubbleColor: "#FFD35C",
  axes: [
    { name: "choiceCount", values: [2, 3] },
    { name: "distractorSimilarity", values: [0, 1] },
  ],
  initialDifficulty: { choiceCount: 2, distractorSimilarity: 0 },
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

export { drawLumi };
