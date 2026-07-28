import type { StoredProfile } from "./storage";

const EMERGENCY_PROFILE_KEY = "minte-in-joaca/emergency-profile-v4";

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

/** Scriere sincronă, folosită înaintea cozii IndexedDB și la pagehide. */
export function writeEmergencyProfileSnapshot(profile: StoredProfile): boolean {
  try {
    localStorage.setItem(EMERGENCY_PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function readEmergencyProfileSnapshot(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_PROFILE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
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

export function clearEmergencyProfileSnapshot(): void {
  try {
    localStorage.removeItem(EMERGENCY_PROFILE_KEY);
  } catch {
    // Cleanup best-effort; un snapshot valid poate fi rescris la următoarea pornire.
  }
}
