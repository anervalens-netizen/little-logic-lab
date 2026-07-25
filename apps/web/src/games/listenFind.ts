/** Jocul 3: „Ascultă și găsește" — instrucțiune audio, fără model vizual. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { ITEMS, getItem, drawItem } from "../art/items";
import { svg } from "../art/svg";

const CONTENT: readonly ContentItem[] = ITEMS.map((item) => ({
  id: item.id,
  attributes: {
    category: item.category,
    color: item.color,
    categoryColor: `${item.category}:${item.color}`,
  },
}));

const LISTEN_CUE = svg(`
  <circle cx="60" cy="60" r="44" fill="#EAF7FF" stroke="#4FA8E8" stroke-width="4"/>
  <path d="M 25 52 H 40 L 58 36 V 84 L 40 68 H 25 Z" fill="#4FA8E8" stroke="#2F86C8" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 70 48 Q 82 60 70 72 M 78 38 Q 98 60 78 82" fill="none" stroke="#9B8CF2" stroke-width="5" stroke-linecap="round"/>
`);

function listenPrompt(labelDef: string, utteranceLength: number): string {
  const label = `${labelDef.charAt(0).toUpperCase()}${labelDef.slice(1)}`;
  if (utteranceLength <= 1) return `${label}.`;
  if (utteranceLength === 2) return `Atinge ${labelDef}!`;
  if (utteranceLength === 4) return `Atinge imaginea cu ${labelDef}!`;
  if (utteranceLength === 5) return `Ascultă și atinge acum ${labelDef}!`;
  if (utteranceLength === 6) {
    return `Ascultă atent și atinge acum ${labelDef}!`;
  }
  return `Ascultă cu atenție și atinge imaginea cu ${labelDef}!`;
}

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
    { name: "choiceCount", values: [2, 3, 4, 5, 6, 8] },
    { name: "utteranceLength", values: [1, 2, 4, 6, 5, 8] },
    { name: "attributeCount", values: [1, 2, 3, 4] },
    {
      name: "repeatAvailability",
      values: ["always", "limited", "on_request"],
    },
  ],
  initialDifficulty: {
    choiceCount: 2,
    utteranceLength: 1,
    attributeCount: 1,
    repeatAvailability: "always",
  },
  renderer: "pixi",
  content: CONTENT,
  similarityAttributeForDifficulty: (difficulty) => {
    const attributeCount = Number(difficulty["attributeCount"] ?? 1);
    if (attributeCount >= 4) return "categoryColor";
    if (attributeCount >= 3) return "color";
    if (attributeCount >= 2) return "category";
    return undefined;
  },
  buildRound: (level, difficulty) => {
    const target = getItem(level.targetId);
    return {
      targetSvg: LISTEN_CUE,
      targetLabel: "instrucțiunea audio",
      targetActionLabel: "Repetă cerința audio",
      roundSpeech: listenPrompt(
        target.labelDef,
        Number(difficulty["utteranceLength"] ?? 1),
      ),
      options: level.choiceIds.map((id) => {
        const item = getItem(id);
        return { id, svg: drawItem(id), label: item.label };
      }),
      correctId: level.correctChoiceId,
    };
  },
});
