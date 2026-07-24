import { createRng, randomInt } from "../rng.js";
import type { DifficultyVector, GeneratedLevel } from "../types.js";

export interface Cell {
  readonly row: number;
  readonly column: number;
}

export interface MazeConfig {
  readonly gameId: string;
  readonly gridSize: number;
}

export interface MazePayload {
  readonly gridSize: number;
  readonly start: Cell;
  readonly goal: Cell;
  readonly safePath: readonly Cell[];
}

export function generateGentleMaze(
  seed: string,
  config: MazeConfig,
): GeneratedLevel<MazePayload> {
  if (!Number.isInteger(config.gridSize) || config.gridSize < 2 || config.gridSize > 8) {
    throw new Error("gridSize must be an integer between 2 and 8.");
  }

  const rng = createRng(seed);
  const start: Cell = { row: 0, column: 0 };
  const goal: Cell = { row: config.gridSize - 1, column: config.gridSize - 1 };
  const safePath: Cell[] = [start];
  let row = 0;
  let column = 0;

  while (row < goal.row || column < goal.column) {
    const canMoveDown = row < goal.row;
    const canMoveRight = column < goal.column;
    const moveDown =
      canMoveDown && (!canMoveRight || randomInt(rng, 0, 1) === 0);
    if (moveDown) row += 1;
    else column += 1;
    safePath.push({ row, column });
  }

  return {
    id: `${config.gameId}:${seed}`,
    gameId: config.gameId,
    seed,
    difficulty: {
      gridSize: config.gridSize,
      branchCount: Math.max(0, config.gridSize - 2),
      movingHazards: 0,
    },
    payload: { gridSize: config.gridSize, start, goal, safePath },
  };
}
