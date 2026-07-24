import type { Evaluation, Scalar } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";
import { evaluationFromStats } from "./common.js";

export interface ChoiceState extends RuntimeStats {
  readonly correctChoice: Scalar;
  readonly optionValues: readonly Scalar[];
  readonly selectedChoice: Scalar | null;
}

export type ChoiceAction =
  | { readonly type: "select"; readonly value: Scalar }
  | { readonly type: "request_hint" };

function equalScalar(left: Scalar, right: Scalar): boolean {
  return typeof left === typeof right && left === right;
}

export function initializeChoice(
  correctChoice: Scalar,
  optionValues: readonly Scalar[],
): ChoiceState {
  if (optionValues.length < 2) throw new Error("Choice runtime needs at least two options.");
  if (!optionValues.some((value) => equalScalar(value, correctChoice))) {
    throw new Error("Correct choice is not present in options.");
  }
  const unique = new Set(optionValues.map((value) => `${typeof value}:${String(value)}`));
  if (unique.size !== optionValues.length) throw new Error("Choice options must be unique.");

  return {
    correctChoice,
    optionValues: [...optionValues],
    selectedChoice: null,
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

export function reduceChoice(state: ChoiceState, action: ChoiceAction): ChoiceState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }

  if (!state.optionValues.some((value) => equalScalar(value, action.value))) {
    return state;
  }
  const correct = equalScalar(action.value, state.correctChoice);
  if (correct) {
    return {
      ...state,
      selectedChoice: action.value,
      completed: true,
      correctFirstTry: state.wrongAttempts === 0 && state.hintsUsed === 0,
    };
  }
  return {
    ...state,
    selectedChoice: action.value,
    wrongAttempts: state.wrongAttempts + 1,
  };
}

export function evaluateChoice(state: ChoiceState): Evaluation {
  return evaluationFromStats(
    state,
    state.completed && state.selectedChoice !== null && equalScalar(state.selectedChoice, state.correctChoice),
    state.correctFirstTry ? "first_try_discrimination" : "supported_discrimination",
  );
}

export function getChoiceHint(state: ChoiceState, hintIndex: number): HintDescriptor {
  if (hintIndex <= 0) return { kind: "highlight_target", targetId: String(state.correctChoice) };
  if (hintIndex === 1) return { kind: "remove_distractor" };
  return { kind: "simplify", axis: "choiceCount" };
}
