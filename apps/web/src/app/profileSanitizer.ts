import type {
  StoredAttempt,
  StoredGameProgress,
  StoredProfile,
  StoredSession,
} from "./storage";
import { defaultProfile } from "./storage";

export interface ProfileRepairResult {
  readonly profile: StoredProfile;
  readonly repairs: readonly string[];
}

const scalar = (value: unknown): value is string | number | boolean =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  typeof value === "boolean";

const nonNegativeInteger = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback;

const positiveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;

const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function sanitizeAttempt(
  value: unknown,
  repairs: string[],
  path: string,
): (StoredAttempt & { readonly responseMs?: number }) | null {
  if (typeof value !== "object" || value === null) {
    repairs.push(`${path}: removed invalid attempt`);
    return null;
  }
  const attempt = value as Record<string, unknown>;
  const requiredStrings = [
    "sessionId",
    "gameId",
    "skillId",
    "levelSeed",
    "ladderStageId",
    "contentVersion",
  ] as const;
  if (
    !validDate(attempt.atLocal) ||
    requiredStrings.some((key) => typeof attempt[key] !== "string") ||
    typeof attempt.completed !== "boolean" ||
    typeof attempt.correctFirstTry !== "boolean" ||
    typeof attempt.correctEventually !== "boolean"
  ) {
    repairs.push(`${path}: removed malformed attempt`);
    return null;
  }

  const responseMs =
    typeof attempt.responseMs === "number" &&
    Number.isFinite(attempt.responseMs) &&
    attempt.responseMs >= 0 &&
    attempt.responseMs <= 60_000
      ? Math.round(attempt.responseMs)
      : undefined;
  if (attempt.responseMs !== undefined && responseMs === undefined) {
    repairs.push(`${path}: discarded invalid responseMs`);
  }

  return {
    atLocal: attempt.atLocal,
    sessionId: attempt.sessionId as string,
    gameId: attempt.gameId as string,
    skillId: attempt.skillId as string,
    levelSeed: attempt.levelSeed as string,
    ladderStageId: attempt.ladderStageId as string,
    contentVersion: attempt.contentVersion as string,
    completed: attempt.completed,
    correctFirstTry: attempt.correctFirstTry,
    correctEventually: attempt.correctEventually,
    hintsUsed: nonNegativeInteger(attempt.hintsUsed),
    wrongAttempts: nonNegativeInteger(attempt.wrongAttempts),
    abandoned: attempt.abandoned === true,
    ...(responseMs === undefined ? {} : { responseMs }),
  };
}

function sanitizeProgress(
  value: unknown,
  repairs: string[],
  gameId: string,
): StoredGameProgress | null {
  if (typeof value !== "object" || value === null) {
    repairs.push(`progress.${gameId}: removed invalid progress`);
    return null;
  }
  const progress = value as Record<string, unknown>;
  const difficulty =
    typeof progress.difficulty === "object" && progress.difficulty !== null
      ? Object.fromEntries(
          Object.entries(progress.difficulty as Record<string, unknown>).filter(
            (entry): entry is [string, string | number | boolean] =>
              entry[0].length > 0 && scalar(entry[1]),
          ),
        )
      : {};
  const rawOutcomes = Array.isArray(progress.recentOutcomes)
    ? progress.recentOutcomes
    : [];
  const recentOutcomes = rawOutcomes
    .map((attempt, index) =>
      sanitizeAttempt(attempt, repairs, `progress.${gameId}[${index}]`),
    )
    .filter((attempt): attempt is StoredAttempt => attempt !== null)
    .slice(-8);

  return {
    difficulty,
    recentOutcomes,
    timesPlayed: Math.max(
      recentOutcomes.length,
      nonNegativeInteger(progress.timesPlayed),
    ),
  };
}

function sanitizeSession(
  value: unknown,
  repairs: string[],
  index: number,
): StoredSession | null {
  if (typeof value !== "object" || value === null) {
    repairs.push(`sessions[${index}]: removed invalid session`);
    return null;
  }
  const session = value as Record<string, unknown>;
  if (
    typeof session.sessionId !== "string" ||
    !validDate(session.atLocal) ||
    typeof session.minutes !== "number" ||
    !Number.isFinite(session.minutes)
  ) {
    repairs.push(`sessions[${index}]: removed malformed session`);
    return null;
  }
  return {
    sessionId: session.sessionId,
    atLocal: session.atLocal,
    minutes: Math.max(0.1, Math.min(60, session.minutes)),
    gamesPlayed: nonNegativeInteger(session.gamesPlayed),
  };
}

/** Repară secțiunile invalide fără a șterge progresul sănătos. */
export function sanitizeProfile(value: unknown): ProfileRepairResult {
  const fallback = defaultProfile();
  const repairs: string[] = [];
  if (typeof value !== "object" || value === null) {
    return { profile: fallback, repairs: ["profile: replaced invalid root"] };
  }
  const source = value as Record<string, unknown>;
  const settingsSource =
    typeof source.settings === "object" && source.settings !== null
      ? (source.settings as Record<string, unknown>)
      : {};

  const settings: StoredProfile["settings"] = {
    audioEnabled:
      typeof settingsSource.audioEnabled === "boolean"
        ? settingsSource.audioEnabled
        : fallback.settings.audioEnabled,
    musicEnabled:
      typeof settingsSource.musicEnabled === "boolean"
        ? settingsSource.musicEnabled
        : fallback.settings.musicEnabled,
    voiceEnabled:
      typeof settingsSource.voiceEnabled === "boolean"
        ? settingsSource.voiceEnabled
        : fallback.settings.voiceEnabled,
    reducedMotion:
      typeof settingsSource.reducedMotion === "boolean"
        ? settingsSource.reducedMotion
        : fallback.settings.reducedMotion,
    highContrast:
      typeof settingsSource.highContrast === "boolean"
        ? settingsSource.highContrast
        : fallback.settings.highContrast,
    targetSize:
      settingsSource.targetSize === "extra_large" ? "extra_large" : "large",
    demonstrationSpeed:
      settingsSource.demonstrationSpeed === "slow" ? "slow" : "normal",
    sessionMinutes:
      settingsSource.sessionMinutes === 3 ||
      settingsSource.sessionMinutes === 5 ||
      settingsSource.sessionMinutes === 7
        ? settingsSource.sessionMinutes
        : fallback.settings.sessionMinutes,
    coPlayPrompts:
      typeof settingsSource.coPlayPrompts === "boolean"
        ? settingsSource.coPlayPrompts
        : fallback.settings.coPlayPrompts,
  };

  const masterySource =
    typeof source.masteryBySkill === "object" && source.masteryBySkill !== null
      ? (source.masteryBySkill as Record<string, unknown>)
      : {};
  const masteryBySkill = Object.fromEntries(
    Object.entries(masterySource).flatMap(([skillId, raw]) => {
      if (typeof raw !== "object" || raw === null) {
        repairs.push(`mastery.${skillId}: removed invalid entry`);
        return [];
      }
      const mastery = raw as Record<string, unknown>;
      return [
        [
          skillId,
          {
            alpha: positiveNumber(mastery.alpha, 2),
            beta: positiveNumber(mastery.beta, 2),
            evidenceCount: nonNegativeInteger(mastery.evidenceCount),
            lastPracticedAtLocal:
              mastery.lastPracticedAtLocal === null ||
              validDate(mastery.lastPracticedAtLocal)
                ? (mastery.lastPracticedAtLocal as string | null)
                : null,
          },
        ],
      ];
    }),
  );

  const progressSource =
    typeof source.progressByGame === "object" && source.progressByGame !== null
      ? (source.progressByGame as Record<string, unknown>)
      : {};
  const progressByGame = Object.fromEntries(
    Object.entries(progressSource).flatMap(([gameId, raw]) => {
      const progress = sanitizeProgress(raw, repairs, gameId);
      return progress ? [[gameId, progress]] : [];
    }),
  );

  const attempts = (Array.isArray(source.attempts) ? source.attempts : [])
    .map((attempt, index) =>
      sanitizeAttempt(attempt, repairs, `attempts[${index}]`),
    )
    .filter((attempt): attempt is StoredAttempt => attempt !== null)
    .slice(-500);
  const sessions = (Array.isArray(source.sessions) ? source.sessions : [])
    .map((session, index) => sanitizeSession(session, repairs, index))
    .filter((session): session is StoredSession => session !== null)
    .slice(-120);

  const ageMonths = Math.max(
    30,
    Math.min(72, nonNegativeInteger(source.ageMonths, fallback.ageMonths)),
  );
  if (ageMonths !== source.ageMonths) repairs.push("profile: normalized ageMonths");

  return {
    profile: {
      schemaVersion: 4,
      createdAtLocal: validDate(source.createdAtLocal)
        ? source.createdAtLocal
        : fallback.createdAtLocal,
      ageMonths,
      sessionLocked: source.sessionLocked === true,
      settings,
      masteryBySkill,
      progressByGame,
      attempts,
      sessions,
    },
    repairs,
  };
}
