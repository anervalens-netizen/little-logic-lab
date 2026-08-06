import { attemptEvidence } from "./mastery.js";
import type {
  AttemptOutcome,
  DifficultyAxisSpec,
  DifficultyStep,
  DifficultyVector,
  Scalar,
} from "./types.js";

function scalarEquals(left: Scalar, right: Scalar): boolean {
  return typeof left === typeof right && left === right;
}

function usableResponseMs(outcome: AttemptOutcome): number | null {
  const value = outcome.responseMs;
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 60_000) {
    return null;
  }
  return value;
}

export function recommendDifficultyDirection(
  recentOutcomes: readonly AttemptOutcome[],
): -1 | 0 | 1 {
  const usable = recentOutcomes
    .map(attemptEvidence)
    .filter((value): value is number => value !== null)
    .slice(-4);

  if (usable.length < 2) {
    return 0;
  }

  const average = usable.reduce((sum, value) => sum + value, 0) / usable.length;
  const recent = recentOutcomes.slice(-3);
  const anyDistress = recent.some((outcome) => outcome.distressSignal === true);
  const highHintLoad = recent.reduce((sum, outcome) => sum + outcome.hintsUsed, 0) >= 3;
  const responseSamples = recent
    .map(usableResponseMs)
    .filter((value): value is number => value !== null);
  const slowResponseCount = responseSamples.filter((value) => value >= 12_000).length;

  // Latența singură nu scade dificultatea. Devine semnal numai împreună cu
  // dovezi slabe sau sprijin ridicat, pentru a nu confunda ritmul copilului cu
  // lipsa înțelegerii.
  if (
    anyDistress ||
    average < 0.45 ||
    highHintLoad ||
    (slowResponseCount >= 2 && average < 0.65)
  ) {
    return -1;
  }

  const lastThreeStrong =
    recent.length === 3 &&
    recent.every(
      (outcome) =>
        outcome.correctFirstTry &&
        outcome.hintsUsed === 0 &&
        outcome.wrongAttempts === 0 &&
        (usableResponseMs(outcome) ?? 0) < 10_000,
    );

  return lastThreeStrong && average >= 0.88 ? 1 : 0;
}

export function stepDifficulty(
  current: DifficultyVector,
  axisSpecs: readonly DifficultyAxisSpec[],
  direction: -1 | 0 | 1,
  preferredAxisIndex = 0,
): DifficultyStep {
  if (direction === 0 || axisSpecs.length === 0) {
    return { vector: { ...current }, changedAxis: null, direction: 0 };
  }

  for (let offset = 0; offset < axisSpecs.length; offset += 1) {
    const axis = axisSpecs[(preferredAxisIndex + offset) % axisSpecs.length];
    if (axis === undefined || axis.values.length === 0) {
      continue;
    }

    const currentValue = current[axis.name];
    const currentIndex = axis.values.findIndex((value) =>
      currentValue === undefined ? false : scalarEquals(value, currentValue),
    );
    const startIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = Math.max(
      0,
      Math.min(axis.values.length - 1, startIndex + direction),
    );

    if (nextIndex !== startIndex || currentIndex < 0) {
      const nextValue = axis.values[nextIndex];
      if (nextValue === undefined) {
        continue;
      }
      return {
        vector: { ...current, [axis.name]: nextValue },
        changedAxis: axis.name,
        direction,
      };
    }
  }

  return { vector: { ...current }, changedAxis: null, direction: 0 };
}
