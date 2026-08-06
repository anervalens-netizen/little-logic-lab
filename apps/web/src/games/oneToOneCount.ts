/** „Dă câte unul” — fiecare prieten primește exact o gustare. */

import {
  createRng,
  chooseOne,
  shuffle,
  type DifficultyVector,
} from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { waitForSpeechIdle } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

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

type SymbolSupport = "none" | "paired" | "symbol" | "mixed";
type PerceptualControl = "basic" | "controlled" | "strict";

function withSymbolSupport(
  artwork: string,
  support: SymbolSupport,
  index: number,
): string {
  const mode =
    support === "mixed" ? (index % 2 === 0 ? "paired" : "symbol") : support;
  if (mode === "none") return artwork;
  const badge =
    mode === "paired"
      ? `<circle cx="96" cy="24" r="12" fill="#FFF3B8" stroke="#E8B23C" stroke-width="3"/><circle cx="96" cy="24" r="4" fill="#4A3F35"/>`
      : `<circle cx="96" cy="24" r="14" fill="#FFF3B8" stroke="#E8B23C" stroke-width="3"/><text x="96" y="31" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#4A3F35">1</text>`;
  return artwork.replace("</svg>", `${badge}</svg>`);
}

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
  axes: [
    { name: "maxQuantity", values: [1, 2, 3, 4, 5, 8, 10, 15, 20] },
    { name: "choiceCount", values: [2, 3, 4, 5, 6, 8] },
    {
      name: "symbolSupport",
      values: ["none", "paired", "symbol", "mixed"],
    },
    {
      name: "perceptualControl",
      values: ["basic", "controlled", "strict"],
    },
  ],
  initialDifficulty: {
    maxQuantity: 1,
    choiceCount: 2,
    symbolSupport: "none",
    perceptualControl: "basic",
  },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const total = Math.max(
      1,
      Math.min(20, Number(difficulty["maxQuantity"] ?? 1)),
    );
    const choiceCount = Math.max(
      2,
      Math.min(8, Number(difficulty["choiceCount"] ?? 2)),
    );
    const symbolSupport = (
      ["none", "paired", "symbol", "mixed"].includes(
        String(difficulty["symbolSupport"]),
      )
        ? difficulty["symbolSupport"]
        : "none"
    ) as SymbolSupport;
    const perceptualControl = (
      ["basic", "controlled", "strict"].includes(
        String(difficulty["perceptualControl"]),
      )
        ? difficulty["perceptualControl"]
        : "basic"
    ) as PerceptualControl;
    const rng = createRng(seed);
    const receiverKinds = shuffle([...RECEIVERS], rng).slice(
      0,
      Math.min(choiceCount, RECEIVERS.length),
    );
    const treat = chooseOne([...TREATS], rng);
    const batchSize = Math.min(
      window.innerWidth < 600 ? 3 : 4,
      choiceCount,
    );
    const batchCount = Math.ceil(total / batchSize);
    const friendIds = Array.from(
      { length: total },
      (_, index) => `friend-${index + 1}`,
    );
    const treatIds = Array.from(
      { length: total },
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
    let readyElement: HTMLElement | null = null;
    let resolveResult: (result: PlayResult) => void = () => undefined;
    const result = new Promise<PlayResult>((resolve) => {
      resolveResult = resolve;
    });
    const finish = (outcome: PlayResult) => {
      if (settled) return;
      settled = true;
      inputReady = false;
      if (cancelWatch !== null) window.clearInterval(cancelWatch);
      resolveResult(outcome);
    };
    const updatePageMetadata = (pageIndex: number) => {
      if (!readyElement) return;
      readyElement.dataset.batchIndex = String(pageIndex + 1);
      readyElement.dataset.batchCount = String(batchCount);
      if (pageIndex > 0) {
        const remaining = Math.max(0, total - pageIndex * batchSize);
        void waitForSpeechIdle().then(() => {
          if (!settled && !ctx.isCancelled()) {
            return ctx.speak(`Mai avem ${remaining} prieteni. Continuăm!`);
          }
        });
      }
    };

    const scene = await createPixiDragScene(ctx.mount, {
      items: treatIds.map((id, index) => ({
        id,
        svg: drawItem(treat),
        label: `gustarea ${index + 1}`,
        rotation:
          perceptualControl === "strict"
            ? 0
            : (index % 2 === 0 ? -1 : 1) *
              (perceptualControl === "basic" ? 0.1 : 0.04),
      })),
      targets: friendIds.map((id, index) => {
        const receiver =
          receiverKinds[index % receiverKinds.length] ?? "bear";
        return {
          id,
          svg: withSymbolSupport(
            drawItem(receiver),
            symbolSupport,
            index,
          ),
          label: `prietenul ${index + 1}`,
        };
      }),
      presentation: "holes",
      reducedMotion: ctx.reducedMotion,
      pageSize: batchSize,
      onPageChange: updatePageMetadata,
      onDrop(itemId, targetId) {
        if (!inputReady || settled || simplifying) return "ignore";
        if (served.has(targetId)) {
          const verdict = support.registerError();
          inputReady = false;
          const nextTarget = friendIds.find((id) => !served.has(id));
          if (nextTarget && verdict === "hint") {
            scene.emphasizeTarget(nextTarget);
          }
          if (verdict === "simplify") {
            simplifying = true;
            void ctx
              .speak("Acest prieten are deja unul!", { rate: 1 })
              .then(() => autoCompleteRemaining());
          } else {
            void ctx
              .speak("Acest prieten are deja unul!", { rate: 1 })
              .then(() => {
                if (!settled && !ctx.isCancelled()) inputReady = true;
              });
          }
          return "incorrect";
        }

        support.registerSuccess();
        served.add(targetId);
        placed.add(itemId);
        spokenCount += 1;
        sfxPlace();
        playItemVoice(treat);
        inputReady = false;
        const countSpeech = ctx.speak(
          `${COUNT_WORDS[spokenCount - 1] ?? spokenCount}!`,
          { rate: 0.95 },
        );
        if (placed.size >= total) {
          void Promise.all([
            countSpeech,
            wait(ctx.reducedMotion ? 240 : 560),
          ]).then(() =>
            finish({
              completed: true,
              correctFirstTry: support.wasFirstTryClean,
              correctEventually: true,
              hintsUsed: support.hintsUsed,
              wrongAttempts: support.wrongAttempts,
            }),
          );
        } else {
          void countSpeech.then(() => {
            if (!settled && !simplifying && !ctx.isCancelled()) inputReady = true;
          });
        }
        return "correct";
      },
    });
    ctx.onCleanup(scene.destroy);
    readyElement = scene.readyElement;

    async function autoCompleteRemaining(): Promise<void> {
      inputReady = false;
      await ctx.speak("Hai să dăm împreună câte unul fiecăruia!");
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
        await wait(ctx.reducedMotion ? 70 : 180);
      }
      finish({
        completed: true,
        correctFirstTry: false,
        correctEventually: true,
        hintsUsed: support.hintsUsed + 1,
        wrongAttempts: support.wrongAttempts,
      });
    }

    await Promise.all([
      ctx.speak(
        `Avem ${total <= 4 ? COUNT_WORDS[total - 1] : total} prieteni! Dă fiecăruia câte unul!`,
      ),
      wait(demonstrationDelay(700)),
    ]);
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
    scene.readyElement.dataset.totalItems = String(total);
    scene.readyElement.dataset.choiceCount = String(choiceCount);
    updatePageMetadata(0);
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
