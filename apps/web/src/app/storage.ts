/** Persistență locală IndexedDB, cu migrare și fallback fără blocarea jocului. */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DATABASE_NAME = "minte-in-joaca";
const DATABASE_VERSION = 1;
const PROFILE_STORE = "profiles";
const CURRENT_PROFILE_KEY = "current";
const RECOVERY_PROFILE_KEY = "recovery-latest";
const FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v2";
const STORAGE_KEY = "minte-in-joaca/v2";
const LEGACY_STORAGE_KEY = "minte-in-joaca/v1";

interface LogicLabDatabase extends DBSchema {
  profiles: {
    key: string;
    value: unknown;
  };
}

let databasePromise: Promise<IDBPDatabase<LogicLabDatabase>> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

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

function database(): Promise<IDBPDatabase<LogicLabDatabase>> {
  databasePromise ??= openDB<LogicLabDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROFILE_STORE)) {
          db.createObjectStore(PROFILE_STORE);
        }
      },
    },
  );
  return databasePromise;
}

function isStoredProfile(value: unknown): value is StoredProfile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoredProfile>;
  return (
    candidate.schemaVersion === 2 &&
    typeof candidate.createdAtLocal === "string" &&
    typeof candidate.ageMonths === "number" &&
    typeof candidate.settings === "object" &&
    candidate.settings !== null &&
    typeof candidate.masteryBySkill === "object" &&
    candidate.masteryBySkill !== null &&
    typeof candidate.progressByGame === "object" &&
    candidate.progressByGame !== null &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.sessions)
  );
}

function readLocalMigrationCandidate(): StoredProfile | null {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (isStoredProfile(parsed)) return parsed;
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return migrateLegacy(JSON.parse(legacy) as LegacyProfile);
    }
  } catch {
    return null;
  }
  return null;
}

function clearMigratedLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadProfile(): Promise<StoredProfile> {
  try {
    const db = await database();
    const stored = await db.get(PROFILE_STORE, CURRENT_PROFILE_KEY);
    if (isStoredProfile(stored)) return stored;
    if (stored !== undefined) {
      await db.put(PROFILE_STORE, stored, RECOVERY_PROFILE_KEY);
    }

    const migrated = readLocalMigrationCandidate();
    if (migrated) {
      await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
      clearMigratedLocalStorage();
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
      return migrated;
    }

    const fallback = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (fallback) {
      const parsed: unknown = JSON.parse(fallback);
      if (isStoredProfile(parsed)) {
        await db.put(PROFILE_STORE, parsed, CURRENT_PROFILE_KEY);
        localStorage.removeItem(FALLBACK_STORAGE_KEY);
        return parsed;
      }
    }

    const created = defaultProfile();
    await db.put(PROFILE_STORE, created, CURRENT_PROFILE_KEY);
    return created;
  } catch {
    try {
      const fallback: unknown = JSON.parse(
        localStorage.getItem(FALLBACK_STORAGE_KEY) ?? "null",
      );
      if (isStoredProfile(fallback)) return fallback;
    } catch {
      // Profilul conservator de mai jos menține aplicația utilizabilă.
    }
    return readLocalMigrationCandidate() ?? defaultProfile();
  }
}

export function saveProfile(profile: StoredProfile): void {
  const snapshot = structuredClone(profile);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      try {
        const db = await database();
        await db.put(PROFILE_STORE, snapshot, CURRENT_PROFILE_KEY);
        localStorage.removeItem(FALLBACK_STORAGE_KEY);
      } catch {
        try {
          localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(snapshot));
        } catch {
          // Stocarea plină nu trebuie să oprească joaca.
        }
      }
    });
}

export async function wipeProfile(): Promise<void> {
  await writeQueue.catch(() => undefined);
  try {
    const db = await database();
    await db.clear(PROFILE_STORE);
  } catch {
    // Fallback-ul local este șters mai jos.
  }
  localStorage.removeItem(FALLBACK_STORAGE_KEY);
  clearMigratedLocalStorage();
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
