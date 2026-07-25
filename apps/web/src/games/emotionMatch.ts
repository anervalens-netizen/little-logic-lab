/** Jocul 4: „Cum se simte?" — recunoașterea emoțiilor de bază. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { drawEmotion, EMOTION_LABELS, EMOTION_LABELS_F, ALL_EMOTIONS, type EmotionId } from "../art/faces";

const CONTENT: readonly ContentItem[] = ALL_EMOTIONS.map((id) => ({
  id,
  attributes: {
    valence:
      id === "happy" || id === "surprised" || id === "calm"
        ? "positive"
        : "other",
  },
}));

const SKIN_TONES = [
  "#FFD35C",
  "#F2C4A5",
  "#C98B5E",
  "#8C5A3C",
  "#E8B58F",
  "#A66B47",
  "#F6D0B1",
  "#74462F",
] as const;

function roundSpeech(id: EmotionId, contextLength: number): string {
  const label = EMOTION_LABELS_F[id];
  if (contextLength <= 1) {
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}!`;
  }
  if (contextLength === 2) return `Este ${label}.`;
  if (contextLength === 3) return `Fața este ${label}.`;
  return `Cum se simte? Este ${label}.`;
}

export const emotionMatchGame = createChoiceGame({
  id: "emotion-match",
  title: "Cum se simte?",
  skillId: "emotion_recognition",
  domain: "language_social",
  instruction: "Privește fețele! Cum se simte?",
  coPlayPrompt: "Faceți fețe unul altuia: fericit, trist, supărat. Ghiciți emoția!",
  icon: () => drawEmotion("happy"),
  bubbleColor: "#FF9EC6",
  axes: [
    { name: "choiceCount", values: [2, 3, 4, 5, 6, 8] },
    { name: "contextLength", values: [1, 2, 3, 4] },
    { name: "perspectiveCount", values: [1, 2] },
    { name: "ambiguity", values: [0, 1] },
  ],
  initialDifficulty: {
    choiceCount: 2,
    contextLength: 1,
    perspectiveCount: 1,
    ambiguity: 0,
  },
  renderer: "pixi",
  content: CONTENT,
  similarityAttribute: "valence",
  similarityAxis: "ambiguity",
  buildRound: (level, difficulty) => {
    const targetId = level.targetId as EmotionId;
    const multiplePerspectives = Number(difficulty["perspectiveCount"] ?? 1) > 1;
    const contextLength = Number(difficulty["contextLength"] ?? 1);
    return {
      targetSvg: drawEmotion(targetId),
      targetLabel: `fața ${EMOTION_LABELS_F[targetId]}`,
      roundSpeech: roundSpeech(targetId, contextLength),
      options: level.choiceIds.map((id, index) => ({
        id,
        svg: drawEmotion(
          id as EmotionId,
          multiplePerspectives
            ? (SKIN_TONES[index % SKIN_TONES.length] ?? SKIN_TONES[0])
            : SKIN_TONES[0],
        ),
        label: EMOTION_LABELS[id as EmotionId],
      })),
      correctId: level.correctChoiceId,
    };
  },
});
