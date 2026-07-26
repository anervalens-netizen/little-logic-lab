/** Persistență locală IndexedDB, cu migrare și fallback fără blocarea jocului. */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DATABASE_NAME = "minte-in-joaca";
const DATABASE_VERSION = 1;
const PROFILE_STORE = "profiles";
const CURRENT_PROFILE_KEY = "current";
const RECOVERY_PROFILE_KEY = "recovery-latest";
const FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v4";
const V3_FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v3";
const V2_FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v2";
const V2_STORAGE_KEY = "minte-in-joaca/v2";
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
  readonly schemaVersion: 4;
  readonly createdAtLocal: string;
  readonly ageMonths: number;
  readonly sessionLocked: boolean;
  readonly settings: {
    audioEnabled: boolean;
    musicEnabled: boolean;
    voiceEnabled: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    targetSize: "large" | "extra_large";
    demonstrationSpeed: "normal" | "slow";
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

type StoredProfileV3 = Omit<
  StoredProfile,
  "schemaVersion" | "settings"
> & {
  readonly schemaVersion: 3;
  readonly settings: Omit<
    StoredProfile["settings"],
    "highContrast" | "targetSize" | "demonstrationSpeed"
  >;
};

type StoredProfileV2 = Omit<
  StoredProfileV3,
  "schemaVersion" | "sessionLocked"
> & {
  readonly schemaVersion: 2;
};

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
  readonly settings: StoredProfileV3["settings"];
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
    schemaVersion: 4,
    createdAtLocal: new Date().toISOString(),
    ageMonths,
    sessionLocked: false,
    settings: {
      audioEnabled: true,
      musicEnabled: false,
      voiceEnabled: true,
      reducedMotion: true,
      highContrast: false,
      targetSize: "large",
      demonstrationSpeed: "normal",
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
    candidate.schemaVersion === 4 &&
    typeof candidate.createdAtLocal === "string" &&
    typeof candidate.ageMonths === "number" &&
    typeof candidate.sessionLocked === "boolean" &&
    isCurrentSettings(candidate.settings) &&
    typeof candidate.masteryBySkill === "object" &&
    candidate.masteryBySkill !== null &&
    typeof candidate.progressByGame === "object" &&
    candidate.progressByGame !== null &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.sessions)
  );
}

function isCurrentSettings(
  value: unknown,
): value is StoredProfile["settings"] {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Partial<StoredProfile["settings"]>;
  return (
    typeof settings.audioEnabled === "boolean" &&
    typeof settings.musicEnabled === "boolean" &&
    typeof settings.voiceEnabled === "boolean" &&
    typeof settings.reducedMotion === "boolean" &&
    typeof settings.highContrast === "boolean" &&
    (settings.targetSize === "large" ||
      settings.targetSize === "extra_large") &&
    (settings.demonstrationSpeed === "normal" ||
      settings.demonstrationSpeed === "slow") &&
    (settings.sessionMinutes === 3 ||
      settings.sessionMinutes === 5 ||
      settings.sessionMinutes === 7) &&
    typeof settings.coPlayPrompts === "boolean"
  );
}

function isPreviousSettings(
  value: unknown,
): value is StoredProfileV3["settings"] {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Partial<StoredProfileV3["settings"]>;
  return (
    typeof settings.audioEnabled === "boolean" &&
    typeof settings.musicEnabled === "boolean" &&
    typeof settings.voiceEnabled === "boolean" &&
    typeof settings.reducedMotion === "boolean" &&
    (settings.sessionMinutes === 3 ||
      settings.sessionMinutes === 5 ||
      settings.sessionMinutes === 7) &&
    typeof settings.coPlayPrompts === "boolean"
  );
}

function isStoredProfileV3(value: unknown): value is StoredProfileV3 {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoredProfileV3>;
  return (
    candidate.schemaVersion === 3 &&
    typeof candidate.createdAtLocal === "string" &&
    typeof candidate.ageMonths === "number" &&
    typeof candidate.sessionLocked === "boolean" &&
    isPreviousSettings(candidate.settings) &&
    typeof candidate.masteryBySkill === "object" &&
    candidate.masteryBySkill !== null &&
    typeof candidate.progressByGame === "object" &&
    candidate.progressByGame !== null &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.sessions)
  );
}

function isStoredProfileV2(value: unknown): value is StoredProfileV2 {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoredProfileV2>;
  return (
    candidate.schemaVersion === 2 &&
    typeof candidate.createdAtLocal === "string" &&
    typeof candidate.ageMonths === "number" &&
    isPreviousSettings(candidate.settings) &&
    typeof candidate.masteryBySkill === "object" &&
    candidate.masteryBySkill !== null &&
    typeof candidate.progressByGame === "object" &&
    candidate.progressByGame !== null &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.sessions)
  );
}

function migrateV2(profile: StoredProfileV2): StoredProfile {
  return {
    ...profile,
    schemaVersion: 4,
    sessionLocked: false,
    settings: withAccessibilityDefaults(profile.settings),
  };
}

function migrateV3(profile: StoredProfileV3): StoredProfile {
  return {
    ...profile,
    schemaVersion: 4,
    settings: withAccessibilityDefaults(profile.settings),
  };
}

function withAccessibilityDefaults(
  settings: StoredProfileV3["settings"],
): StoredProfile["settings"] {
  return {
    ...settings,
    highContrast: false,
    targetSize: "large",
    demonstrationSpeed: "normal",
  };
}

function readLocalMigrationCandidate(): StoredProfile | null {
  try {
    const current = localStorage.getItem(V2_STORAGE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (isStoredProfile(parsed)) return parsed;
      if (isStoredProfileV3(parsed)) return migrateV3(parsed);
      if (isStoredProfileV2(parsed)) return migrateV2(parsed);
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
  localStorage.removeItem(V2_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadProfile(): Promise<StoredProfile> {
  try {
    const db = await database();
    const stored = await db.get(PROFILE_STORE, CURRENT_PROFILE_KEY);
    if (isStoredProfile(stored)) return stored;
    if (isStoredProfileV3(stored)) {
      const migrated = migrateV3(stored);
      await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
      localStorage.removeItem(V3_FALLBACK_STORAGE_KEY);
      return migrated;
    }
    if (isStoredProfileV2(stored)) {
      const migrated = migrateV2(stored);
      await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
      localStorage.removeItem(V2_FALLBACK_STORAGE_KEY);
      return migrated;
    }
    if (stored !== undefined) {
      await db.put(PROFILE_STORE, stored, RECOVERY_PROFILE_KEY);
    }

    const migrated = readLocalMigrationCandidate();
    if (migrated) {
      await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
      clearMigratedLocalStorage();
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
      localStorage.removeItem(V3_FALLBACK_STORAGE_KEY);
      localStorage.removeItem(V2_FALLBACK_STORAGE_KEY);
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
    const v3Fallback = localStorage.getItem(V3_FALLBACK_STORAGE_KEY);
    if (v3Fallback) {
      const parsed: unknown = JSON.parse(v3Fallback);
      if (isStoredProfileV3(parsed)) {
        const migrated = migrateV3(parsed);
        await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
        localStorage.removeItem(V3_FALLBACK_STORAGE_KEY);
        return migrated;
      }
    }
    const v2Fallback = localStorage.getItem(V2_FALLBACK_STORAGE_KEY);
    if (v2Fallback) {
      const parsed: unknown = JSON.parse(v2Fallback);
      if (isStoredProfileV2(parsed)) {
        const migrated = migrateV2(parsed);
        await db.put(PROFILE_STORE, migrated, CURRENT_PROFILE_KEY);
        localStorage.removeItem(V2_FALLBACK_STORAGE_KEY);
        return migrated;
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
      const v3Fallback: unknown = JSON.parse(
        localStorage.getItem(V3_FALLBACK_STORAGE_KEY) ?? "null",
      );
      if (isStoredProfileV3(v3Fallback)) return migrateV3(v3Fallback);
      const v2Fallback: unknown = JSON.parse(
        localStorage.getItem(V2_FALLBACK_STORAGE_KEY) ?? "null",
      );
      if (isStoredProfileV2(v2Fallback)) return migrateV2(v2Fallback);
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
  localStorage.removeItem(V3_FALLBACK_STORAGE_KEY);
  localStorage.removeItem(V2_FALLBACK_STORAGE_KEY);
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
    schemaVersion: 4,
    sessionLocked: false,
    settings: withAccessibilityDefaults({
      ...profile.settings,
      reducedMotion: profile.settings.reducedMotion ?? true,
    }),
    progressByGame,
    attempts: profile.attempts.map(migrateAttempt),
    sessions: profile.sessions.map((session, index) => ({
      ...session,
      sessionId: `legacy-session:${index}`,
    })),
  };
}
