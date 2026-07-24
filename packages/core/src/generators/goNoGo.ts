import { createRng, shuffle } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export interface GoNoGoConfig {
  readonly gameId: string;
  readonly trialCount: number;
  readonly goRatio: number;
  readonly goStimulusId: string;
  readonly noGoStimulusId: string;
}

export interface GoNoGoTrial {
  readonly index: number;
  readonly stimulusId: string;
  readonly expectedAction: "tap" | "wait";
}

export interface GoNoGoPayload {
  readonly trials: readonly GoNoGoTrial[];
}

export function generateGoNoGo(
  seed: string,
  config: GoNoGoConfig,
): GeneratedLevel<GoNoGoPayload> {
  if (config.trialCount < 2) throw new Error("trialCount must be at least 2.");
  if (config.goRatio <= 0 || config.goRatio >= 1) {
    throw new Error("goRatio must be between 0 and 1.");
  }

  const rng = createRng(seed);
  const goCount = Math.max(1, Math.min(
    config.trialCount - 1,
    Math.round(config.trialCount * config.goRatio),
  ));
  const raw = [
    ...Array.from({ length: goCount }, () => "tap" as const),
    ...Array.from({ length: config.trialCount - goCount }, () => "wait" as const),
  ];
  const actions = shuffle(raw, rng);

  const trials = actions.map((action, index) => ({
    index,
    stimulusId:
      action === "tap" ? config.goStimulusId : config.noGoStimulusId,
    expectedAction: action,
  }));

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: { trialCount: config.trialCount, goNoGoRatio: config.goRatio },
    payload: { trials },
  };
}
