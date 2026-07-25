/** Fețe de emoții pentru „Cum se simte?" — simple, lizibile, prietenoase. */

import { svg, INK } from "./svg";

export type EmotionId = "happy" | "sad" | "angry" | "scared" | "surprised" | "sleepy";

export const EMOTION_LABELS: Record<EmotionId, string> = {
  happy: "fericit",
  sad: "trist",
  angry: "supărat",
  scared: "speriat",
  surprised: "uimit",
  sleepy: "somnoros",
};

export const EMOTION_LABELS_F: Record<EmotionId, string> = {
  happy: "fericită",
  sad: "tristă",
  angry: "supărată",
  scared: "speriată",
  surprised: "uimită",
  sleepy: "somnoroasă",
};

export const ALL_EMOTIONS: readonly EmotionId[] = [
  "happy",
  "sad",
  "angry",
  "scared",
  "surprised",
  "sleepy",
];

export function drawEmotion(id: EmotionId, skin = "#FFD35C"): string {
  const eye = (cx: number, cy: number, r = 5) =>
    `<circle class="lll-eye" cx="${cx}" cy="${cy}" r="${r}" fill="${INK}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.3}" fill="#fff"/>`;

  let features = "";
  switch (id) {
    case "happy":
      features = `
        <path d="M 38 48 Q 43 42 48 48 M 72 48 Q 77 42 82 48" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
        <path d="M 44 62 Q 60 78 76 62 Q 70 74 60 74 Q 50 74 44 62 Z" fill="${INK}"/>
        <circle cx="34" cy="58" r="5.5" fill="#FFB6A3" opacity="0.85"/>
        <circle cx="86" cy="58" r="5.5" fill="#FFB6A3" opacity="0.85"/>`;
      break;
    case "sad":
      features = `
        <path d="M 38 44 Q 43 40 48 43 M 72 43 Q 77 40 82 44" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        ${eye(45, 52)}${eye(75, 52)}
        <path d="M 46 74 Q 60 64 74 74" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
        <path d="M 82 58 Q 86 64 82 68 Q 78 64 82 58 Z" fill="#7FC4E8"/>`;
      break;
    case "angry":
      features = `
        <path d="M 36 42 L 50 48 M 84 42 L 70 48" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
        ${eye(45, 55)}${eye(75, 55)}
        <path d="M 46 74 Q 60 66 74 74" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
        <circle cx="34" cy="62" r="5" fill="#F25C4C" opacity="0.5"/>
        <circle cx="86" cy="62" r="5" fill="#F25C4C" opacity="0.5"/>`;
      break;
    case "scared":
      features = `
        <path d="M 36 40 Q 43 36 50 40 M 70 40 Q 77 36 84 40" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="45" cy="52" r="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="75" cy="52" r="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="45" cy="53" r="3.6" fill="${INK}"/>
        <circle cx="75" cy="53" r="3.6" fill="${INK}"/>
        <ellipse cx="60" cy="72" rx="6" ry="8" fill="${INK}"/>`;
      break;
    case "surprised":
      features = `
        <path d="M 36 40 Q 43 34 50 38 M 70 38 Q 77 34 84 40" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
        ${eye(45, 52, 6)}${eye(75, 52, 6)}
        <circle cx="60" cy="72" r="7" fill="${INK}"/>
        <circle cx="60" cy="72" r="3" fill="#E85C47"/>`;
      break;
    case "sleepy":
      features = `
        <path d="M 38 52 Q 43 56 48 52 M 72 52 Q 77 56 82 52" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <ellipse cx="60" cy="70" rx="7" ry="9" fill="${INK}"/>
        <ellipse cx="60" cy="73" rx="4" ry="5" fill="#FF9EC6"/>`;
      break;
  }

  return svg(`
    <circle cx="60" cy="60" r="42" fill="${skin}" stroke="${skin === "#FFD35C" ? "#E8B23C" : "#C98B5E"}" stroke-width="3.5"/>
    ${features}
  `);
}
