import type { StoredAttempt } from './storage';

export const GOLDEN_JOURNEY_IDS = ['same-picture', 'sort-by-color', 'inset-puzzle'] as const;
const golden = new Set<string>(GOLDEN_JOURNEY_IDS);

export function hasCompletedGoldenJourney(attempts: readonly StoredAttempt[]): boolean {
  const successful = attempts.filter(attempt => golden.has(attempt.gameId) && attempt.completed && attempt.correctEventually && !attempt.abandoned);
  return successful.length >= 4 && new Set(successful.map(attempt => attempt.gameId)).size >= 2;
}
