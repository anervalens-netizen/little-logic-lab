/** „Așteaptă semnalul" — control inhibitor: atinge soarele, stai la lună. */

import { generateGoNoGo, initializeGoNoGo, reduceGoNoGo, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { el, clear, svgEl, wait } from "../ui/dom";
import { sparklesAt, isMotionReduced, jelly } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxGo, sfxGentleNo } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";
import { svg } from "../art/svg";

const MOON_STARS = svg(`
  <path d="M 78 14 Q 44 26 44 60 Q 44 94 78 106 Q 60 110 42 100 Q 16 86 16 60 Q 16 34 42 20 Q 60 10 78 14 Z" fill="#B9C3E8" stroke="#8B97CC" stroke-width="3.5"/>
  <circle cx="48" cy="52" r="4" fill="#4A3F35"/>
  <path d="M 44 66 Q 48 69 52 66" stroke="#4A3F35" stroke-width="2.8" stroke-linecap="round" fill="none"/>
  <circle cx="86" cy="30" r="3" fill="#fff"/><circle cx="98" cy="48" r="2.4" fill="#fff"/>
`);

export const waitForGoGame: WebGame = {
  id: "wait-for-go",
  title: "Așteaptă semnalul",
  skillId: "inhibitory_control",
  domain: "inhibition_flexibility",
  instruction: "Când apare SOARELE, atinge-l repede! Când apare LUNA, stai cuminte!",
  coPlayPrompt: "Jucați „Pe verde mergem, pe roșu ne oprim” prin casă!",
  icon: () => drawItem("sun"),
  bubbleColor: "#FFD35C",
  axes: [
    { name: "trialCount", values: [4, 6] },
    { name: "goNoGoRatio", values: [0.75, 0.6] },
  ],
  initialDifficulty: { trialCount: 4, goNoGoRatio: 0.75 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const trialCount = Number(difficulty["trialCount"] ?? 4);
    const goRatio = Number(difficulty["goNoGoRatio"] ?? 0.75);

    const level = generateGoNoGo(seed, {
      gameId: "wait-for-go",
      trialCount,
      goRatio,
      goStimulusId: "sun",
      noGoStimulusId: "moon",
    });

    let state = initializeGoNoGo(level.payload.trials);
    let hintsUsed = 0;

    clear(ctx.mount);
    const sky = el("div", {});
    sky.style.cssText =
      "position:relative;width:min(520px,92vw);height:min(420px,60vh);border-radius:48px;display:flex;align-items:center;justify-content:center;transition:background 500ms ease;overflow:hidden;box-shadow:0 10px 0 rgba(74,63,53,0.10);";
    sky.style.background = "#BFE3F2";

    const stimulus = el("div", {});
    stimulus.style.cssText = "width:min(240px,40vmin);transition:transform 300ms cubic-bezier(0.34,1.56,0.64,1);";
    sky.append(stimulus);

    const ruleStrip = el("div", {});
    ruleStrip.style.cssText =
      "position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:18px;background:rgba(255,255,255,0.75);border-radius:999px;padding:8px 18px;align-items:center;";
    const sunMini = el("div", {});
    sunMini.style.cssText = "width:44px;";
    sunMini.append(svgEl(drawItem("sun")));
    const tapText = el("span", { style: "font-weight:800;font-size:20px;" }, "= atinge!");
    const moonMini = el("div", {});
    moonMini.style.cssText = "width:40px;";
    moonMini.append(svgEl(MOON_STARS));
    const waitText = el("span", { style: "font-weight:800;font-size:20px;" }, "= stai");
    ruleStrip.append(sunMini, tapText, moonMini, waitText);
    sky.append(ruleStrip);

    ctx.mount.append(sky);

    speak("Atinge SOARELE! La LUNĂ, stai cuminte!");
    await wait(1800);

    for (const trial of level.payload.trials) {
      if (ctx.isCancelled()) break;

      sky.style.background = "#BFE3F2";
      stimulus.replaceChildren();
      stimulus.style.transform = "scale(0)";
      await wait(isMotionReduced() ? 300 : 750);
      if (ctx.isCancelled()) break;

      const isGo = trial.expectedAction === "tap";
      sky.style.background = isGo ? "#8FD4F7" : "#5B5B9E";
      stimulus.append(svgEl(isGo ? drawItem("sun") : MOON_STARS));
      stimulus.style.transform = "scale(1)";
      jelly(stimulus);
      if (isGo) {
        sfxGo();
        playItemVoice("sun");
      } else {
        playItemVoice("moon");
        speak("Stai!", { rate: 1.05 });
      }

      const observed = await new Promise<"tap" | "wait">((resolveTap) => {
        let done = false;
        const finish = (value: "tap" | "wait") => {
          if (done) return;
          done = true;
          sky.removeEventListener("pointerdown", onTap);
          resolveTap(value);
        };
        const onTap = () => finish("tap");
        sky.addEventListener("pointerdown", onTap);
        setTimeout(() => finish("wait"), isGo ? 3200 : 2100);
      });

      state = reduceGoNoGo(state, { type: "resolve_trial", observedAction: observed });

      if (observed === trial.expectedAction) {
        const rect = stimulus.getBoundingClientRect();
        const skyRect = sky.getBoundingClientRect();
        sparklesAt(sky, rect.left - skyRect.left + rect.width / 2, rect.top - skyRect.top + rect.height / 2, 6);
      } else if (observed === "tap" && !isGo) {
        sfxGentleNo();
        speak("La lună stăm cuminti!", { rate: 1 });
        hintsUsed += 0; // nu e indiciu; e doar feedback
        await wait(900);
      } else {
        // A așteptat la soare — îl invităm să atingă.
        speak("Atinge soarele!");
      }

      stimulus.style.transform = "scale(0)";
      await wait(420);
    }

    const correctTrials = state.correctTrials;
    const total = level.payload.trials.length;
    const completed = !ctx.isCancelled();
    const accuracy = total === 0 ? 0 : correctTrials / total;
    return {
      completed,
      correctFirstTry: completed && accuracy === 1,
      correctEventually: completed && accuracy >= 0.75,
      hintsUsed,
      wrongAttempts: total - correctTrials,
      abandoned: ctx.isCancelled(),
    };
  },
};
