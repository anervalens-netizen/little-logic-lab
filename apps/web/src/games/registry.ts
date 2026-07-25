/** Registrul tuturor jocurilor disponibile. */

import type { WebGame } from "./types";
import { samePictureGame } from "./samePicture";
import { shadowMatchGame } from "./shadowMatch";
import { listenFindGame } from "./listenFind";
import { emotionMatchGame } from "./emotionMatch";
import { sortByColorGame } from "./sortByColor";
import { sortByShapeGame } from "./sortByShape";
import { sortBySizeGame } from "./sortBySize";
import { peekAndFindGame } from "./peekAndFind";
import { waitForGoGame } from "./waitForGo";
import { dailyOrderGame } from "./dailyOrder";
import { oneToOneCountGame } from "./oneToOneCount";
import { insetPuzzleGame } from "./insetPuzzle";
import { traceRoadGame } from "./traceRoad";
import { colorHuntGame } from "./colorHunt";
import { dragAndFitGame } from "./dragAndFit";

const GAMES: readonly WebGame[] = [
  samePictureGame,
  sortByColorGame,
  insetPuzzleGame,
  dailyOrderGame,
  oneToOneCountGame,
  shadowMatchGame,
  peekAndFindGame,
  waitForGoGame,
  listenFindGame,
  traceRoadGame,
  emotionMatchGame,
  sortByShapeGame,
  sortBySizeGame,
  dragAndFitGame,
  colorHuntGame,
];

const byId = new Map(GAMES.map((game) => [game.id, game]));

export function allGames(): readonly WebGame[] {
  return GAMES;
}

export function getGame(id: string): WebGame | undefined {
  return byId.get(id);
}
