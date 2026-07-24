import { createRng, shuffle } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export interface OrderConfig {
  readonly gameId: string;
  readonly orderedStepIds: readonly string[];
  readonly distractorIds?: readonly string[];
}

export interface OrderPayload {
  readonly presentedIds: readonly string[];
  readonly correctOrderIds: readonly string[];
  readonly distractorIds: readonly string[];
}

export function generateOrderLevel(
  seed: string,
  config: OrderConfig,
): GeneratedLevel<OrderPayload> {
  if (config.orderedStepIds.length < 2) {
    throw new Error("At least two ordered steps are required.");
  }
  const distractors = config.distractorIds ?? [];
  const rng = createRng(seed);
  const presentedIds = shuffle([...config.orderedStepIds, ...distractors], rng);

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      stepCount: config.orderedStepIds.length,
      distractorCount: distractors.length,
    },
    payload: {
      presentedIds,
      correctOrderIds: [...config.orderedStepIds],
      distractorIds: [...distractors],
    },
  };
}
