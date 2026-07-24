export type Rng = () => number;

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string | number): Rng {
  let state = typeof seed === "number" ? seed >>> 0 : hashString(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive) || maxInclusive < minInclusive) {
    throw new Error("Invalid integer range.");
  }
  return Math.floor(rng() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    const current = copy[index];
    copy[index] = copy[swapIndex] as T;
    copy[swapIndex] = current as T;
  }
  return copy;
}

export function chooseOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error("Cannot choose from an empty list.");
  }
  return items[randomInt(rng, 0, items.length - 1)] as T;
}

export function chooseDistinct<T>(items: readonly T[], count: number, rng: Rng): T[] {
  if (count < 0 || count > items.length) {
    throw new Error(`Cannot choose ${count} distinct items from ${items.length}.`);
  }
  return shuffle(items, rng).slice(0, count);
}
