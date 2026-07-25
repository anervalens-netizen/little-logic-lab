import type { StoredProfile } from "./storage";
import { isGameAgeEligible } from "./content";

const P0_ORDER = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
  "daily-order",
  "one-to-one-count",
  "shadow-match",
  "peek-and-find",
  "wait-for-go",
  "listen-find",
  "trace-road",
  "emotion-match",
  "sort-by-shape",
  "sort-by-size",
  "drag-and-fit",
  "real-color-hunt",
] as const;

export function unlockedGameIds(
  profile: StoredProfile,
  implementedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const unlocked = new Set<string>();

  for (const gameId of P0_ORDER) {
    if (!isGameAgeEligible(gameId, profile.ageMonths)) continue;
    if (implementedIds.has(gameId)) unlocked.add(gameId);

    const progress = profile.progressByGame[gameId];
    if (!progress || !isReadyForNextGame(progress.recentOutcomes)) break;
  }

  return unlocked;
}

function isReadyForNextGame(
  outcomes: StoredProfile["progressByGame"][string]["recentOutcomes"],
): boolean {
  const clean = outcomes.filter(
    (attempt) =>
      attempt.completed &&
      attempt.correctFirstTry &&
      attempt.hintsUsed === 0 &&
      attempt.wrongAttempts === 0 &&
      !attempt.abandoned,
  );
  if (clean.length < 3) return false;

  const sessions = new Set(clean.map((attempt) => attempt.sessionId));
  return sessions.size >= 2 || sessions.has("legacy");
}
