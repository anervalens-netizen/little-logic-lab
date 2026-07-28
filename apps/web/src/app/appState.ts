/** Stare globală: profil, persistență durabilă și aplicarea setărilor. */

import type { StoredProfile, StoredAttempt } from "./storage";
import { loadProfile, defaultProfile, wipeProfile } from "./storage";
import { sanitizeProfile } from "./profileSanitizer";
import {
  clearEmergencyProfileSnapshot,
  readEmergencyProfileSnapshot,
  writeEmergencyProfileSnapshot,
} from "./emergencyProfile";
import {
  flushProfileWrites,
  profileStorageHealth,
  queueProfileSave,
  resetProfileStorageHealth,
} from "./durableProfile";
import { setAudioEnabled } from "../audio/audio";
import { setVoiceEnabled } from "../audio/speech";
import { setMotionReduced } from "../ui/feedback";
import { startMusic, stopMusic } from "../audio/music";
import { applyAccessibilityPreferences } from "../ui/accessibilityPreferences";
import {
  createMastery,
  updateMastery,
  masteryMean,
  type SkillMastery,
  type AttemptOutcome,
} from "@core";

export type StoredAttemptWithEvidence = StoredAttempt & {
  readonly responseMs?: number;
};

let profile: StoredProfile = defaultProfile();
let profileRepairs: readonly string[] = [];

export async function initializeProfile(): Promise<void> {
  const emergency = readEmergencyProfileSnapshot();
  const loaded = emergency ?? (await loadProfile());
  const repaired = sanitizeProfile(loaded);
  profile = repaired.profile;
  profileRepairs = repaired.repairs;

  // Un snapshot de urgență reprezintă o mutație care nu a primit confirmarea
  // IndexedDB înaintea închiderii. Îl confirmăm înainte de bootstrap-ul UI.
  if (emergency !== null || profileRepairs.length > 0) {
    queueProfileSave(profile);
    await flushProfileWrites().catch(() => undefined);
  }
}

export interface AttemptMetadata {
  readonly sessionId: string;
  readonly levelSeed: string;
  readonly ladderStageId: string;
  readonly contentVersion: string;
}

export function getProfile(): StoredProfile {
  return profile;
}

export function getProfileRepairSummary(): readonly string[] {
  return [...profileRepairs];
}

export function persist(): void {
  queueProfileSave(profile);
}

/** Limită sincronă pentru pagehide/freeze; nu așteaptă IndexedDB. */
export function checkpointProfileSynchronously(): void {
  writeEmergencyProfileSnapshot(profile);
}

export async function flushPendingProfileWrites(): Promise<void> {
  await flushProfileWrites();
}

export function getProfileStorageHealth() {
  return profileStorageHealth();
}

export async function resetProfile(): Promise<void> {
  await flushProfileWrites().catch(() => undefined);
  await wipeProfile();
  clearEmergencyProfileSnapshot();
  resetProfileStorageHealth();
  profileRepairs = [];
  profile = defaultProfile(profile.ageMonths);
  persist();
  await flushProfileWrites();
  applySettings();
}

export function updateSettings(patch: Partial<StoredProfile["settings"]>): void {
  profile = { ...profile, settings: { ...profile.settings, ...patch } };
  persist();
  applySettings();
}

export function unlockSession(): void {
  if (!profile.sessionLocked) return;
  profile = { ...profile, sessionLocked: false };
  persist();
}

export function applySettings(): void {
  setAudioEnabled(profile.settings.audioEnabled);
  setVoiceEnabled(profile.settings.voiceEnabled && profile.settings.audioEnabled);
  const reduce =
    profile.settings.reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setMotionReduced(reduce);
  applyAccessibilityPreferences({
    highContrast: profile.settings.highContrast,
    targetSize: profile.settings.targetSize,
    speed: profile.settings.demonstrationSpeed,
  });
  if (profile.settings.musicEnabled && profile.settings.audioEnabled) startMusic();
  else stopMusic();
}

function masteryFromStored(
  stored: StoredProfile["masteryBySkill"][string] | undefined,
): SkillMastery {
  if (!stored) return createMastery();
  return {
    alpha: stored.alpha,
    beta: stored.beta,
    evidenceCount: stored.evidenceCount,
    lastPracticedAtLocal: stored.lastPracticedAtLocal,
  };
}

export function recordAttempt(
  gameId: string,
  skillId: string,
  outcome: AttemptOutcome,
  metadata: AttemptMetadata,
): void {
  const atLocal = new Date().toISOString();
  const attempt: StoredAttemptWithEvidence = {
    atLocal,
    ...metadata,
    gameId,
    skillId,
    completed: outcome.completed,
    correctFirstTry: outcome.correctFirstTry,
    correctEventually: outcome.correctEventually,
    hintsUsed: outcome.hintsUsed,
    wrongAttempts: outcome.wrongAttempts,
    abandoned: outcome.abandoned ?? false,
    ...(outcome.responseMs === undefined
      ? {}
      : { responseMs: Math.max(0, Math.round(outcome.responseMs)) }),
  };

  const current = masteryFromStored(profile.masteryBySkill[skillId]);
  const next = updateMastery(current, outcome, atLocal);
  const existing = profile.progressByGame[gameId];
  const recentOutcomes = [...(existing?.recentOutcomes ?? []), attempt].slice(-8);

  profile = {
    ...profile,
    masteryBySkill: {
      ...profile.masteryBySkill,
      [skillId]: {
        alpha: next.alpha,
        beta: next.beta,
        evidenceCount: next.evidenceCount,
        lastPracticedAtLocal: next.lastPracticedAtLocal,
      },
    },
    progressByGame: {
      ...profile.progressByGame,
      [gameId]: {
        difficulty: existing?.difficulty ?? {},
        recentOutcomes,
        timesPlayed: (existing?.timesPlayed ?? 0) + 1,
      },
    },
    attempts: [...profile.attempts, attempt].slice(-500),
  };
  persist();
}

export function masteryMeanFor(skillId: string): number {
  const stored = profile.masteryBySkill[skillId];
  if (!stored) return 0.5;
  return masteryMean(masteryFromStored(stored));
}

export function setGameDifficulty(
  gameId: string,
  difficulty: Record<string, string | number | boolean>,
): void {
  const existing = profile.progressByGame[gameId];
  profile = {
    ...profile,
    progressByGame: {
      ...profile.progressByGame,
      [gameId]: {
        difficulty,
        recentOutcomes: existing?.recentOutcomes ?? [],
        timesPlayed: existing?.timesPlayed ?? 0,
      },
    },
  };
  persist();
}

export function recordSession(
  sessionId: string,
  minutes: number,
  gamesPlayed: number,
): void {
  profile = {
    ...profile,
    sessionLocked: true,
    sessions: [
      ...profile.sessions,
      { sessionId, atLocal: new Date().toISOString(), minutes, gamesPlayed },
    ].slice(-120),
  };
  persist();
}
