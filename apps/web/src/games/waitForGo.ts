/** „Așteaptă semnalul” — control inhibitor: soare = atinge, lună = așteaptă. */

import {
  generateGoNoGo,
  initializeGoNoGo,
  reduceGoNoGo,
  type DifficultyVector,
} from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxGo, sfxGentleNo } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";
import { svg } from "../art/svg";

const GREEN_SIGNAL = svg(`
  <circle cx="60" cy="60" r="44" fill="#7FC86B" stroke="#4E9A51" stroke-width="6"/>
  <path d="M 39 61 L 53 75 L 83 43" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
`);
const RED_SIGNAL = svg(`
  <circle cx="60" cy="60" r="44" fill="#F25C4C" stroke="#C84439" stroke-width="6"/>
  <rect x="32" y="53" width="56" height="14" rx="7" fill="#FFFFFF"/>
`);

export const waitForGoGame: WebGame = {
  id: "wait-for-go",
  title: "Așteaptă semnalul",
  skillId: "inhibitory_control",
  domain: "inhibition_flexibility",
  instruction:
    "Când apare SOARELE, atinge-l! Când apare LUNA, așteaptă!",
  coPlayPrompt: "Jucați „Pe verde mergem, pe roșu ne oprim” prin casă!",
  icon: () => drawItem("sun"),
  bubbleColor: "#FFD35C",
  axes: [
    { name: "trialCount", values: [4, 6, 8, 10, 12, 14, 16] },
    { name: "goNoGoRatio", values: [0.75, 0.7, 0.6, 0.55, 0.5] },
    { name: "signalDelayMs", values: [0, 500, 800, 900, 1_000, 1_400, 1_800] },
    { name: "ruleComplexity", values: [1, 2, 3] },
  ],
  initialDifficulty: {
    trialCount: 4,
    goNoGoRatio: 0.75,
    signalDelayMs: 0,
    ruleComplexity: 1,
  },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const trialCount = Math.max(
      4,
      Math.min(16, Number(difficulty["trialCount"] ?? 4)),
    );
    const goRatio = Math.max(
      0.4,
      Math.min(0.9, Number(difficulty["goNoGoRatio"] ?? 0.75)),
    );
    const signalDelayMs = Math.max(
      0,
      Math.min(1_800, Number(difficulty["signalDelayMs"] ?? 0)),
    );
    const ruleComplexity = Math.max(
      1,
      Math.min(3, Number(difficulty["ruleComplexity"] ?? 1)),
    );
    const level = generateGoNoGo(seed, {
      gameId: "wait-for-go",
      trialCount,
      goRatio,
      goStimulusId: "sun",
      noGoStimulusId: "moon",
    });
    const { createPixiChoiceScene } = await import(
      "../runtime/pixiChoiceScene"
    );
    let state = initializeGoNoGo(level.payload.trials);

    speak(
      ruleComplexity === 2
        ? "Atinge soarele sau verdele! La lună sau roșu, așteaptă!"
        : "Atinge SOARELE! La LUNĂ, așteaptă!",
    );
    await wait(ctx.reducedMotion ? 500 : 1_000);

    for (
      let index = 0;
      index < level.payload.trials.length;
      index += 1
    ) {
      if (ctx.isCancelled()) break;
      const trial = level.payload.trials[index];
      if (!trial) continue;
      clear(ctx.mount);
      const isGo = trial.expectedAction === "tap";
      const reversed =
        ruleComplexity === 3 && index >= Math.floor(level.payload.trials.length / 2);
      if (
        ruleComplexity === 3 &&
        index === Math.floor(level.payload.trials.length / 2)
      ) {
        speak("Schimbăm regula! Acum atinge luna și așteaptă la soare!");
        await wait(ctx.reducedMotion ? 650 : 1_350);
      }
      if (signalDelayMs > 0) {
        await wait(signalDelayMs);
        if (ctx.isCancelled()) break;
      }
      const useColorCue = ruleComplexity === 2 && index % 2 === 1;
      const stimulusKind = useColorCue
        ? isGo
          ? "green"
          : "red"
        : reversed
          ? isGo
            ? "moon"
            : "sun"
          : isGo
            ? "sun"
            : "moon";
      const stimulusLabel = {
        sun: "soarele",
        moon: "luna",
        green: "verdele",
        red: "roșul",
      }[stimulusKind];
      const stimulusSvg = {
        sun: drawItem("sun"),
        moon: drawItem("moon"),
        green: GREEN_SIGNAL,
        red: RED_SIGNAL,
      }[stimulusKind];
      let settled = false;
      let timeout: number | null = null;
      let cancelWatch: number | null = null;
      let resolveObserved: (value: "tap" | "wait") => void = () => undefined;
      const observedResult = new Promise<"tap" | "wait">((resolve) => {
        resolveObserved = resolve;
      });
      const finishTrial = (value: "tap" | "wait") => {
        if (settled) return;
        settled = true;
        if (timeout !== null) window.clearTimeout(timeout);
        if (cancelWatch !== null) window.clearInterval(cancelWatch);
        resolveObserved(value);
      };

      const scene = await createPixiChoiceScene(ctx.mount, {
        targetSvg: stimulusSvg,
        targetLabel: stimulusLabel,
        groupLabel: `Semnalul ${index + 1} din ${level.payload.trials.length}`,
        options: [],
        reducedMotion: ctx.reducedMotion,
        targetActionLabel: `${
          isGo
            ? `Atinge ${stimulusLabel}`
            : `${stimulusLabel[0]?.toUpperCase()}${stimulusLabel.slice(1)} – așteaptă`
        }; semnalul ${index + 1} din ${level.payload.trials.length}`,
        onTargetActivate() {
          finishTrial("tap");
          return false;
        },
        onSelect: () => undefined,
      });
      ctx.onCleanup(scene.destroy);
      scene.readyElement.dataset.gameReady = "true";
      if (stimulusKind === "sun" || stimulusKind === "moon") {
        playItemVoice(stimulusKind);
      }
      if (isGo) {
        sfxGo();
      } else {
        speak("Așteaptă!", { rate: 1.05 });
      }
      timeout = window.setTimeout(
        () => finishTrial("wait"),
        isGo ? 3_200 : 2_100,
      );
      cancelWatch = window.setInterval(() => {
        if (ctx.isCancelled()) finishTrial("wait");
      }, 100);

      const observed = await observedResult;
      scene.destroy();
      state = reduceGoNoGo(state, {
        type: "resolve_trial",
        observedAction: observed,
      });
      if (ctx.isCancelled()) break;
      if (observed !== trial.expectedAction) {
        if (observed === "tap") {
          sfxGentleNo();
          speak("La lună așteptăm!", { rate: 1 });
        } else {
          speak("Când vezi soarele, atinge-l!", { rate: 1 });
        }
      } else if (!isGo) {
        speak("Ai așteptat. Bravo!", { rate: 1 });
      }
      await wait(ctx.reducedMotion ? 120 : 360);
    }

    const total = level.payload.trials.length;
    const completed = !ctx.isCancelled();
    const accuracy = total === 0 ? 0 : state.correctTrials / total;
    return {
      completed,
      correctFirstTry: completed && accuracy === 1,
      correctEventually: completed && accuracy >= 0.75,
      hintsUsed: 0,
      wrongAttempts: total - state.correctTrials,
      abandoned: ctx.isCancelled(),
    };
  },
};
