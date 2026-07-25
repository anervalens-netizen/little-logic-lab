/**
 * „Vânătoarea de culori" — activitate hibridă: tableta dă sarcina,
 * copilul caută în camera reală. NU se punctează (activitate deschisă).
 */

import { createRng, chooseDistinct, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { el, clear, svgEl, wait } from "../ui/dom";
import { confettiBurst, praise } from "../ui/feedback";
import { speak } from "../audio/speech";
import { LEARN_COLORS } from "../art/palette";
import { drawLumi } from "../art/lumi";
import { svg } from "../art/svg";

function colorBadge(hex: string): string {
  return svg(`
    <circle cx="60" cy="60" r="44" fill="${hex}" stroke="rgba(74,63,53,0.15)" stroke-width="4"/>
    <circle cx="44" cy="42" r="12" fill="rgba(255,255,255,0.45)"/>
  `);
}

export const colorHuntGame: WebGame = {
  id: "real-color-hunt",
  title: "Vânătoarea de culori",
  skillId: "real_world_transfer",
  domain: "hybrid_transfer",
  instruction: "Hai la vânătoare! Căutăm culori prin cameră!",
  coPlayPrompt: "Continuați vânătoarea: câte lucruri de aceeași culoare găsiți?",
  icon: () => colorBadge("#F25C4C"),
  bubbleColor: "#7FC86B",
  axes: [{ name: "stepCount", values: [2, 3] }],
  initialDifficulty: { stepCount: 2 },
  scored: false,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const stepCount = Number(difficulty["stepCount"] ?? 2);
    const colors = chooseDistinct(
      LEARN_COLORS.slice(0, 4),
      stepCount,
      createRng(seed),
    );

    for (const color of colors) {
      if (ctx.isCancelled()) break;
      clear(ctx.mount);

      const wrap = el("div", {});
      wrap.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(16px,4vmin,36px);width:100%;height:100%;";

      const lumiArt = el("div", { className: "lumi happy" });
      lumiArt.append(svgEl(drawLumi("happy", 110)));

      const badge = el("div", { className: "pop-in" });
      badge.style.cssText = "width:clamp(160px,30vmin,260px);";
      badge.append(svgEl(colorBadge(color.hex)));

      const text = el("div", { className: "speech-bubble" }, `Găsește ceva ${color.label.toUpperCase()} în cameră!`);

      const found = el("button", { className: "btn-big green" }, "Am găsit!");

      wrap.append(lumiArt, badge, text, found);
      ctx.mount.append(wrap);

      speak(`Găsește ceva ${color.label} în cameră! Apasă când ai găsit!`);

      await new Promise<void>((resolve) => {
        found.addEventListener("click", () => resolve(), { once: true });
        const cancelWatch = setInterval(() => {
          if (ctx.isCancelled()) {
            clearInterval(cancelWatch);
            resolve();
          }
        }, 300);
      });

      if (!ctx.isCancelled()) {
        confettiBurst(ctx.shell, 20);
        await praise(ctx.shell, { text: "Bravo, exploratorule!", voice: true });
      }
      await wait(400);
    }

    return {
      completed: !ctx.isCancelled(),
      correctFirstTry: true,
      correctEventually: true,
      hintsUsed: 0,
      wrongAttempts: 0,
      abandoned: ctx.isCancelled(),
    };
  },
};
