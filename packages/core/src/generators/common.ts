import { chooseDistinct, chooseOne, createRng } from "../rng.js";

export interface ContentItem {
  readonly id: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export function ensurePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export function pickItems(
  seed: string,
  items: readonly ContentItem[],
  count: number,
): ContentItem[] {
  ensurePositiveInteger(count, "count");
  return chooseDistinct(items, count, createRng(seed));
}

export function pickAttribute(
  seed: string,
  allowed: readonly string[],
): string {
  return chooseOne(allowed, createRng(seed));
}
