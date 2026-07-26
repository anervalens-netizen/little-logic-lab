/** „Urmează drumul” — traseu continuu, lat și fără penalizare de precizie. */

import {
  generateTracePath,
  initializeMaze,
  reduceMaze,
  type DifficultyVector,
  type TraceGuideStrength,
  type TracePathWidth,
} from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxTap } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";

export const traceRoadGame: WebGame = {
  id: "trace-road",
  title: "Urmează drumul",
  skillId: "route_planning",
  domain: "spatial_planning",
  instruction:
    "Ajută iepurașul să ajungă acasă! Urmează drumul cu degetul!",
  coPlayPrompt:
    "Faceți un drum din perne pe jos și mergeți pe el până la „casă”!",
  icon: () => drawItem("house"),
  bubbleColor: "#7FC86B",
  axes: [
    { name: "pathLength", values: [1, 2, 4, 5, 6, 8] },
    {
      name: "pathWidth",
      values: ["very_wide", "wide", "medium", "narrow"],
    },
    { name: "turnCount", values: [0, 2, 4, 5, 7, 10] },
    {
      name: "guideStrength",
      values: ["full", "partial", "faint", "on_request"],
    },
  ],
  initialDifficulty: {
    pathLength: 1,
    pathWidth: "very_wide",
    turnCount: 0,
    guideStrength: "full",
  },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const pathLength = Math.max(
      1,
      Math.min(8, Number(difficulty["pathLength"] ?? 1)),
    );
    const turnCount = Math.max(
      0,
      Math.min(10, Number(difficulty["turnCount"] ?? 0)),
    );
    const pathWidth = (
      ["very_wide", "wide", "medium", "narrow"].includes(
        String(difficulty["pathWidth"]),
      )
        ? difficulty["pathWidth"]
        : "very_wide"
    ) as TracePathWidth;
    const guideStrength = (
      ["full", "partial", "faint", "on_request"].includes(
        String(difficulty["guideStrength"]),
      )
        ? difficulty["guideStrength"]
        : "full"
    ) as TraceGuideStrength;
    const level = generateTracePath(seed, {
      gameId: "trace-road",
      pathLength,
      pathWidth,
      turnCount,
      guideStrength,
    });
    let state = initializeMaze(
      level.payload.points.map((_, index) => ({ row: index, column: 0 })),
    );

    clear(ctx.mount);
    const { createPixiTraceScene } = await import(
      "../runtime/pixiTraceScene"
    );
    let settled = false;
    let cancelWatch: number | null = null;
    let completionTimer: number | null = null;
    let resolveResult: (result: PlayResult) => void = () => undefined;
    const result = new Promise<PlayResult>((resolve) => {
      resolveResult = resolve;
    });
    const finish = (outcome: PlayResult) => {
      if (settled) return;
      settled = true;
      if (cancelWatch !== null) window.clearInterval(cancelWatch);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
      resolveResult(outcome);
    };

    const scene = await createPixiTraceScene(ctx.mount, {
      points: level.payload.points,
      pathWidth,
      guideStrength,
      walkerSvg: drawItem("rabbit"),
      goalSvg: drawItem("house"),
      reducedMotion: ctx.reducedMotion,
      onAdvance(pointIndex) {
        if (settled) return false;
        const before = state;
        state = reduceMaze(state, {
          type: "move_to",
          point: { row: pointIndex, column: 0 },
        });
        if (state === before || state.pathIndex !== pointIndex) return false;
        sfxTap();
        if (state.completed) {
          speak("Acasă! Bravo!");
          playItemVoice("rabbit");
          completionTimer = window.setTimeout(
            () =>
              finish({
                completed: true,
                correctFirstTry: state.correctFirstTry,
                correctEventually: true,
                hintsUsed: state.hintsUsed,
                wrongAttempts: state.wrongAttempts,
              }),
            ctx.reducedMotion ? 300 : 720,
          );
        }
        return true;
      },
    });
    ctx.onCleanup(scene.destroy);
    scene.readyElement.dataset.gameReady = "true";
    scene.readyElement.dataset.tracePoints = String(
      level.payload.points.length,
    );
    speak("Urmează drumul cu degetul și du iepurașul acasă!");
    await wait(ctx.reducedMotion ? 350 : 700);
    if (ctx.isCancelled()) {
      scene.destroy();
      return {
        completed: false,
        correctFirstTry: false,
        correctEventually: false,
        hintsUsed: 0,
        wrongAttempts: 0,
        abandoned: true,
      };
    }
    if (guideStrength === "full") scene.emphasizeNext();
    cancelWatch = window.setInterval(() => {
      if (!ctx.isCancelled()) return;
      finish({
        completed: false,
        correctFirstTry: false,
        correctEventually: false,
        hintsUsed: state.hintsUsed,
        wrongAttempts: state.wrongAttempts,
        abandoned: true,
      });
    }, 200);

    const outcome = await result;
    scene.destroy();
    return outcome;
  },
};
