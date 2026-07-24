import { chooseDistinct, chooseOne, createRng, shuffle } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";
import type { ContentItem } from "./common.js";

export interface VisualChoiceConfig {
  readonly gameId: string;
  readonly items: readonly ContentItem[];
  readonly choiceCount: number;
  readonly similarityAttribute?: string;
}

export interface VisualChoicePayload {
  readonly targetId: string;
  readonly choiceIds: readonly string[];
  readonly correctChoiceId: string;
}

export function generateVisualChoice(
  seed: string,
  config: VisualChoiceConfig,
): GeneratedLevel<VisualChoicePayload> {
  const rng = createRng(seed);
  if (config.choiceCount < 2 || config.choiceCount > config.items.length) {
    throw new Error("choiceCount must be between 2 and the item count.");
  }

  const target = chooseOne(config.items, rng);
  let distractorPool = config.items.filter((item) => item.id !== target.id);

  if (config.similarityAttribute !== undefined) {
    const targetValue = target.attributes[config.similarityAttribute];
    const similar = distractorPool.filter(
      (item) => item.attributes[config.similarityAttribute as string] === targetValue,
    );
    const different = distractorPool.filter(
      (item) => item.attributes[config.similarityAttribute as string] !== targetValue,
    );
    distractorPool = [...similar, ...different];
  }

  const distractors = chooseDistinct(
    distractorPool,
    config.choiceCount - 1,
    rng,
  );
  const choiceIds = shuffle([target, ...distractors], rng).map((item) => item.id);
  const difficulty: DifficultyVector = {
    choiceCount: config.choiceCount,
    distractorSimilarity: config.similarityAttribute === undefined ? 0 : 1,
  };

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty,
    payload: {
      targetId: target.id,
      choiceIds,
      correctChoiceId: target.id,
    },
  };
}
