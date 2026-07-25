/**
 * „Vânătoarea de culori” — activitate deschisă, nepunctată, în camera reală.
 */

import { createRng, chooseDistinct, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { clear, wait } from "../ui/dom";
import { confettiBurst } from "../ui/feedback";
import { speak } from "../audio/speech";
import { LEARN_COLORS } from "../art/palette";
import { svg } from "../art/svg";

function colorBadge(hex: string): string {
  return svg(`
    <circle cx="60" cy="60" r="44" fill="${hex}" stroke="rgba(74,63,53,0.15)" stroke-width="4"/>
    <circle cx="44" cy="42" r="12" fill="rgba(255,255,255,0.45)"/>
  `);
}

const FOUND_BADGE = svg(`
  <circle cx="60" cy="60" r="45" fill="#DDF4D4" stroke="#7FC86B" stroke-width="5"/>
  <path d="M 34 61 L 52 78 L 87 40" fill="none" stroke="#4E9A51" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
`);

export const colorHuntGame: WebGame = {
  id: "real-color-hunt",
  title: "Vânătoarea de culori",
  skillId: "real_world_transfer",
  domain: "hybrid_transfer",
  instruction: "Hai la vânătoare! Căutăm culori prin cameră!",
  coPlayPrompt:
    "Continuați vânătoarea: câte lucruri de aceeași culoare găsiți?",
  icon: () => colorBadge("#F25C4C"),
  bubbleColor: "#7FC86B",
  axes: [{ name: "stepCount", values: [2, 3] }],
  initialDifficulty: { stepCount: 2 },
  scored: false,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const stepCount = Math.max(
      2,
      Math.min(3, Number(difficulty["stepCount"] ?? 2)),
    );
    const colors = chooseDistinct(
      LEARN_COLORS.slice(0, 4),
      stepCount,
      createRng(seed),
    );
    const { createPixiChoiceScene } = await import(
      "../runtime/pixiChoiceScene"
    );

    for (const color of colors) {
      if (ctx.isCancelled()) break;
      clear(ctx.mount);
      let settled = false;
      let resolveStep: (found: boolean) => void = () => undefined;
      const stepResult = new Promise<boolean>((resolve) => {
        resolveStep = resolve;
      });
      let completionTimer: number | null = null;
      let cancelWatch: number | null = null;

      const scene = await createPixiChoiceScene(ctx.mount, {
        targetSvg: colorBadge(color.hex),
        targetLabel: `culoarea ${color.label}`,
        options: [
          {
            id: "found",
            svg: FOUND_BADGE,
            label: `Am găsit ceva ${color.label}`,
          },
        ],
        reducedMotion: ctx.reducedMotion,
        onSelect(id) {
          if (settled || id !== "found") return;
          settled = true;
          scene.markCorrect(id);
          completionTimer = window.setTimeout(
            () => resolveStep(true),
            ctx.reducedMotion ? 180 : 520,
          );
        },
      });
      ctx.onCleanup(scene.destroy);
      scene.readyElement.dataset.gameReady = "true";
      speak(
        `Găsește ceva ${color.label} în cameră! Apasă când ai găsit!`,
      );
      cancelWatch = window.setInterval(() => {
        if (!ctx.isCancelled() || settled) return;
        settled = true;
        resolveStep(false);
      }, 200);

      const found = await stepResult;
      if (cancelWatch !== null) window.clearInterval(cancelWatch);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
      scene.destroy();
      if (!found || ctx.isCancelled()) break;
      confettiBurst(ctx.shell, 14);
      await wait(ctx.reducedMotion ? 120 : 360);
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
