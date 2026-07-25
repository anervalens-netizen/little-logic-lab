/**
 * Persistență locală versionată. R1 va muta repository-ul în IndexedDB;
 * schema v2 repară deja replay-ul și limitele de sesiune fără pierdere de date.
 */

const STORAGE_KEY = "minte-in-joaca/v2";
const LEGACY_STORAGE_KEY = "minte-in-joaca/v1";

export interface StoredAttempt {
  readonly atLocal: string;
  readonly sessionId: string;
  readonly gameId: string;
  readonly skillId: string;
  readonly levelSeed: string;
  readonly ladderStageId: string;
  readonly contentVersion: string;
  readonly completed: boolean;
  readonly correctFirstTry: boolean;
  readonly correctEventually: boolean;
  readonly hintsUsed: number;
  readonly wrongAttempts: number;
  readonly abandoned: boolean;
}

export interface StoredGameProgress {
  readonly difficulty: Record<string, string | number | boolean>;
  readonly recentOutcomes: readonly StoredAttempt[];
  readonly timesPlayed: number;
}

export interface StoredSession {
  readonly sessionId: string;
  readonly atLocal: string;
  readonly minutes: number;
  readonly gamesPlayed: number;
}

export interface StoredProfile {
  readonly schemaVersion: 2;
  readonly createdAtLocal: string;
  readonly ageMonths: number;
  readonly settings: {
    audioEnabled: boolean;
    musicEnabled: boolean;
    voiceEnabled: boolean;
    reducedMotion: boolean;
    sessionMinutes: 3 | 5 | 7;
    coPlayPrompts: boolean;
  };
  readonly masteryBySkill: Record<
    string,
    { alpha: number; beta: number; evidenceCount: number; lastPracticedAtLocal: string | null }
  >;
  readonly progressByGame: Record<string, StoredGameProgress>;
  readonly attempts: readonly StoredAttempt[];
  readonly sessions: readonly StoredSession[];
}

interface LegacyAttempt {
  readonly atLocal: string;
  readonly gameId: string;
  readonly skillId: string;
  readonly completed: boolean;
  readonly correctFirstTry: boolean;
  readonly correctEventually: boolean;
  readonly hintsUsed: number;
  readonly wrongAttempts: number;
  readonly abandoned: boolean;
}

interface LegacyProfile {
  readonly schemaVersion: 1;
  readonly createdAtLocal: string;
  readonly ageMonths: number;
  readonly settings: StoredProfile["settings"];
  readonly masteryBySkill: StoredProfile["masteryBySkill"];
  readonly progressByGame: Record<
    string,
    {
      readonly difficulty: Record<string, string | number | boolean>;
      readonly recentOutcomes: readonly LegacyAttempt[];
      readonly timesPlayed: number;
    }
  >;
  readonly attempts: readonly LegacyAttempt[];
  readonly sessions: readonly { atLocal: string; minutes: number; gamesPlayed: number }[];
}

export function defaultProfile(ageMonths = 31): StoredProfile {
  return {
    schemaVersion: 2,
    createdAtLocal: new Date().toISOString(),
    ageMonths,
    settings: {
      audioEnabled: true,
      musicEnabled: false,
      voiceEnabled: true,
      reducedMotion: true,
      sessionMinutes: 5,
      coPlayPrompts: true,
    },
    masteryBySkill: {},
    progressByGame: {},
    attempts: [],
    sessions: [],
  };
}

export function loadProfile(): StoredProfile {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current) as StoredProfile;
      if (parsed.schemaVersion === 2) return parsed;
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacy(JSON.parse(legacy) as LegacyProfile);
      saveProfile(migrated);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch {
    // Date corupte: profil conservator nou; jocul nu trebuie să se blocheze.
  }
  return defaultProfile();
}

export function saveProfile(profile: StoredProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Stocarea plină nu trebuie să oprească joaca.
  }
}

export function wipeProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function exportProfileJson(profile: StoredProfile): string {
  return JSON.stringify(profile, null, 2);
}

function migrateLegacy(profile: LegacyProfile): StoredProfile {
  const migrateAttempt = (attempt: LegacyAttempt, index: number): StoredAttempt => ({
    ...attempt,
    sessionId: "legacy",
    levelSeed: `legacy:${attempt.gameId}:${index}`,
    ladderStageId: `${attempt.gameId}:legacy`,
    contentVersion: "legacy",
  });

  const progressByGame = Object.fromEntries(
    Object.entries(profile.progressByGame).map(([gameId, progress]) => [
      gameId,
      {
        ...progress,
        recentOutcomes: progress.recentOutcomes.map(migrateAttempt),
      },
    ]),
  );

  return {
    ...profile,
    schemaVersion: 2,
    settings: { ...profile.settings, reducedMotion: profile.settings.reducedMotion ?? true },
    progressByGame,
    attempts: profile.attempts.map(migrateAttempt),
    sessions: profile.sessions.map((session, index) => ({
      ...session,
      sessionId: `legacy-session:${index}`,
    })),
  };
}
