/** „Privește și găsește” — memorie vizuală cu model ascuns. */

import { createRng, chooseOne, shuffle, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { speak } from "../audio/speech";
import { sfxPop } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { ITEMS, drawItem } from "../art/items";

const CUP_COLORS = ["#F25C4C", "#4FA8E8", "#7FC86B"];

function cupSvg(color: string): string {
  return `<svg viewBox="0 0 120 120" width="100%" height="100%">
    <path d="M 25 40 L 95 40 L 87 102 Q 60 110 33 102 Z" fill="${color}" stroke="rgba(74,63,53,0.25)" stroke-width="4" stroke-linejoin="round"/>
    <rect x="20" y="30" width="80" height="16" rx="8" fill="${color}" stroke="rgba(74,63,53,0.25)" stroke-width="4"/>
    <ellipse cx="45" cy="66" rx="7" ry="14" fill="rgba(255,255,255,0.28)" transform="rotate(8 45 66)"/>
  </svg>`;
}

export const peekAndFindGame: WebGame = {
  id: "peek-and-find",
  title: "Privește și găsește",
  skillId: "visual_working_memory",
  domain: "working_memory",
  instruction: "Privește bine! Se ascunde sub un pahar. Unde e?",
  coPlayPrompt: "Ascundeți o jucărie sub o cană și ghiciți unde e!",
  icon: () => drawItem("fish"),
  bubbleColor: "#7FC86B",
  axes: [
    { name: "itemCount", values: [2, 3, 4, 6, 8, 10, 12] },
    { name: "delayMs", values: [0, 500, 1_000, 1_500, 2_000, 3_000, 4_000, 6_000] },
    { name: "locationCount", values: [2, 3, 4, 6, 9] },
    {
      name: "transformation",
      values: ["none", "one_swap", "two_swaps", "remove_one", "rotate_layout"],
    },
  ],
  initialDifficulty: {
    itemCount: 2,
    delayMs: 0,
    locationCount: 2,
    transformation: "none",
  },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const itemCount = Math.max(
      2,
      Math.min(12, Number(difficulty["itemCount"] ?? 2)),
    );
    const locationCount = Math.max(
      2,
      Math.min(
        9,
        Math.max(
          Number(difficulty["locationCount"] ?? 2),
          Math.min(itemCount, 9),
        ),
      ),
    );
    const delayMs = Math.max(
      0,
      Math.min(6_000, Number(difficulty["delayMs"] ?? 0)),
    );
    const transformation = String(
      difficulty["transformation"] ?? "none",
    );
    const rng = createRng(seed);
    const item = chooseOne(
      ITEMS.filter((candidate) => candidate.category === "animal"),
      rng,
    );
    const positions = shuffle(
      [...Array(locationCount).keys()],
      createRng(`${seed}:position`),
    );
    const hiddenAt = positions[0] ?? 0;
    const correctId = `cup-${hiddenAt + 1}`;
    const optionIds = Array.from(
      { length: locationCount },
      (_, index) => `cup-${index + 1}`,
    );

    clear(ctx.mount);
    const { createPixiChoiceScene } = await import(
      "../runtime/pixiChoiceScene"
    );
    const support = new SupportTracker();
    let settled = false;
    let inputReady = false;
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

    const scene = await createPixiChoiceScene(ctx.mount, {
      targetSvg: drawItem(item.id),
      targetLabel: item.labelDef,
      targetDescriptionFollowsVisibility: true,
      options: optionIds.map((id, index) => ({
        id,
        svg: cupSvg(CUP_COLORS[index] ?? "#F25C4C"),
        label: `paharul ${index + 1}`,
      })),
      reducedMotion: ctx.reducedMotion,
      onSelect(id) {
        if (!inputReady || settled) return;
        if (id !== correctId) {
          scene.markIncorrect(id);
          const verdict = support.registerError();
          if (verdict === "hint") {
            scene.emphasize(correctId);
            speak("Uite, paharul care luminează!");
          } else if (verdict === "simplify") {
            support.registerSuccess();
            scene.markCorrect(correctId);
            scene.setTargetVisible(true);
            playItemVoice(item.id);
            completionTimer = window.setTimeout(
              () =>
                finish({
                  completed: true,
                  correctFirstTry: false,
                  correctEventually: true,
                  hintsUsed: support.hintsUsed + 1,
                  wrongAttempts: support.wrongAttempts,
                }),
              ctx.reducedMotion ? 260 : 650,
            );
          }
          return;
        }
        support.registerSuccess();
        scene.markCorrect(id);
        scene.setTargetVisible(true);
        playItemVoice(item.id);
        completionTimer = window.setTimeout(
          () =>
            finish({
              completed: true,
              correctFirstTry: support.wasFirstTryClean,
              correctEventually: true,
              hintsUsed: support.hintsUsed,
              wrongAttempts: support.wrongAttempts,
            }),
          ctx.reducedMotion ? 260 : 650,
        );
      },
    });
    ctx.onCleanup(scene.destroy);

    speak(`Privește! Aici e ${item.labelDef}!`);
    await wait(ctx.reducedMotion ? 650 : 1_450);
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
    sfxPop();
    await scene.moveTargetToOption(correctId);
    scene.setTargetVisible(false);
    speak("Se ascunde! Unde e?");
    const transformedOrder = [...optionIds];
    const swapCount =
      transformation === "two_swaps"
        ? 2
        : transformation === "one_swap"
          ? 1
          : 0;
    for (let swapIndex = 0; swapIndex < swapCount; swapIndex += 1) {
      const first = (hiddenAt + swapIndex) % transformedOrder.length;
      const second = (first + 1 + swapIndex) % transformedOrder.length;
      [transformedOrder[first], transformedOrder[second]] = [
        transformedOrder[second]!,
        transformedOrder[first]!,
      ];
    }
    if (transformation === "rotate_layout") {
      transformedOrder.push(transformedOrder.shift()!);
    }
    if (swapCount > 0 || transformation === "rotate_layout") {
      await scene.reorderOptions(transformedOrder);
    }
    if (transformation === "remove_one") {
      const removed = optionIds.find((id) => id !== correctId);
      if (removed) scene.hideOption(removed);
    }
    await wait((ctx.reducedMotion ? 180 : 420) + delayMs);
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
    scene.readyElement.dataset.itemCount = String(itemCount);
    scene.readyElement.dataset.locationCount = String(locationCount);
    scene.readyElement.dataset.transformation = transformation;
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
