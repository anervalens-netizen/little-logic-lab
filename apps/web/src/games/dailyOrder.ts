/** „Ce facem întâi?” — ordonarea pașilor unei rutine familiare. */

import { createRng, chooseOne, shuffle, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { clear, wait } from "../ui/dom";
import { sfxPlace } from "../audio/sfx";
import { demonstrationDelay } from "../ui/accessibilityPreferences";
import {
  drawRoutine,
  ROUTINE_CHAINS,
  ROUTINE_LABELS,
  type RoutineId,
} from "../art/routines";

const STEP_WORDS = ["Întâi", "Apoi", "La urmă"];
const ALL_ROUTINES = [...new Set(ROUTINE_CHAINS.flat())] as RoutineId[];

export const dailyOrderGame: WebGame = {
  id: "daily-order",
  title: "Ce facem întâi?",
  skillId: "temporal_sequencing",
  domain: "sequencing_patterns",
  instruction: "Pune imaginile în ordine! Ce facem întâi?",
  coPlayPrompt:
    "Povestiți împreună: ce facem dimineața? Și seara, înainte de culcare?",
  icon: () => drawRoutine("eat"),
  bubbleColor: "#9B8CF2",
  axes: [
    { name: "stepCount", values: [2, 3, 4, 5, 6] },
    { name: "distractorCount", values: [0, 1, 2, 3] },
    { name: "causalDistance", values: [0, 1, 2, 3] },
    {
      name: "verbalSupport",
      values: ["full", "brief", "on_request", "minimal"],
    },
  ],
  initialDifficulty: {
    stepCount: 2,
    distractorCount: 0,
    causalDistance: 0,
    verbalSupport: "full",
  },
  scored: true,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const stepCount = Math.max(
      2,
      Math.min(6, Number(difficulty["stepCount"] ?? 2)),
    );
    const distractorCount = Math.max(
      0,
      Math.min(3, Number(difficulty["distractorCount"] ?? 0)),
    );
    const causalDistance = Math.max(
      0,
      Math.min(3, Number(difficulty["causalDistance"] ?? 0)),
    );
    const verbalSupport = String(difficulty["verbalSupport"] ?? "full");
    const rng = createRng(seed);
    const sourceSpan = Math.min(6, stepCount + causalDistance);
    const chain = chooseOne(
      ROUTINE_CHAINS.filter((candidate) => candidate.length >= sourceSpan),
      rng,
    );
    const stepIndices =
      stepCount === 1
        ? [0]
        : Array.from({ length: stepCount }, (_, index) =>
            Math.round((index * (sourceSpan - 1)) / (stepCount - 1)),
          );
    const steps = stepIndices
      .map((index) => chain[index])
      .filter((id): id is RoutineId => id !== undefined);
    const distractors = shuffle(
      ALL_ROUTINES.filter((id) => !steps.includes(id)),
      createRng(`${seed}:distractors`),
    ).slice(0, distractorCount);
    const presented = shuffle(
      [...steps, ...distractors],
      createRng(`${seed}:order`),
    );

    clear(ctx.mount);
    const { createPixiSequenceScene } = await import(
      "../runtime/pixiSequenceScene"
    );
    const support = new SupportTracker();
    let nextIndex = 0;
    let settled = false;
    let inputReady = false;
    let simplifying = false;
    let cancelWatch: number | null = null;
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

    const scene = await createPixiSequenceScene(ctx.mount, {
      cards: presented.map((id) => ({
        id,
        svg: drawRoutine(id),
        label: ROUTINE_LABELS[id],
      })),
      slotCount: steps.length,
      reducedMotion: ctx.reducedMotion,
      onSelect(id) {
        if (!inputReady || settled || simplifying) return;
        const expected = steps[nextIndex];
        if (id !== expected) {
          scene.markIncorrect(id);
          const verdict = support.registerError();
          if (verdict === "hint" && expected) {
            scene.emphasize(expected);
            if (verbalSupport !== "minimal") {
              inputReady = false;
              void ctx
                .speak(
                  `Uite, asta facem ${STEP_WORDS[
                    Math.min(nextIndex, 2)
                  ]?.toLowerCase()}!`,
                )
                .then(() => {
                  if (!settled && !simplifying && !ctx.isCancelled()) {
                    inputReady = true;
                  }
                });
            }
          } else if (verdict === "simplify") {
            simplifying = true;
            inputReady = false;
            void autoCompleteRemaining();
          }
          return;
        }
        support.registerSuccess();
        inputReady = false;
        void acceptStep(id);
      },
    });
    ctx.onCleanup(scene.destroy);

    async function acceptStep(id: RoutineId): Promise<void> {
      const slotIndex = nextIndex;
      sfxPlace();
      const narration =
        verbalSupport === "full" || verbalSupport === "brief"
          ? ctx.speak(
              STEP_WORDS[Math.min(slotIndex, STEP_WORDS.length - 1)] ??
                "Apoi",
              { rate: 1 },
            )
          : Promise.resolve();
      await Promise.all([narration, scene.accept(id, slotIndex)]);
      nextIndex += 1;
      if (nextIndex >= steps.length) {
        await wait(ctx.reducedMotion ? 260 : 560);
        finish({
          completed: true,
          correctFirstTry: support.wasFirstTryClean,
          correctEventually: true,
          hintsUsed: support.hintsUsed,
          wrongAttempts: support.wrongAttempts,
        });
        return;
      }
      if (verbalSupport === "full") {
        await ctx.speak(
          `${STEP_WORDS[Math.min(nextIndex, STEP_WORDS.length - 1)]}?`,
        );
      }
      if (!simplifying && !settled && !ctx.isCancelled()) inputReady = true;
    }

    async function autoCompleteRemaining(): Promise<void> {
      await ctx.speak("Hai să le punem împreună!");
      while (nextIndex < steps.length && !ctx.isCancelled() && !settled) {
        const step = steps[nextIndex];
        if (!step) break;
        await acceptStep(step);
        await wait(ctx.reducedMotion ? 90 : 260);
      }
      finish({
        completed: true,
        correctFirstTry: false,
        correctEventually: true,
        hintsUsed: support.hintsUsed + 1,
        wrongAttempts: support.wrongAttempts,
      });
    }

    const initialSpeech =
      verbalSupport === "full"
        ? `${STEP_WORDS[0]}: ce facem ${
            steps.length === 2 ? "întâi" : "la început"
          }?`
        : verbalSupport === "brief"
          ? "Ce facem întâi?"
          : null;
    await Promise.all([
      initialSpeech ? ctx.speak(initialSpeech) : Promise.resolve(),
      wait(demonstrationDelay(800)),
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
