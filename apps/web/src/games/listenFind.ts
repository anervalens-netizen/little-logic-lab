/** Jocul 3: „Ascultă și găsește" — instrucțiune audio, fără model vizual. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem, drawItem } from "../art/items";

const CONTENT: readonly ContentItem[] = ITEMS.map((item) => ({
  id: item.id,
  attributes: { category: item.category },
}));

export const listenFindGame = createChoiceGame({
  id: "listen-find",
  title: "Ascultă și găsește",
  skillId: "receptive_language",
  domain: "language_social",
  instruction: "Ascultă cu atenție și atinge imaginea!",
  coPlayPrompt: "Joacă-te și în cameră: „Atinge ceva moale! Atinge cartea!”",
  icon: () => drawItem("owl"),
  bubbleColor: "#4FA8E8",
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
      targetSvg: null,
      targetLabel: target.labelDef,
      roundSpeech: `Atinge ${target.labelDef}!`,
      options: level.choiceIds.map((id) => {
        const item = getItem(id);
        return { id, svg: drawItem(id), label: item.label };
      }),
      correctId: level.correctChoiceId,
    };
  },
});
