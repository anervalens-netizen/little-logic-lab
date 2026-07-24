import type { Evaluation } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";
import { evaluationFromStats } from "./common.js";

export interface SortState extends RuntimeStats {
  readonly correctBinByItemId: Readonly<Record<string, string>>;
  readonly placedBinByItemId: Readonly<Record<string, string>>;
  readonly lastIncorrectItemId: string | null;
}

export type SortAction =
  | { readonly type: "place"; readonly itemId: string; readonly binId: string }
  | { readonly type: "request_hint" };

export function initializeSort(
  correctBinByItemId: Readonly<Record<string, string>>,
): SortState {
  if (Object.keys(correctBinByItemId).length === 0) {
    throw new Error("Sort runtime needs at least one item.");
  }
  return {
    correctBinByItemId: { ...correctBinByItemId },
    placedBinByItemId: {},
    lastIncorrectItemId: null,
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

export function reduceSort(state: SortState, action: SortAction): SortState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }

  const expectedBin = state.correctBinByItemId[action.itemId];
  if (expectedBin === undefined) return state;
  if (expectedBin !== action.binId) {
    return {
      ...state,
      lastIncorrectItemId: action.itemId,
      wrongAttempts: state.wrongAttempts + 1,
    };
  }

  const placements = { ...state.placedBinByItemId, [action.itemId]: action.binId };
  const completed = Object.keys(state.correctBinByItemId).every(
    (itemId) => placements[itemId] === state.correctBinByItemId[itemId],
  );
  return {
    ...state,
    placedBinByItemId: placements,
    lastIncorrectItemId: null,
    completed,
    correctFirstTry: completed && state.wrongAttempts === 0 && state.hintsUsed === 0,
  };
}

export function evaluateSort(state: SortState): Evaluation {
  return evaluationFromStats(state, state.completed, state.correctFirstTry ? "clean_rule_use" : "supported_rule_use");
}

export function getSortHint(state: SortState, hintIndex: number): HintDescriptor {
  if (hintIndex <= 0) {
    const itemId = state.lastIncorrectItemId ?? Object.keys(state.correctBinByItemId)[0];
    return { kind: "show_rule", ...(itemId === undefined ? {} : { value: itemId }) };
  }
  if (hintIndex === 1) return { kind: "replay_demonstration" };
  return { kind: "simplify", axis: "itemCount" };
}
