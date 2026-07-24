import type { AttemptOutcome, MasteryStatus, SkillMastery } from "./types.js";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function createMastery(priorAlpha = 2, priorBeta = 2): SkillMastery {
  if (priorAlpha <= 0 || priorBeta <= 0) {
    throw new Error("Beta prior parameters must be positive.");
  }
  return {
    alpha: priorAlpha,
    beta: priorBeta,
    evidenceCount: 0,
    lastPracticedAtLocal: null,
  };
}

export function attemptEvidence(outcome: AttemptOutcome): number | null {
  if (outcome.abandoned === true || outcome.distressSignal === true) {
    return null;
  }

  let score = 0.1;
  if (outcome.correctFirstTry) {
    score = 1;
  } else if (outcome.correctEventually) {
    score = 0.7;
  } else if (outcome.completed) {
    score = 0.45;
  }

  score -= Math.min(0.28, outcome.hintsUsed * 0.08);
  score -= Math.min(0.2, outcome.wrongAttempts * 0.04);
  return clamp01(score);
}

export function updateMastery(
  current: SkillMastery,
  outcome: AttemptOutcome,
  practicedAtLocal: string,
): SkillMastery {
  const evidence = attemptEvidence(outcome);
  if (evidence === null) {
    return current;
  }

  return {
    alpha: current.alpha + evidence,
    beta: current.beta + (1 - evidence),
    evidenceCount: current.evidenceCount + 1,
    lastPracticedAtLocal: practicedAtLocal,
  };
}

export function masteryMean(mastery: SkillMastery): number {
  return mastery.alpha / (mastery.alpha + mastery.beta);
}

export function masteryConfidence(mastery: SkillMastery): number {
  return mastery.evidenceCount / (mastery.evidenceCount + 4);
}

export function masteryStatus(mastery: SkillMastery): MasteryStatus {
  if (mastery.evidenceCount < 3) {
    return "insufficient_evidence";
  }
  const mean = masteryMean(mastery);
  if (mean < 0.58) {
    return "emerging";
  }
  if (mean < 0.78) {
    return "developing";
  }
  return "strong";
}
