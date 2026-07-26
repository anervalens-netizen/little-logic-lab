/** Stare globală: profil + aplicarea setărilor în subsisteme. */

import type { StoredProfile, StoredAttempt } from "./storage";
import { loadProfile, saveProfile, defaultProfile, wipeProfile } from "./storage";
import { setAudioEnabled } from "../audio/audio";
import { setVoiceEnabled } from "../audio/speech";
import { setMotionReduced } from "../ui/feedback";
import { startMusic, stopMusic } from "../audio/music";
import {
  createMastery,
  updateMastery,
  masteryMean,
  type SkillMastery,
  type AttemptOutcome,
} from "@core";

let profile: StoredProfile = defaultProfile();

export async function initializeProfile(): Promise<void> {
  profile = await loadProfile();
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

export function persist(): void {
  saveProfile(profile);
}

export async function resetProfile(): Promise<void> {
  await wipeProfile();
  profile = defaultProfile(profile.ageMonths);
  persist();
  applySettings();
}

export function updateSettings(patch: Partial<StoredProfile["settings"]>): void {
  profile = { ...profile, settings: { ...profile.settings, ...patch } };
  persist();
  applySettings();
}

/** Deblocarea unei sesiuni noi este disponibilă exclusiv din Parent Mode. */
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

/** Înregistrează o încercare: mastery (din core), jurnal, istoric per joc. */
export function recordAttempt(
  gameId: string,
  skillId: string,
  outcome: AttemptOutcome,
  metadata: AttemptMetadata,
): void {
  const atLocal = new Date().toISOString();
  const attempt: StoredAttempt = {
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
  };

  const current = masteryFromStored(profile.masteryBySkill[skillId]);
  const next = updateMastery(current, outcome, atLocal);

  const existing = profile.progressByGame[gameId];
  const recentOutcomes = [...(existing?.recentOutcomes ?? []), attempt].slice(-6);

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
    attempts: [...profile.attempts, attempt].slice(-400),
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
