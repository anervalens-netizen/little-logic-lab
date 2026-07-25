/** Paleta aplicației — culori calde, blânde, cu contrast bun. */

export const COLORS = {
  cream: "#FFF9EE",
  paper: "#FFFDF7",
  ink: "#4A3F35",
  inkSoft: "#7A6C5D",
  sun: "#FFD35C",
  sunDeep: "#FFB63C",
  coral: "#FF7A66",
  coralDeep: "#E85C47",
  blue: "#4FA8E8",
  blueDeep: "#2F86C8",
  sky: "#BFE3F2",
  grass: "#7FC86B",
  grassDeep: "#4E9A51",
  purple: "#9B8CF2",
  purpleDeep: "#7A68E0",
  pink: "#FF9EC6",
  pinkDeep: "#F272A7",
  brown: "#A67B5B",
  brownDeep: "#7D5A40",
  white: "#FFFFFF",
  gray: "#B8B2AA",
  orange: "#FFA94D",
} as const;

export type ColorName = keyof typeof COLORS;

/** Culorile „de învățat" pentru copii — cu nume rostite în română. */
export const LEARN_COLORS = [
  { id: "red", hex: "#F25C4C", label: "roșu", labelAcc: "roșu" },
  { id: "blue", hex: "#4FA8E8", label: "albastru", labelAcc: "albastru" },
  { id: "yellow", hex: "#FFD35C", label: "galben", labelAcc: "galben" },
  { id: "green", hex: "#7FC86B", label: "verde", labelAcc: "verde" },
  { id: "purple", hex: "#9B8CF2", label: "mov", labelAcc: "mov" },
  { id: "pink", hex: "#FF9EC6", label: "roz", labelAcc: "roz" },
  { id: "orange", hex: "#FFA94D", label: "portocaliu", labelAcc: "portocaliu" },
  { id: "brown", hex: "#A67B5B", label: "maro", labelAcc: "maro" },
] as const;

export type LearnColorId = (typeof LEARN_COLORS)[number]["id"];

export function learnColor(id: string) {
  const found = LEARN_COLORS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown learn color: ${id}`);
  return found;
}

/** Nuanță mai închisă pentru contururi pe baza unei culori hex. */
export function shade(hex: string, factor = 0.72): string {
  const raw = hex.replace("#", "");
  const num = parseInt(raw, 16);
  const r = Math.round(((num >> 16) & 0xff) * factor);
  const g = Math.round(((num >> 8) & 0xff) * factor);
  const b = Math.round((num & 0xff) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Nuanță mai deschisă (amestec cu alb). */
export function tint(hex: string, amount = 0.45): string {
  const raw = hex.replace("#", "");
  const num = parseInt(raw, 16);
  const r = Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount);
  const g = Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount);
  const b = Math.round((num & 0xff) + (255 - (num & 0xff)) * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
