import type { Evaluation } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";
import { evaluationFromStats } from "./common.js";

export interface OrderState extends RuntimeStats {
  readonly correctOrderIds: readonly string[];
  readonly submittedOrderIds: readonly string[];
}

export type OrderAction =
  | { readonly type: "submit_order"; readonly itemIds: readonly string[] }
  | { readonly type: "request_hint" };

export function initializeOrder(correctOrderIds: readonly string[]): OrderState {
  if (correctOrderIds.length < 2) throw new Error("Order runtime needs at least two steps.");
  return {
    correctOrderIds: [...correctOrderIds],
    submittedOrderIds: [],
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function reduceOrder(state: OrderState, action: OrderAction): OrderState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }
  const submittedOrderIds = [...action.itemIds];
  const correct = arraysEqual(submittedOrderIds, state.correctOrderIds);
  if (!correct) {
    return {
      ...state,
      submittedOrderIds,
      wrongAttempts: state.wrongAttempts + 1,
    };
  }
  return {
    ...state,
    submittedOrderIds,
    completed: true,
    correctFirstTry: state.wrongAttempts === 0 && state.hintsUsed === 0,
  };
}

export function evaluateOrder(state: OrderState): Evaluation {
  return evaluationFromStats(state, state.completed, state.correctFirstTry ? "clean_sequence_reasoning" : "supported_sequence_reasoning");
}

export function getOrderHint(state: OrderState, hintIndex: number): HintDescriptor {
  if (hintIndex <= 0) return { kind: "reveal_first", value: state.correctOrderIds[0] as string };
  if (hintIndex === 1) return { kind: "replay_demonstration" };
  return { kind: "simplify", axis: "stepCount" };
}
