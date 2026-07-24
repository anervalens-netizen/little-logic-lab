import { chooseOne, createRng } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export interface MemorySequenceConfig {
  readonly gameId: string;
  readonly symbols: readonly string[];
  readonly sequenceLength: number;
  readonly allowImmediateRepeat?: boolean;
}

export interface MemorySequencePayload {
  readonly sequence: readonly string[];
}

export function generateMemorySequence(
  seed: string,
  config: MemorySequenceConfig,
): GeneratedLevel<MemorySequencePayload> {
  if (config.symbols.length < 2) throw new Error("At least two symbols are required.");
  if (config.sequenceLength < 1) throw new Error("sequenceLength must be positive.");

  const rng = createRng(seed);
  const sequence: string[] = [];
  while (sequence.length < config.sequenceLength) {
    const symbol = chooseOne(config.symbols, rng);
    if (
      config.allowImmediateRepeat !== true &&
      sequence.length > 0 &&
      sequence[sequence.length - 1] === symbol
    ) {
      continue;
    }
    sequence.push(symbol);
  }

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      sequenceLength: config.sequenceLength,
      modalityCount: 1,
    },
    payload: { sequence },
  };
}
