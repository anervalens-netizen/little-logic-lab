import type { SupportAction } from "./types.js";

export interface SupportContext {
  readonly consecutiveErrors: number;
  readonly hintsAlreadyShown: number;
  readonly levelAlreadySimplified: boolean;
  readonly distressSignal: boolean;
  readonly sessionMinutesElapsed: number;
  readonly sessionMinuteLimit: number;
}

export function nextSupportAction(context: SupportContext): SupportAction {
  if (context.distressSignal) {
    return "end_session";
  }
  if (context.sessionMinutesElapsed >= context.sessionMinuteLimit) {
    return "end_session";
  }
  if (context.consecutiveErrors <= 0) {
    return "continue";
  }
  if (context.consecutiveErrors === 1) {
    return "specific_feedback";
  }
  if (context.consecutiveErrors === 2 && context.hintsAlreadyShown === 0) {
    return "show_hint";
  }
  if (context.consecutiveErrors >= 3 && !context.levelAlreadySimplified) {
    return "simplify_level";
  }
  return "end_level_successfully";
}

export function defaultSessionGameCount(ageMonths: number): number {
  if (ageMonths < 36) return 3;
  if (ageMonths < 48) return 4;
  return 5;
}
