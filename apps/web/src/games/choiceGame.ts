/**
 * Fabrică pentru jocuri de tip „alege imaginea corectă":
 * same-picture, shadow-match, listen-find, emotion-match.
 * Mecanica pură vine din core (generateVisualChoice + reduceChoice).
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
  /** SVG-ul țintei (modelul); null pentru jocuri doar audio. */
  readonly targetSvg: string | null;
  readonly targetLabel: string;
  /** Text rostit când începe runda (poate diferi de instrucțiunea jocului). */
  readonly roundSpeech: string;
  /** Acțiune accesibilă pe reperul central (de ex. repetarea promptului audio). */
  readonly targetActionLabel?: string;
  readonly options: readonly { id: string; svg: string; label: string }[];
  readonly correctId: string;
}

export interface ChoiceGameSpec {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  readonly instruction: string;
  readonly coPlayPrompt: string;
  readonly icon: () => string;
  readonly bubbleColor: string;
  readonly axes: readonly DifficultyAxisSpec[];
  readonly initialDifficulty: DifficultyVector;
  /** Golden-slice games use the lazy-loaded Pixi renderer. */
  readonly renderer?: "dom" | "pixi";
  /** Conținutul din care generează core-ul (id + atribute). */
  readonly content: readonly ContentItem[];
  /** Construiește runda vizuală din nivelul generat. */
  readonly buildRound: (
    level: {
      targetId: string;
      choiceIds: readonly string[];
      correctChoiceId: string;
    },
    difficulty: DifficultyVector,
  ) => ChoiceRound;
  /** Atribut de similitudine pentru distractori (opțional). */
  readonly similarityAttribute?: string;
  /** Axa care activează distractorii similari; implicit `distractorSimilarity`. */
  readonly similarityAxis?: string;
  readonly similarityAttributeForDifficulty?: (
    difficulty: DifficultyVector,
  ) => string | undefined;
}

export function createChoiceGame(spec: ChoiceGameSpec): WebGame {
  return {
    id: spec.id,
    title: spec.title,
    skillId: spec.skillId,
    domain: spec.domain,
    instruction: spec.instruction,
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

      if (round.targetSvg !== null) {
        layout.append(targetStage(round.targetSvg, ""));
      }

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
        ctx.speak(round.roundSpeech),
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
        let cancelWatch: number | null = null;
        const finish = (result: PlayResult) => {
          if (settled) return;
          settled = true;
          inputReady = false;
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
              void wait(ctx.reducedMotion ? 350 : 1100).then(() =>
                finish({
                  completed: true,
                  correctFirstTry,
                  correctEventually: true,
                  hintsUsed: support.hintsUsed,
                  wrongAttempts: support.wrongAttempts,
                }),
              );
              return;
            }

            const verdict = support.registerError(card);
            if (verdict === "hint" && correctCard) {
              inputReady = false;
              showHintGlow(correctCard);
              jelly(correctCard);
              void ctx.speak("Uite, acesta e la fel!").then(() => {
                if (!settled && !ctx.isCancelled()) inputReady = true;
              });
            } else if (verdict === "simplify" && correctCard) {
              inputReady = false;
              for (const other of round.options) {
                if (other.id !== round.correctId) {
                  cards.get(other.id)?.classList.add("dimmed");
                }
              }
              showHintGlow(correctCard);
              void Promise.all([
                ctx.speak(
                  "Uite! Aceasta este perechea. Bravo că ai încercat!",
                ),
                wait(2200),
              ]).then(() => {
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
  let cancelWatch: number | null = null;
  let resolveResult: (result: PlayResult) => void = () => undefined;
  let repeatsUsed = 0;

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
            void ctx.speak(round.roundSpeech).then(() => {
              if (!settled && !ctx.isCancelled()) inputReady = true;
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
        scene.markCorrect(optionId);
        playItemVoice(optionId);
        void wait(ctx.reducedMotion ? 350 : 950).then(() =>
          finish({
            completed: true,
            correctFirstTry: state.correctFirstTry,
            correctEventually: true,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
          }),
        );
        return;
      }

      scene.markIncorrect(optionId);
      const verdict = support.registerError(scene.readyElement);
      if (verdict === "hint") {
        inputReady = false;
        scene.emphasize(round.correctId);
        void ctx.speak("Uite, acesta e la fel!").then(() => {
          if (!settled && !ctx.isCancelled()) inputReady = true;
        });
      } else if (verdict === "simplify") {
        inputReady = false;
        scene.dimExcept(round.correctId);
        scene.emphasize(round.correctId);
        void Promise.all([
          ctx.speak("Uite! Aceasta este perechea. Bravo că ai încercat!"),
          wait(1800),
        ]).then(() => {
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
  ctx.onCleanup(scene.destroy);

  await Promise.all([
    ctx.speak(round.roundSpeech),
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
      () => scene.setTargetVisible(false),
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
