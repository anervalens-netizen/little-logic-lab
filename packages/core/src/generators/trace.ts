import { createRng } from "../rng.js";
import type { GeneratedLevel } from "../types.js";

export type TracePathWidth = "very_wide" | "wide" | "medium" | "narrow";
export type TraceGuideStrength = "full" | "partial" | "faint" | "on_request";

export interface TracePoint {
  readonly x: number;
  readonly y: number;
}

export interface TraceConfig {
  readonly gameId: string;
  readonly pathLength: number;
  readonly pathWidth: TracePathWidth;
  readonly turnCount: number;
  readonly guideStrength: TraceGuideStrength;
}

export interface TracePayload {
  readonly points: readonly TracePoint[];
  readonly pathWidth: TracePathWidth;
  readonly guideStrength: TraceGuideStrength;
}

/** Generează o rută normalizată, deterministă și fără fundături. */
export function generateTracePath(
  seed: string,
  config: TraceConfig,
): GeneratedLevel<TracePayload> {
  if (!Number.isInteger(config.pathLength) || config.pathLength < 1 || config.pathLength > 8) {
    throw new Error("pathLength must be an integer between 1 and 8.");
  }
  if (!Number.isInteger(config.turnCount) || config.turnCount < 0 || config.turnCount > 10) {
    throw new Error("turnCount must be an integer between 0 and 10.");
  }

  const rng = createRng(seed);
  const segmentCount = Math.max(
    2,
    Math.min(12, config.pathLength + Math.ceil(config.turnCount / 2) + 1),
  );
  const waveCount = Math.max(1, Math.ceil(config.turnCount / 2));
  const direction = rng() < 0.5 ? -1 : 1;
  const amplitude = config.turnCount === 0 ? 0 : Math.min(0.18, 0.07 + config.turnCount * 0.011);
  const points = Array.from({ length: segmentCount + 1 }, (_, index) => {
    const progress = index / segmentCount;
    const baseY = 0.76 - progress * 0.52;
    const wave =
      Math.sin(progress * Math.PI * waveCount) *
      amplitude *
      direction *
      Math.sin(progress * Math.PI);
    return {
      x: 0.12 + progress * 0.76,
      y: Math.max(0.12, Math.min(0.88, baseY + wave)),
    };
  });

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      pathLength: config.pathLength,
      pathWidth: config.pathWidth,
      turnCount: config.turnCount,
      guideStrength: config.guideStrength,
    },
    payload: {
      points,
      pathWidth: config.pathWidth,
      guideStrength: config.guideStrength,
    },
  };
}
