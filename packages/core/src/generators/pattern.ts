import { chooseDistinct, createRng } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export type PatternFamily = "AB" | "AAB" | "ABB" | "ABC";

export interface PatternConfig {
  readonly gameId: string;
  readonly symbols: readonly string[];
  readonly family: PatternFamily;
  readonly totalLength: number;
}

export interface PatternPayload {
  readonly visibleSequence: readonly (string | null)[];
  readonly answer: string;
  readonly missingIndex: number;
  readonly family: PatternFamily;
}

function motifSize(family: PatternFamily): number {
  return family === "AB" ? 2 : 3;
}

function motifFor(family: PatternFamily, symbols: readonly string[]): string[] {
  const [a, b, c] = symbols;
  if (a === undefined || b === undefined) throw new Error("Not enough symbols.");
  if (family === "AB") return [a, b];
  if (family === "AAB") return [a, a, b];
  if (family === "ABB") return [a, b, b];
  if (c === undefined) throw new Error("ABC requires three symbols.");
  return [a, b, c];
}

export function generatePattern(
  seed: string,
  config: PatternConfig,
): GeneratedLevel<PatternPayload> {
  const size = motifSize(config.family);
  const symbols = chooseDistinct(config.symbols, size, createRng(`${seed}:symbols`));
  const motif = motifFor(config.family, symbols);
  const length = Math.max(motif.length + 1, config.totalLength);
  const sequence = Array.from({ length }, (_, index) => motif[index % motif.length] as string);
  const missingIndex = length - 1;
  const answer = sequence[missingIndex] as string;
  const visibleSequence: (string | null)[] = [...sequence];
  visibleSequence[missingIndex] = null;

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      patternLength: length,
      patternFamily: config.family,
      missingPositions: 1,
    },
    payload: { visibleSequence, answer, missingIndex, family: config.family },
  };
}
