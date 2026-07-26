/** Generat din catalog + p0-release; nu edita manual. */

import type { WebGame } from "../games/types";

export const GAME_IDS = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
  "daily-order",
  "one-to-one-count",
  "shadow-match",
  "peek-and-find",
  "wait-for-go",
  "listen-find",
  "trace-road",
  "emotion-match",
  "sort-by-shape",
  "sort-by-size",
  "drag-and-fit",
  "real-color-hunt"
] as const;
export type GameId = (typeof GAME_IDS)[number];

type GameLoader = () => Promise<WebGame>;

const LOADERS = {
  "same-picture": () => import("../games/samePicture").then(({ samePictureGame }) => samePictureGame),
  "sort-by-color": () => import("../games/sortByColor").then(({ sortByColorGame }) => sortByColorGame),
  "inset-puzzle": () => import("../games/insetPuzzle").then(({ insetPuzzleGame }) => insetPuzzleGame),
  "daily-order": () => import("../games/dailyOrder").then(({ dailyOrderGame }) => dailyOrderGame),
  "one-to-one-count": () => import("../games/oneToOneCount").then(({ oneToOneCountGame }) => oneToOneCountGame),
  "shadow-match": () => import("../games/shadowMatch").then(({ shadowMatchGame }) => shadowMatchGame),
  "peek-and-find": () => import("../games/peekAndFind").then(({ peekAndFindGame }) => peekAndFindGame),
  "wait-for-go": () => import("../games/waitForGo").then(({ waitForGoGame }) => waitForGoGame),
  "listen-find": () => import("../games/listenFind").then(({ listenFindGame }) => listenFindGame),
  "trace-road": () => import("../games/traceRoad").then(({ traceRoadGame }) => traceRoadGame),
  "emotion-match": () => import("../games/emotionMatch").then(({ emotionMatchGame }) => emotionMatchGame),
  "sort-by-shape": () => import("../games/sortByShape").then(({ sortByShapeGame }) => sortByShapeGame),
  "sort-by-size": () => import("../games/sortBySize").then(({ sortBySizeGame }) => sortBySizeGame),
  "drag-and-fit": () => import("../games/dragAndFit").then(({ dragAndFitGame }) => dragAndFitGame),
  "real-color-hunt": () => import("../games/realColorHunt").then(({ realColorHuntGame }) => realColorHuntGame),
} satisfies Record<GameId, GameLoader>;

const cache = new Map<GameId, Promise<WebGame>>();

export function isGameId(id: string): id is GameId {
  return Object.hasOwn(LOADERS, id);
}

export async function loadGame(id: string): Promise<WebGame | undefined> {
  if (!isGameId(id)) return undefined;
  const cached = cache.get(id);
  if (cached) return cached;

  const pending = LOADERS[id]()
    .then((game) => {
      if (game.id !== id) {
        throw new Error(`Loaded game ${game.id} for registry key ${id}.`);
      }
      return game;
    })
    .catch((error: unknown) => {
      cache.delete(id);
      throw error;
    });
  cache.set(id, pending);
  return pending;
}

export async function loadGames(
  ids: readonly string[],
): Promise<readonly WebGame[]> {
  const games = await Promise.all(ids.map((id) => loadGame(id)));
  return games.filter((game): game is WebGame => game !== undefined);
}

export function loadAllGames(): Promise<readonly WebGame[]> {
  return loadGames(GAME_IDS);
}
