import type { AgeBandId, DifficultyVector, Scalar } from "./types.js";

const BAND_ORDER: readonly AgeBandId[] = ["A30_36", "B36_48", "C48_60", "D60_72"];
const BAND_RANK: Readonly<Record<AgeBandId, number>> = {
  A30_36: 0,
  B36_48: 1,
  C48_60: 2,
  D60_72: 3,
};

export interface LevelAnchorChange {
  readonly axis: string;
  readonly from: Scalar;
  readonly to: Scalar;
}

export interface LevelAnchor {
  readonly id: string;
  readonly index: number;
  readonly recommendedBand: AgeBandId;
  readonly difficulty: DifficultyVector;
  readonly change: LevelAnchorChange | null;
  readonly purpose: string;
}

export interface LevelLadder {
  readonly gameId: string;
  readonly entryBand: AgeBandId;
  readonly stages: readonly LevelAnchor[];
}

export function compareAgeBands(left: AgeBandId, right: AgeBandId): number {
  return BAND_RANK[left] - BAND_RANK[right];
}

export function selectInitialAnchor(
  ladder: LevelLadder,
  ageBand: AgeBandId,
): LevelAnchor | null {
  if (compareAgeBands(ageBand, ladder.entryBand) < 0 || ladder.stages.length === 0) {
    return null;
  }

  const exactBand = ladder.stages.find((stage) => stage.recommendedBand === ageBand);
  if (exactBand !== undefined) return exactBand;

  const eligible = ladder.stages.filter(
    (stage) => compareAgeBands(stage.recommendedBand, ageBand) <= 0,
  );
  return eligible.at(-1) ?? ladder.stages[0] ?? null;
}

export function moveOnLadder(
  ladder: LevelLadder,
  currentStageId: string,
  direction: -1 | 0 | 1,
): LevelAnchor | null {
  const currentIndex = ladder.stages.findIndex((stage) => stage.id === currentStageId);
  if (currentIndex < 0) return null;
  if (direction === 0) return ladder.stages[currentIndex] ?? null;
  const nextIndex = Math.max(0, Math.min(ladder.stages.length - 1, currentIndex + direction));
  return ladder.stages[nextIndex] ?? null;
}

export function changedDifficultyAxes(
  previous: DifficultyVector,
  next: DifficultyVector,
): string[] {
  const axes = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return [...axes].filter(
    (axis) => JSON.stringify(previous[axis]) !== JSON.stringify(next[axis]),
  );
}

export function isSingleAxisTransition(
  previous: DifficultyVector,
  next: DifficultyVector,
): boolean {
  return changedDifficultyAxes(previous, next).length === 1;
}

export function ageBandIds(): readonly AgeBandId[] {
  return BAND_ORDER;
}
