/**
 * Fabrică pentru jocuri de tip „alege imaginea corectă":
 * same-picture, shadow-match, listen-find, emotion-match.
 */

import {
  generateVisualChoice,
  initializeChoice,
  reduceChoice,
  type ContentItem,
  type DifficultyAxisSpec,
  type DifficultyVector,
  type Scalar,
} from "@core";
import type { SpeechCueId } from "../audio/speech";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { choiceRow, targetStage } from "./widgets";
import { el, clear, wait } from "../ui/dom";
import {
  markCorrect,
  showHintGlow,
  danceItem,
  particlesAt,
  jelly,
} from "../ui/feedback";
import { playItemVoice } from "../audio/voices";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

export interface ChoiceRound {
  readonly targetSvg: string | null;
  readonly targetLabel: string;
  readonly roundSpeech: string;
  readonly roundSpeechCueId?: SpeechCueId;
  readonly targetActionLabel?: string;
  readonly options: readonly { id: string; svg: string; label: string }[];
  readonly correctId: string;
  readonly joinTargetOnSuccess?: boolean;
}

export interface ChoiceGameSpec {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  readonly instruction: string;
  readonly instructionCueId?: SpeechCueId;
  readonly coPlayPrompt: string;
  readonly icon: () => string;
  readonly bubbleColor: string;
  readonly axes: readonly DifficultyAxisSpec[];
  readonly initialDifficulty: DifficultyVector;
  readonly renderer?: "dom" | "pixi";
  readonly content: readonly ContentItem[];
  readonly buildRound: (
    level: {
      targetId: string;
      choiceIds: readonly string[];
      correctChoiceId: string;
    },
    difficulty: DifficultyVector,
  ) => ChoiceRound;
  readonly similarityAttribute?: string;
  readonly similarityAxis?: string;
  readonly similarityAttributeForDifficulty?: (
    difficulty: DifficultyVector,
  ) => string | undefined;
}

function speakRound(ctx: GameContext, round: ChoiceRound): Promise<void> {
  return round.roundSpeechCueId
    ? ctx.speakCue(round.roundSpeechCueId, round.roundSpeech)
    : ctx.speak(round.roundSpeech);
}

export function createChoiceGame(spec: ChoiceGameSpec): WebGame {
  return {
    id: spec.id,
    title: spec.title,
    skillId: spec.skillId,
    domain: spec.domain,
    instruction: spec.instruction,
    ...(spec.instructionCueId
      ? { instructionCueId: spec.instructionCueId }
      : {}),
    coPlayPrompt: spec.coPlayPrompt,
    icon: spec.icon,
    bubbleColor: spec.bubbleColor,
    axes: spec.axes,
    initialDifficulty: spec.initialDifficulty,
    scored: true,

    async play(
      ctx: GameContext,
      difficulty: DifficultyVector,
      seed: string,
    ): Promise<PlayResult> {
      const choiceCount = Number(difficulty["choiceCount"] ?? 2);
      const useSimilarity =
        Number(
          difficulty[spec.similarityAxis ?? "distractorSimilarity"] ?? 0,
        ) >= 1;
      const similarityAttribute =
        spec.similarityAttributeForDifficulty?.(difficulty) ??
        (useSimilarity ? spec.similarityAttribute : undefined);

      const level = generateVisualChoice(seed, {
        gameId: spec.id,
        items: spec.content,
        choiceCount: Math.max(2, Math.min(choiceCount, spec.content.length)),
        ...(similarityAttribute ? { similarityAttribute } : {}),
      });
      const round = spec.buildRound(level.payload, difficulty);

      if (spec.renderer === "pixi" && round.targetSvg !== null) {
        return playPixiRound(
          ctx,
          { ...round, targetSvg: round.targetSvg },
          difficulty,
        );
      }

      let state = initializeChoice(
        level.payload.correctChoiceId,
        level.payload.choiceIds,
      );
      const support = new SupportTracker();
      clear(ctx.mount);

      const layout = el("div", {});
      layout.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;width:100%;height:100%;gap:8px;";
      if (round.targetSvg !== null) layout.append(targetStage(round.targetSvg, ""));

      const { row, cards } = choiceRow(
        round.options.map((option) => ({
          id: option.id,
          svg: option.svg,
          label: option.label,
        })),
      );
      layout.append(row);
      ctx.mount.append(layout);

      await Promise.all([
        speakRound(ctx, round),
        wait(demonstrationDelay(1300)),
      ]);
      if (ctx.isCancelled()) return aborted();

      const correctCard = cards.get(round.correctId);
      if (correctCard && !ctx.reducedMotion) {
        await ctx.demonstrate(correctCard);
        const hand = ctx.shell.querySelector<HTMLElement>(".demo-hand");
        if (hand) hand.style.opacity = "0";
      }
      row.dataset.gameReady = "true";

      return await new Promise<PlayResult>((resolve) => {
        let settled = false;
        let inputReady = true;
        let operationGeneration = 0;
        let cancelWatch: number | null = null;
        const active = (generation: number) =>
          generation === operationGeneration && !settled && !ctx.isCancelled();
        const finish = (result: PlayResult) => {
          if (settled) return;
          settled = true;
          inputReady = false;
          operationGeneration += 1;
          if (cancelWatch !== null) window.clearInterval(cancelWatch);
          resolve(result);
        };

        for (const option of round.options) {
          const card = cards.get(option.id);
          if (!card) continue;
          card.addEventListener("click", () => {
            if (!inputReady || settled || state.completed) return;
            const before = state;
            state = reduceChoice(state, {
              type: "select",
              value: option.id as Scalar,
            });
            if (state === before) return;

            if (state.completed) {
              inputReady = false;
              support.registerSuccess();
              markCorrect(card);
              danceItem(card);
              playItemVoice(option.id);
              const shellRect = ctx.shell.getBoundingClientRect();
              const cardRect = card.getBoundingClientRect();
              particlesAt(
                ctx.shell,
                cardRect.left - shellRect.left + cardRect.width / 2,
                cardRect.top - shellRect.top + cardRect.height / 2,
              );
              const correctFirstTry = state.correctFirstTry;
              const generation = ++operationGeneration;
              void wait(ctx.reducedMotion ? 350 : 1100).then(() => {
                if (!active(generation)) return;
                finish({
                  completed: true,
                  correctFirstTry,
                  correctEventually: true,
                  hintsUsed: support.hintsUsed,
                  wrongAttempts: support.wrongAttempts,
                });
              });
              return;
            }

            const verdict = support.registerError(card);
            if (verdict === "hint" && correctCard) {
              inputReady = false;
              showHintGlow(correctCard);
              jelly(correctCard);
              const generation = ++operationGeneration;
              void ctx.speakCue("same-hint", "Uite, acesta e la fel!").then(() => {
                if (active(generation)) inputReady = true;
              });
            } else if (verdict === "simplify" && correctCard) {
              inputReady = false;
              for (const other of round.options) {
                if (other.id !== round.correctId) {
                  cards.get(other.id)?.classList.add("dimmed");
                }
              }
              showHintGlow(correctCard);
              const generation = ++operationGeneration;
              void Promise.all([
                ctx.speakCue(
                  "same-help",
                  "Uite! Aceasta este perechea. Bravo că ai încercat!",
                ),
                wait(2200),
              ]).then(() => {
                if (!active(generation)) return;
                markCorrect(correctCard);
                finish({
                  completed: true,
                  correctFirstTry: false,
                  correctEventually: true,
                  hintsUsed: support.hintsUsed + 1,
                  wrongAttempts: support.wrongAttempts,
                });
              });
            }
          });
        }

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
        }, 250);
      });
    },
  };
}

async function playPixiRound(
  ctx: GameContext,
  round: ChoiceRound & { readonly targetSvg: string },
  difficulty: DifficultyVector,
): Promise<PlayResult> {
  clear(ctx.mount);
  const { createPixiChoiceScene } = await import("../runtime/pixiChoiceScene");
  const support = new SupportTracker();
  let state = initializeChoice(
    round.correctId,
    round.options.map((option) => option.id),
  );
  let inputReady = false;
  let settled = false;
  let operationGeneration = 0;
  let cancelWatch: number | null = null;
  let resolveResult: (result: PlayResult) => void = () => undefined;
  let repeatsUsed = 0;

  const result = new Promise<PlayResult>((resolve) => {
    resolveResult = resolve;
  });
  const active = (generation: number) =>
    generation === operationGeneration && !settled && !ctx.isCancelled();
  const finish = (outcome: PlayResult) => {
    if (settled) return;
    settled = true;
    inputReady = false;
    operationGeneration += 1;
    if (cancelWatch !== null) window.clearInterval(cancelWatch);
    resolveResult(outcome);
  };

  const repeatAvailability = String(
    difficulty["repeatAvailability"] ?? "always",
  );
  const scene = await createPixiChoiceScene(ctx.mount, {
    targetSvg: round.targetSvg,
    targetLabel: round.targetLabel,
    options: round.options,
    reducedMotion: ctx.reducedMotion,
    clutterLevel: Number(difficulty["sceneClutter"] ?? 0),
    ...(round.targetActionLabel
      ? {
          targetActionLabel: round.targetActionLabel,
          onTargetActivate: () => {
            inputReady = false;
            const generation = ++operationGeneration;
            void speakRound(ctx, round).then(() => {
              if (active(generation)) inputReady = true;
            });
            repeatsUsed += 1;
            return repeatAvailability !== "limited" || repeatsUsed < 1;
          },
        }
      : {}),
    onSelect(optionId) {
      if (!inputReady || settled || state.completed) return;
      const before = state;
      state = reduceChoice(state, {
        type: "select",
        value: optionId as Scalar,
      });
      if (state === before) return;

      if (state.completed) {
        inputReady = false;
        support.registerSuccess();
        const correctFirstTry = state.correctFirstTry;
        const generation = ++operationGeneration;
        void (async () => {
          if (round.joinTargetOnSuccess) {
            await scene.moveTargetToOption(optionId);
            if (!active(generation)) return;
          }
          if (!active(generation)) return;
          scene.markCorrect(optionId);
          playItemVoice(optionId);
          await wait(ctx.reducedMotion ? 350 : 950);
          if (!active(generation)) return;
          finish({
            completed: true,
            correctFirstTry,
            correctEventually: true,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
          });
        })();
        return;
      }

      scene.markIncorrect(optionId);
      const verdict = support.registerError(scene.readyElement);
      if (verdict === "hint") {
        inputReady = false;
        scene.emphasize(round.correctId);
        const generation = ++operationGeneration;
        void ctx.speakCue("same-hint", "Uite, acesta e la fel!").then(() => {
          if (active(generation)) inputReady = true;
        });
      } else if (verdict === "simplify") {
        inputReady = false;
        scene.dimExcept(round.correctId);
        scene.emphasize(round.correctId);
        const generation = ++operationGeneration;
        void Promise.all([
          ctx.speakCue(
            "same-help",
            "Uite! Aceasta este perechea. Bravo că ai încercat!",
          ),
          wait(1800),
        ]).then(async () => {
          if (!active(generation)) return;
          if (round.joinTargetOnSuccess) {
            await scene.moveTargetToOption(round.correctId);
            if (!active(generation)) return;
          }
          scene.markCorrect(round.correctId);
          finish({
            completed: true,
            correctFirstTry: false,
            correctEventually: true,
            hintsUsed: support.hintsUsed + 1,
            wrongAttempts: support.wrongAttempts,
          });
        });
      }
    },
  });
  ctx.onCleanup(() => {
    operationGeneration += 1;
    scene.destroy();
  });

  await Promise.all([
    speakRound(ctx, round),
    wait(demonstrationDelay(900)),
  ]);
  if (ctx.isCancelled()) return aborted();
  if (!ctx.reducedMotion) scene.emphasize(round.correctId);
  await wait(demonstrationDelay(400));
  if (ctx.isCancelled()) return aborted();
  inputReady = true;
  scene.readyElement.dataset.gameReady = "true";
  const targetCueDuration = Number(difficulty["targetCueDuration"] ?? -1);
  if (targetCueDuration > 0) {
    const hideTargetTimer = window.setTimeout(
      () => {
        if (!ctx.isCancelled() && !settled) scene.setTargetVisible(false);
      },
      targetCueDuration,
    );
    ctx.onCleanup(() => window.clearTimeout(hideTargetTimer));
  }

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

  return result;
}

function aborted(): PlayResult {
  return {
    completed: false,
    correctFirstTry: false,
    correctEventually: false,
    hintsUsed: 0,
    wrongAttempts: 0,
    abandoned: true,
  };
}
