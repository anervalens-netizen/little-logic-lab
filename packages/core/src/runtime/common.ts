import type { Evaluation, Scalar } from "../types.js";

export interface RuntimeStats {
  readonly wrongAttempts: number;
  readonly hintsUsed: number;
  readonly completed: boolean;
  readonly correctFirstTry: boolean;
}

export type HintDescriptor =
  | { readonly kind: "replay_demonstration" }
  | { readonly kind: "highlight_target"; readonly targetId?: string }
  | { readonly kind: "remove_distractor" }
  | { readonly kind: "reveal_first"; readonly value: Scalar }
  | { readonly kind: "show_next"; readonly value: unknown }
  | { readonly kind: "show_rule"; readonly value?: string }
  | { readonly kind: "simplify"; readonly axis?: string };

export function scoreFromSupport(
  correct: boolean,
  wrongAttempts: number,
  hintsUsed: number,
): number {
  if (!correct) return 0;
  return Math.max(0.2, 1 - Math.min(0.45, wrongAttempts * 0.12) - Math.min(0.3, hintsUsed * 0.1));
}

export function evaluationFromStats(
  stats: RuntimeStats,
  correct: boolean,
  strategyTag?: string,
): Evaluation {
  return {
    completed: stats.completed,
    correct: stats.completed && correct,
    score01: stats.completed
      ? scoreFromSupport(correct, stats.wrongAttempts, stats.hintsUsed)
      : 0,
    ...(strategyTag === undefined ? {} : { strategyTag }),
  };
}
