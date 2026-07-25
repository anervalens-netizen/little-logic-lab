/** „Ce facem întâi?" — ordonarea pașilor unei rutine familiare. */

import { createRng, chooseOne, shuffle, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { el, clear, svgEl, wait } from "../ui/dom";
import { showHintGlow, particlesAt, isMotionReduced } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { drawRoutine, ROUTINE_CHAINS, ROUTINE_LABELS, type RoutineId } from "../art/routines";

const STEP_WORDS = ["Întâi", "Apoi", "La urmă"];

export const dailyOrderGame: WebGame = {
  id: "daily-order",
  title: "Ce facem întâi?",
  skillId: "temporal_sequencing",
  domain: "sequencing_patterns",
  instruction: "Pune imaginile în ordine! Ce facem întâi?",
  coPlayPrompt: "Povestiți împreună: ce facem dimineața? Și seara, înainte de culcare?",
  icon: () => drawRoutine("eat"),
  bubbleColor: "#9B8CF2",
  axes: [
    { name: "stepCount", values: [2, 3] },
    { name: "distractorCount", values: [0, 1] },
  ],
  initialDifficulty: { stepCount: 2, distractorCount: 0 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const stepCount = Number(difficulty["stepCount"] ?? 2);
    const rng = createRng(seed);
    const chain = chooseOne(
      ROUTINE_CHAINS.filter((c) => c.length >= stepCount),
      rng,
    );
    const steps = chain.slice(0, stepCount) as RoutineId[];
    const presented = shuffle(steps, createRng(`${seed}:order`));

    const support = new SupportTracker();
    clear(ctx.mount);

    const layout = el("div", {});
    layout.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;width:100%;height:100%;gap:8px;";

    // Zona „terminat" — benzile cu pașii deja puși în ordine.
    const doneRow = el("div", {});
    doneRow.style.cssText =
      "display:flex;gap:clamp(12px,3vw,26px);min-height:clamp(100px,17vmin,150px);align-items:center;background:rgba(255,255,255,0.5);border-radius:32px;padding:10px 22px;";

    const cardsRow = el("div", { className: "choice-row" });
    layout.append(doneRow, cardsRow);
    ctx.mount.append(layout);

    const cardNodes = new Map<RoutineId, HTMLElement>();
    presented.forEach((id, index) => {
      const card = el("button", { className: "choice-card pop-in", "aria-label": ROUTINE_LABELS[id] });
      card.style.animationDelay = `${index * 130}ms`;
      card.append(svgEl(drawRoutine(id)));
      cardsRow.append(card);
      cardNodes.set(id, card);
    });

    let nextIndex = 0;
    speak(`${STEP_WORDS[0]}: ce facem ${steps.length === 2 ? "întâi" : "la început"}?`);

    return await new Promise<PlayResult>((resolve) => {
      let settled = false;
      const finish = (result: PlayResult) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const cancelWatch = setInterval(() => {
        if (ctx.isCancelled()) {
          clearInterval(cancelWatch);
          finish({ completed: false, correctFirstTry: false, correctEventually: false, hintsUsed: support.hintsUsed, wrongAttempts: support.wrongAttempts, abandoned: true });
        }
      }, 250);

      const acceptStep = async (id: RoutineId) => {
        const card = cardNodes.get(id);
        if (!card) return;
        sfxPlace();
        speak(STEP_WORDS[Math.min(nextIndex, STEP_WORDS.length - 1)] ?? "Apoi", { rate: 1 });
        const badge = el("div", {});
        badge.style.cssText =
          "position:absolute;top:-14px;left:-14px;width:44px;height:44px;border-radius:50%;background:#FFD35C;color:#4A3F35;font-weight:800;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(74,63,53,0.18);";
        badge.textContent = String(nextIndex + 1);
        card.append(badge);

        // FLIP: animăm zborul cărții din poziția veche în banda de pași.
        const from = card.getBoundingClientRect();
        card.style.width = "clamp(100px,17vmin,150px)";
        doneRow.append(card);
        card.classList.remove("pop-in");
        card.style.animation = "none";
        if (!isMotionReduced()) {
          const to = card.getBoundingClientRect();
          const dx = from.left - to.left;
          const dy = from.top - to.top;
          void card.animate(
            [
              { transform: `translate(${dx}px, ${dy}px) scale(${from.width / Math.max(1, to.width)})` },
              { transform: "translate(0, 6px) scale(1.04)", offset: 0.7 },
              { transform: "none" },
            ],
            { duration: 460, easing: "cubic-bezier(0.34, 1.35, 0.64, 1)" },
          ).finished;
        }
        nextIndex += 1;

        if (nextIndex >= steps.length) {
          const shellRect = ctx.shell.getBoundingClientRect();
          const rowRect = doneRow.getBoundingClientRect();
          particlesAt(ctx.shell, rowRect.left - shellRect.left + rowRect.width / 2, rowRect.top - shellRect.top, { count: 9 });
          await wait(500);
          finish({
            completed: true,
            correctFirstTry: support.wasFirstTryClean,
            correctEventually: true,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
          });
          return;
        }
        await wait(350);
        speak(`${STEP_WORDS[Math.min(nextIndex, STEP_WORDS.length - 1)]}?`);
      };

      for (const [id, card] of cardNodes) {
        card.addEventListener("click", () => {
          if (settled) return;
          const expected = steps[nextIndex];
          if (id === expected) {
            support.registerSuccess();
            void acceptStep(id);
            return;
          }
          const verdict = support.registerError(card);
          if (verdict === "hint") {
            const expectedCard = expected ? cardNodes.get(expected) : undefined;
            if (expectedCard) showHintGlow(expectedCard);
            speak(`Uite, asta facem ${STEP_WORDS[Math.min(nextIndex, 2)]?.toLowerCase()}!`);
          } else if (verdict === "simplify") {
            const expectedCard = expected ? cardNodes.get(expected) : undefined;
            if (expectedCard) {
              showHintGlow(expectedCard);
              speak("Hai să le punem împreună!");
              void (async () => {
                while (nextIndex < steps.length && !ctx.isCancelled()) {
                  const stepId = steps[nextIndex];
                  if (stepId) await acceptStep(stepId);
                  await wait(500);
                }
              })();
            }
          }
        });
      }
    });
  },
};
