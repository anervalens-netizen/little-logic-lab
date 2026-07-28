import type { StoredAttempt, StoredProfile } from "./storage";
import { isGameAgeEligible } from "./content";
import { GAME_IDS } from "../generated/game-registry";

export const GOLDEN_JOURNEY_IDS = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
] as const;

const GOLDEN_SET = new Set<string>(GOLDEN_JOURNEY_IDS);

/**
 * Child Mode păstrează permanent accesibile cele trei mecanici de bază. Restul
 * catalogului se deschide gradual, dar nu cere perfecțiune și nu pedepsește
 * folosirea sprijinului.
 */
export function unlockedGameIds(
  profile: StoredProfile,
  implementedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const unlocked = new Set<string>();

  for (const gameId of GOLDEN_JOURNEY_IDS) {
    if (
      implementedIds.has(gameId) &&
      isGameAgeEligible(gameId, profile.ageMonths)
    ) {
      unlocked.add(gameId);
    }
  }

  let gateOpen = isGoldenJourneyReady(profile);
  for (const gameId of GAME_IDS) {
    if (GOLDEN_SET.has(gameId)) continue;
    if (!isGameAgeEligible(gameId, profile.ageMonths)) continue;
    if (!implementedIds.has(gameId) || !gateOpen) break;

    unlocked.add(gameId);
    gateOpen = isReadyForNextGame(
      profile.progressByGame[gameId]?.recentOutcomes ?? [],
    );
  }

  return unlocked;
}

export function isGoldenJourneyReady(profile: StoredProfile): boolean {
  const outcomes = GOLDEN_JOURNEY_IDS.flatMap(
    (gameId) => profile.progressByGame[gameId]?.recentOutcomes ?? [],
  );
  const successful = outcomes.filter(isSuccessfulAttempt);
  const practicedGames = new Set(successful.map((attempt) => attempt.gameId));

  return successful.length >= 4 && practicedGames.size >= 2;
}

export function isReadyForNextGame(
  outcomes: readonly StoredAttempt[],
): boolean {
  const successful = outcomes.filter(isSuccessfulAttempt);
  if (successful.length < 2) return false;

  const manageableSupport = successful.filter(
    (attempt) => attempt.hintsUsed <= 1 && attempt.wrongAttempts <= 1,
  );
  const sessions = new Set(successful.map((attempt) => attempt.sessionId));

  return (
    manageableSupport.length >= 1 ||
    (successful.length >= 3 && sessions.size >= 2) ||
    sessions.has("legacy")
  );
}

function isSuccessfulAttempt(attempt: StoredAttempt): boolean {
  return (
    attempt.completed &&
    attempt.correctEventually &&
    !attempt.abandoned
  );
}
