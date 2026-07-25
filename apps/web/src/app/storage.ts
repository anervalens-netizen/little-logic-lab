/**
 * Persistență exclusiv locală (localStorage), versionată.
 * Nimic nu părăsește dispozitivul — fără rețea, fără analytics.
 */

const STORAGE_KEY = "minte-in-joaca/v1";

export interface StoredAttempt {
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

export interface StoredGameProgress {
  /** Vector curent de dificultate (o axă se schimbă odată). */
  readonly difficulty: Record<string, string | number | boolean>;
  /** Ultimele rezultate pentru direcția de dificultate. */
  readonly recentOutcomes: readonly StoredAttempt[];
  readonly timesPlayed: number;
}

export interface StoredProfile {
  readonly schemaVersion: 1;
  readonly createdAtLocal: string;
  /** Vârsta în luni — doar punct de pornire, progresul conduce. */
  readonly ageMonths: number;
  readonly settings: {
    audioEnabled: boolean;
    musicEnabled: boolean;
    voiceEnabled: boolean;
    reducedMotion: boolean;
    sessionMinutes: 3 | 5 | 7;
    coPlayPrompts: boolean;
  };
  /** Mastery per abilitate (model beta din core, serializat). */
  readonly masteryBySkill: Record<
    string,
    { alpha: number; beta: number; evidenceCount: number; lastPracticedAtLocal: string | null }
  >;
  readonly progressByGame: Record<string, StoredGameProgress>;
  /** Jurnal local de încercări (ultimele ~400), vizibil părintelui. */
  readonly attempts: readonly StoredAttempt[];
  /** Sesiuni încheiate (zi → minute), pentru ecranul părintelui. */
  readonly sessions: readonly { atLocal: string; minutes: number; gamesPlayed: number }[];
}

export function defaultProfile(ageMonths = 31): StoredProfile {
  return {
    schemaVersion: 1,
    createdAtLocal: new Date().toISOString(),
    ageMonths,
    settings: {
      audioEnabled: true,
      musicEnabled: false,
      voiceEnabled: true,
      reducedMotion: false,
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as StoredProfile;
    if (parsed.schemaVersion !== 1) return defaultProfile();
    return parsed;
  } catch {
    return defaultProfile();
  }
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
}

export function exportProfileJson(profile: StoredProfile): string {
  return JSON.stringify(profile, null, 2);
}
