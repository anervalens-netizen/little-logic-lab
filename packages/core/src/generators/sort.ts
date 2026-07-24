import { createRng, shuffle } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";
import type { ContentItem } from "./common.js";

export interface SortConfig {
  readonly gameId: string;
  readonly items: readonly ContentItem[];
  readonly attribute: string;
  readonly binCount: number;
  readonly itemCount: number;
}

export interface SortPayload {
  readonly attribute: string;
  readonly bins: readonly string[];
  readonly itemIds: readonly string[];
  readonly correctBinByItemId: Readonly<Record<string, string>>;
}

export function generateSortLevel(
  seed: string,
  config: SortConfig,
): GeneratedLevel<SortPayload> {
  const rng = createRng(seed);
  const values = [...new Set(
    config.items
      .map((item) => item.attributes[config.attribute])
      .filter((value): value is string => value !== undefined),
  )];

  if (values.length < config.binCount) {
    throw new Error(`Not enough distinct values for attribute ${config.attribute}.`);
  }

  const bins = shuffle(values, rng).slice(0, config.binCount);
  const eligible = config.items.filter((item) => {
    const value = item.attributes[config.attribute];
    return value !== undefined && bins.includes(value);
  });

  if (eligible.length < config.itemCount) {
    throw new Error("Not enough eligible items for the requested sort level.");
  }

  const selected = shuffle(eligible, rng).slice(0, config.itemCount);
  const correctBinByItemId: Record<string, string> = {};
  for (const item of selected) {
    const value = item.attributes[config.attribute];
    if (value === undefined) throw new Error("Missing sort attribute.");
    correctBinByItemId[item.id] = value;
  }

  const difficulty: DifficultyVector = {
    itemCount: config.itemCount,
    binCount: config.binCount,
    ruleCount: 1,
  };

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty,
    payload: {
      attribute: config.attribute,
      bins,
      itemIds: selected.map((item) => item.id),
      correctBinByItemId,
    },
  };
}
