import type { Evaluation } from "../types.js";
import type { HintDescriptor, RuntimeStats } from "./common.js";
import { evaluationFromStats } from "./common.js";

export interface GridPoint {
  readonly row: number;
  readonly column: number;
}

export interface MazeState extends RuntimeStats {
  readonly safePath: readonly GridPoint[];
  readonly pathIndex: number;
  readonly visited: readonly GridPoint[];
}

export type MazeAction =
  | { readonly type: "move_to"; readonly point: GridPoint }
  | { readonly type: "request_hint" };

function pointsEqual(left: GridPoint, right: GridPoint): boolean {
  return left.row === right.row && left.column === right.column;
}

export function initializeMaze(safePath: readonly GridPoint[]): MazeState {
  if (safePath.length < 2) throw new Error("Maze safe path needs a start and goal.");
  return {
    safePath: safePath.map((point) => ({ ...point })),
    pathIndex: 0,
    visited: [{ ...safePath[0] as GridPoint }],
    wrongAttempts: 0,
    hintsUsed: 0,
    completed: false,
    correctFirstTry: false,
  };
}

export function reduceMaze(state: MazeState, action: MazeAction): MazeState {
  if (state.completed) return state;
  if (action.type === "request_hint") {
    return { ...state, hintsUsed: state.hintsUsed + 1 };
  }

  const expected = state.safePath[state.pathIndex + 1];
  if (expected === undefined) return { ...state, completed: true };
  if (!pointsEqual(expected, action.point)) {
    return { ...state, wrongAttempts: state.wrongAttempts + 1 };
  }

  const pathIndex = state.pathIndex + 1;
  const completed = pathIndex === state.safePath.length - 1;
  return {
    ...state,
    pathIndex,
    visited: [...state.visited, { ...action.point }],
    completed,
    correctFirstTry: completed && state.wrongAttempts === 0 && state.hintsUsed === 0,
  };
}

export function evaluateMaze(state: MazeState): Evaluation {
  return evaluationFromStats(state, state.completed, state.correctFirstTry ? "clean_route_following" : "supported_route_following");
}

export function getMazeHint(state: MazeState, hintIndex: number): HintDescriptor {
  const next = state.safePath[state.pathIndex + 1];
  if (hintIndex <= 1 && next !== undefined) return { kind: "show_next", value: next };
  return { kind: "simplify", axis: "branchCount" };
}
