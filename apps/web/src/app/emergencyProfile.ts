import type { StoredProfile } from "./storage";

const EMERGENCY_PROFILE_KEY = "minte-in-joaca/emergency-profile-v4";
let snapshotSequence = 0;

interface EmergencyProfileEnvelope {
  readonly envelopeVersion: 1;
  readonly token: string;
  readonly profile: StoredProfile;
}

function plausibleProfile(value: unknown): value is StoredProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Partial<StoredProfile>;
  return (
    profile.schemaVersion === 4 &&
    typeof profile.createdAtLocal === "string" &&
    typeof profile.ageMonths === "number" &&
    typeof profile.sessionLocked === "boolean" &&
    typeof profile.settings === "object" &&
    profile.settings !== null &&
    typeof profile.masteryBySkill === "object" &&
    profile.masteryBySkill !== null &&
    typeof profile.progressByGame === "object" &&
    profile.progressByGame !== null &&
    Array.isArray(profile.attempts) &&
    Array.isArray(profile.sessions)
  );
}

function parseEnvelope(value: unknown): EmergencyProfileEnvelope | null {
  if (typeof value !== "object" || value === null) return null;
  const envelope = value as Partial<EmergencyProfileEnvelope>;
  if (
    envelope.envelopeVersion !== 1 ||
    typeof envelope.token !== "string" ||
    !plausibleProfile(envelope.profile)
  ) {
    return null;
  }
  return envelope as EmergencyProfileEnvelope;
}

function newSnapshotToken(): string {
  snapshotSequence += 1;
  return `${Date.now()}:${snapshotSequence}:${crypto.randomUUID()}`;
}

/**
 * Scriere sincronă, folosită înaintea cozii IndexedDB și la pagehide.
 * Tokenul permite unei confirmări vechi să nu șteargă o mutație mai nouă.
 */
export function writeEmergencyProfileSnapshot(
  profile: StoredProfile,
): string | null {
  const token = newSnapshotToken();
  const envelope: EmergencyProfileEnvelope = {
    envelopeVersion: 1,
    token,
    profile,
  };
  try {
    localStorage.setItem(EMERGENCY_PROFILE_KEY, JSON.stringify(envelope));
    return token;
  } catch {
    return null;
  }
}

export function readEmergencyProfileSnapshot(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_PROFILE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const envelope = parseEnvelope(parsed);
    if (envelope) return envelope.profile;
    // Compatibilitate cu snapshot-urile scrise înaintea envelopeVersion 1.
    if (plausibleProfile(parsed)) return parsed;
    localStorage.removeItem(EMERGENCY_PROFILE_KEY);
  } catch {
    try {
      localStorage.removeItem(EMERGENCY_PROFILE_KEY);
    } catch {
      // Stocarea poate fi indisponibilă; profilul principal rămâne autoritar.
    }
  }
  return null;
}

/**
 * Fără token șterge explicit tot (reset). Cu token șterge numai dacă snapshot-ul
 * curent este chiar generația confirmată de apelant.
 */
export function clearEmergencyProfileSnapshot(expectedToken?: string): void {
  try {
    if (expectedToken !== undefined) {
      const raw = localStorage.getItem(EMERGENCY_PROFILE_KEY);
      if (!raw) return;
      const envelope = parseEnvelope(JSON.parse(raw) as unknown);
      if (!envelope || envelope.token !== expectedToken) return;
    }
    localStorage.removeItem(EMERGENCY_PROFILE_KEY);
  } catch {
    // Cleanup best-effort; snapshot-ul valid rămâne pentru următorul bootstrap.
  }
}
