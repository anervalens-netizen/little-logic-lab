/** „Privește și găsește" — memorie vizuală: obiectul se ascunde sub un pahar. */

import { createRng, chooseOne, shuffle, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { el, clear, svgEl, wait } from "../ui/dom";
import { showHintGlow, markCorrect, isMotionReduced, jelly } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxPop } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { ITEMS, drawItem } from "../art/items";
import { drawLumi } from "../art/lumi";

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
    { name: "locationCount", values: [2, 3] },
    { name: "delayMs", values: [0, 500] },
  ],
  initialDifficulty: { locationCount: 2, delayMs: 0 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const locationCount = Number(difficulty["locationCount"] ?? 2);
    const delayMs = Number(difficulty["delayMs"] ?? 0);
    const rng = createRng(seed);
    const item = chooseOne(ITEMS.filter((i) => i.category === "animal"), rng);
    const positions = shuffle([...Array(locationCount).keys()], rng);
    const hiddenAt = positions[0] ?? 0;

    const support = new SupportTracker();
    clear(ctx.mount);

    const stage = el("div", {});
    stage.style.cssText =
      "position:relative;display:flex;align-items:flex-end;justify-content:center;gap:clamp(24px,6vw,60px);width:100%;height:100%;padding-bottom:8%;";

    const itemHolder = el("div", {});
    itemHolder.style.cssText =
      "position:absolute;left:50%;top:8%;transform:translateX(-50%);width:clamp(110px,20vmin,170px);z-index:6;transition:all 900ms cubic-bezier(0.5,1.2,0.4,1);";
    itemHolder.append(svgEl(drawItem(item.id)));

    const cups: HTMLElement[] = [];
    for (let i = 0; i < locationCount; i += 1) {
      const cup = el("button", { className: "choice-card pop-in", "aria-label": `paharul ${i + 1}` });
      cup.style.cssText =
        "width:clamp(130px,24vmin,220px);background:transparent;border:none;box-shadow:none;transition:transform 500ms cubic-bezier(0.34,1.56,0.64,1);";
      cup.style.animationDelay = `${i * 120}ms`;
      cup.classList.add("lll-sway");
      cup.style.setProperty("--float-delay", `${i * 0.7}s`);
      cup.append(svgEl(cupSvg(CUP_COLORS[i % CUP_COLORS.length] ?? "#F25C4C")));
      stage.append(cup);
      cups.push(cup);
    }

    ctx.mount.append(stage);
    stage.append(itemHolder);

    // Prezentare: obiectul se vede, apoi „se ascunde" sub paharul ales.
    speak(`Privește! Aici e ${item.labelDef}!`);
    await wait(1600);
    if (ctx.isCancelled()) return abort();

    const targetCup = cups[hiddenAt];
    if (!targetCup) return abort();
    const stageRect = stage.getBoundingClientRect();
    const cupRect = targetCup.getBoundingClientRect();
    itemHolder.style.left = `${cupRect.left - stageRect.left + cupRect.width / 2}px`;
    itemHolder.style.top = `${cupRect.top - stageRect.top + cupRect.height * 0.28}px`;
    itemHolder.style.width = `${cupRect.width * 0.55}px`;
    speak("Se ascunde! Unde e?");
    sfxPop();
    await wait(1100 + delayMs);
    if (ctx.isCancelled()) return abort();

    // Paharul coboară peste obiect.
    itemHolder.style.zIndex = "1";
    targetCup.style.zIndex = "5";

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

      const reveal = async (cup: HTMLElement, found: boolean) => {
        cup.classList.remove("lll-sway");
        cup.style.transform = "translateY(-46%) scale(1.05)";
        itemHolder.style.zIndex = "6";
        await wait(isMotionReduced() ? 200 : 700);
        if (found) {
          markCorrect(itemHolder);
          jelly(itemHolder);
          playItemVoice(item.id);
        }
      };

      cups.forEach((cup, index) => {
        cup.addEventListener("click", () => {
          if (settled) return;
          if (index === hiddenAt) {
            support.registerSuccess();
            const firstTry = support.wasFirstTryClean;
            void reveal(cup, true).then(() => {
              setTimeout(
                () => finish({ completed: true, correctFirstTry: firstTry, correctEventually: true, hintsUsed: support.hintsUsed, wrongAttempts: support.wrongAttempts }),
                700,
              );
            });
            return;
          }
          const verdict = support.registerError(cup);
          if (verdict === "hint") {
            showHintGlow(targetCup);
            speak("Uite, e sub acesta!");
          } else if (verdict === "simplify") {
            showHintGlow(targetCup);
            speak(`Uite! Aici era ${item.labelDef}!`);
            void reveal(targetCup, true).then(() => {
              setTimeout(
                () => finish({ completed: true, correctFirstTry: false, correctEventually: true, hintsUsed: support.hintsUsed + 1, wrongAttempts: support.wrongAttempts }),
                1000,
              );
            });
          }
        });
      });
    });
  },
};

function abort(): PlayResult {
  return { completed: false, correctFirstTry: false, correctEventually: false, hintsUsed: 0, wrongAttempts: 0, abandoned: true };
}

export { drawLumi };
