import type { Evaluation } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";

export type ExpectedTrialAction = "tap" | "wait";

export interface GoNoGoRuntimeTrial {
  readonly index: number;
  readonly expectedAction: ExpectedTrialAction;
}

export interface GoNoGoState extends RuntimeStats {
  readonly trials: readonly GoNoGoRuntimeTrial[];
  readonly currentTrialIndex: number;
  readonly correctTrials: number;
  readonly resolvedActions: readonly ExpectedTrialAction[];
}

export type GoNoGoAction =
  | { readonly type: "resolve_trial"; readonly observedAction: ExpectedTrialAction }
  | { readonly type: "request_hint" };

export function initializeGoNoGo(trials: readonly GoNoGoRuntimeTrial[]): GoNoGoState {
  if (trials.length === 0) throw new Error("Go/no-go runtime needs trials.");
  return {
    trials: [...trials],
    currentTrialIndex: 0,
    correctTrials: 0,
    resolvedActions: [],
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

export function reduceGoNoGo(state: GoNoGoState, action: GoNoGoAction): GoNoGoState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }

  const trial = state.trials[state.currentTrialIndex];
  if (trial === undefined) return { ...state, completed: true };
  const correct = action.observedAction === trial.expectedAction;
  const nextIndex = state.currentTrialIndex + 1;
  const completed = nextIndex >= state.trials.length;
  const wrongAttempts = state.wrongAttempts + (correct ? 0 : 1);
  return {
    ...state,
    currentTrialIndex: nextIndex,
    correctTrials: state.correctTrials + (correct ? 1 : 0),
    resolvedActions: [...state.resolvedActions, action.observedAction],
    wrongAttempts,
    completed,
    correctFirstTry: completed && wrongAttempts === 0 && state.hintsUsed === 0,
  };
}

export function evaluateGoNoGo(state: GoNoGoState): Evaluation {
  const accuracy = state.trials.length === 0 ? 0 : state.correctTrials / state.trials.length;
  return {
    completed: state.completed,
    correct: state.completed && accuracy >= 0.75,
    score01: state.completed ? accuracy : 0,
    strategyTag: "rule_accuracy_without_speed_score",
  };
}

export function getGoNoGoHint(_state: GoNoGoState, hintIndex: number): HintDescriptor {
  if (hintIndex <= 0) return { kind: "show_rule" };
  if (hintIndex === 1) return { kind: "replay_demonstration" };
  return { kind: "simplify", axis: "trialCount" };
}
