/** Jocul 4: „Cum se simte?" — recunoașterea emoțiilor de bază. */

import type { ContentItem } from "@core";
import { createChoiceGame } from "./choiceGame";
import { drawEmotion, EMOTION_LABELS, EMOTION_LABELS_F, ALL_EMOTIONS, type EmotionId } from "../art/faces";

const CONTENT: readonly ContentItem[] = ALL_EMOTIONS.map((id) => ({
  id,
  attributes: { valence: id === "happy" || id === "surprised" ? "positive" : "other" },
}));

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
    { name: "choiceCount", values: [2, 3] },
    { name: "distractorSimilarity", values: [0, 1] },
  ],
  initialDifficulty: { choiceCount: 2, distractorSimilarity: 0 },
  content: CONTENT,
  similarityAttribute: "valence",
  buildRound: (level) => {
    const targetId = level.targetId as EmotionId;
    return {
      targetSvg: drawEmotion(targetId),
      targetLabel: `fața ${EMOTION_LABELS_F[targetId]}`,
      roundSpeech: `Aici e fața ${EMOTION_LABELS_F[targetId]}. Găsește una la fel!`,
      options: level.choiceIds.map((id) => ({
        id,
        svg: drawEmotion(id as EmotionId),
        label: EMOTION_LABELS[id as EmotionId],
      })),
      correctId: level.correctChoiceId,
    };
  },
});
