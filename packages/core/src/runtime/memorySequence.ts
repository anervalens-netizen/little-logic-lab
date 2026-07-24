import type { Evaluation } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";
import { evaluationFromStats } from "./common.js";

export type MemorySequencePhase = "presentation" | "recall" | "completed";

export interface MemorySequenceState extends RuntimeStats {
  readonly targetSequence: readonly string[];
  readonly inputSequence: readonly string[];
  readonly phase: MemorySequencePhase;
}

export type MemorySequenceAction =
  | { readonly type: "begin_recall" }
  | { readonly type: "tap_symbol"; readonly symbolId: string }
  | { readonly type: "request_hint" }
  | { readonly type: "replay" };

export function initializeMemorySequence(targetSequence: readonly string[]): MemorySequenceState {
  if (targetSequence.length === 0) throw new Error("Memory sequence cannot be empty.");
  return {
    targetSequence: [...targetSequence],
    inputSequence: [],
    phase: "presentation",
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

export function reduceMemorySequence(
  state: MemorySequenceState,
  action: MemorySequenceAction,
): MemorySequenceState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }
  if (action.type === "replay") {
    return { ...state, phase: "presentation", inputSequence: [], hintsUsed: state.hintsUsed + 1 };
  }
  if (action.type === "begin_recall") {
    return { ...state, phase: "recall", inputSequence: [] };
  }
  if (state.phase !== "recall") return state;

  const expected = state.targetSequence[state.inputSequence.length];
  if (action.symbolId !== expected) {
    return {
      ...state,
      inputSequence: [],
      wrongAttempts: state.wrongAttempts + 1,
    };
  }

  const inputSequence = [...state.inputSequence, action.symbolId];
  const completed = inputSequence.length === state.targetSequence.length;
  return {
    ...state,
    inputSequence,
    completed,
    phase: completed ? "completed" : "recall",
    correctFirstTry: completed && state.wrongAttempts === 0 && state.hintsUsed === 0,
  };
}

export function evaluateMemorySequence(state: MemorySequenceState): Evaluation {
  return evaluationFromStats(
    state,
    state.completed,
    state.correctFirstTry ? "clean_ordered_recall" : "supported_ordered_recall",
  );
}

export function getMemorySequenceHint(
  state: MemorySequenceState,
  hintIndex: number,
): HintDescriptor {
  if (hintIndex <= 0) return { kind: "replay_demonstration" };
  if (hintIndex === 1) return { kind: "reveal_first", value: state.targetSequence[0] as string };
  return { kind: "simplify", axis: "sequenceLength" };
}
