import { createRng, randomInt, shuffle } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export interface NumberChoiceConfig {
  readonly gameId: string;
  readonly maxQuantity: number;
  readonly choiceCount: number;
}

export interface NumberChoicePayload {
  readonly targetQuantity: number;
  readonly options: readonly number[];
  readonly correctChoice: number;
}

export function generateNumberChoice(
  seed: string,
  config: NumberChoiceConfig,
): GeneratedLevel<NumberChoicePayload> {
  if (config.maxQuantity < 2) throw new Error("maxQuantity must be at least 2.");
  if (config.choiceCount < 2 || config.choiceCount > config.maxQuantity) {
    throw new Error("choiceCount must be between 2 and maxQuantity.");
  }

  const rng = createRng(seed);
  const target = randomInt(rng, 1, config.maxQuantity);
  const optionSet = new Set<number>([target]);
  while (optionSet.size < config.choiceCount) {
    optionSet.add(randomInt(rng, 1, config.maxQuantity));
  }
  const options = shuffle([...optionSet], rng);

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      maxQuantity: config.maxQuantity,
      choiceCount: config.choiceCount,
    },
    payload: {
      targetQuantity: target,
      options,
      correctChoice: target,
    },
  };
}
