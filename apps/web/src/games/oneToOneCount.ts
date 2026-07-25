/** „Dă câte unul” — fiecare prieten primește exact o gustare. */

import { createRng, chooseOne, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";

const RECEIVERS = ["bear", "rabbit", "cat", "dog", "pig", "frog"] as const;
const TREATS = [
  "cookie",
  "apple",
  "strawberry",
  "cupcake",
  "carrot",
  "banana",
] as const;
const COUNT_WORDS = ["unu", "doi", "trei", "patru"];

export const oneToOneCountGame: WebGame = {
  id: "one-to-one-count",
  title: "Dă câte unul",
  skillId: "one_to_one_correspondence",
  domain: "numeracy",
  instruction: "Dă fiecărui prieten câte unul! Unul pentru fiecare!",
  coPlayPrompt:
    "La masă: dă fiecăruia câte o linguriță sau câte un șervețel!",
  icon: () => drawItem("cookie"),
  bubbleColor: "#FFA94D",
  axes: [{ name: "maxQuantity", values: [1, 2, 3] }],
  initialDifficulty: { maxQuantity: 2 },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const count = Math.max(
      1,
      Math.min(4, Number(difficulty["maxQuantity"] ?? 2)),
    );
    const rng = createRng(seed);
    const receiver = chooseOne([...RECEIVERS], rng);
    const treat = chooseOne([...TREATS], rng);
    const friendIds = Array.from(
      { length: count },
      (_, index) => `friend-${index + 1}`,
    );
    const treatIds = Array.from(
      { length: count },
      (_, index) => `treat-${index + 1}`,
    );

    clear(ctx.mount);
    const { createPixiDragScene } = await import(
      "../runtime/pixiDragScene"
    );
    const support = new SupportTracker();
    const served = new Set<string>();
    const placed = new Set<string>();
    let spokenCount = 0;
    let settled = false;
    let inputReady = false;
    let simplifying = false;
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

    const scene = await createPixiDragScene(ctx.mount, {
      items: treatIds.map((id, index) => ({
        id,
        svg: drawItem(treat),
        label: `gustarea ${index + 1}`,
      })),
      targets: friendIds.map((id, index) => ({
        id,
        svg: drawItem(receiver),
        label: `prietenul ${index + 1}`,
      })),
      presentation: "holes",
      reducedMotion: ctx.reducedMotion,
      onDrop(itemId, targetId) {
        if (!inputReady || settled || simplifying) return "ignore";
        if (served.has(targetId)) {
          const verdict = support.registerError();
          speak("Acest prieten are deja unul!", { rate: 1 });
          const nextTarget = friendIds.find((id) => !served.has(id));
          if (nextTarget && verdict === "hint") {
            window.setTimeout(() => scene.emphasizeTarget(nextTarget), 150);
          }
          if (verdict === "simplify") {
            simplifying = true;
            inputReady = false;
            void autoCompleteRemaining();
          }
          return "incorrect";
        }

        support.registerSuccess();
        served.add(targetId);
        placed.add(itemId);
        spokenCount += 1;
        sfxPlace();
        playItemVoice(treat);
        speak(`${COUNT_WORDS[spokenCount - 1] ?? spokenCount}!`, { rate: 0.95 });
        if (placed.size >= count) {
          completionTimer = window.setTimeout(() => {
            speak("Fiecare are câte unul! Bravo!");
            finish({
              completed: true,
              correctFirstTry: support.wasFirstTryClean,
              correctEventually: true,
              hintsUsed: support.hintsUsed,
              wrongAttempts: support.wrongAttempts,
            });
          }, ctx.reducedMotion ? 380 : 720);
        }
        return "correct";
      },
    });
    ctx.onCleanup(scene.destroy);

    async function autoCompleteRemaining(): Promise<void> {
      speak("Hai să dăm împreună câte unul fiecăruia!");
      const remainingItems = treatIds.filter((id) => !placed.has(id));
      const remainingTargets = friendIds.filter((id) => !served.has(id));
      for (let index = 0; index < remainingItems.length; index += 1) {
        if (ctx.isCancelled()) return;
        const itemId = remainingItems[index];
        const targetId = remainingTargets[index];
        if (!itemId || !targetId) continue;
        scene.emphasizeTarget(targetId);
        placed.add(itemId);
        served.add(targetId);
        await scene.autoPlace(itemId, targetId);
        await wait(ctx.reducedMotion ? 100 : 260);
      }
      finish({
        completed: true,
        correctFirstTry: false,
        correctEventually: true,
        hintsUsed: support.hintsUsed + 1,
        wrongAttempts: support.wrongAttempts,
      });
    }

    speak(
      `Avem ${COUNT_WORDS[count - 1] ?? count} prieteni! Dă fiecăruia câte unul!`,
    );
    await wait(900);
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
    inputReady = true;
    scene.readyElement.dataset.gameReady = "true";
    cancelWatch = window.setInterval(() => {
      if (!ctx.isCancelled()) return;
      finish({
        completed: false,
        correctFirstTry: false,
        correctEventually: false,
        hintsUsed: support.hintsUsed,
        wrongAttempts: support.wrongAttempts,
        abandoned: true,
      });
    }, 200);

    const outcome = await result;
    scene.destroy();
    return outcome;
  },
};
