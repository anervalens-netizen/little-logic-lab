/**
 * „Vânătoarea de culori” — activitate deschisă, nepunctată, în camera reală.
 */

import { createRng, shuffle, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { clear, wait } from "../ui/dom";
import { confettiBurst } from "../ui/feedback";
import { LEARN_COLORS } from "../art/palette";
import { svg } from "../art/svg";

function colorBadge(hex: string): string {
  return svg(`
    <circle cx="60" cy="60" r="44" fill="${hex}" stroke="rgba(74,63,53,0.15)" stroke-width="4"/>
    <circle cx="44" cy="42" r="12" fill="rgba(255,255,255,0.45)"/>
  `);
}

function colorTaskBadge(colors: readonly { readonly hex: string }[]): string {
  if (colors.length === 1) return colorBadge(colors[0]?.hex ?? "#F25C4C");
  const first = colors[0]?.hex ?? "#F25C4C";
  const second = colors[1]?.hex ?? "#4FA8E8";
  return svg(`
    <path d="M 60 16 A 44 44 0 0 0 60 104 Z" fill="${first}"/>
    <path d="M 60 16 A 44 44 0 0 1 60 104 Z" fill="${second}"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(74,63,53,0.18)" stroke-width="4"/>
    <circle cx="44" cy="42" r="10" fill="rgba(255,255,255,0.42)"/>
  `);
}

const FOUND_BADGE = svg(`
  <circle cx="60" cy="60" r="45" fill="#DDF4D4" stroke="#7FC86B" stroke-width="5"/>
  <path d="M 34 61 L 52 78 L 87 40" fill="none" stroke="#4E9A51" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
`);

export const realColorHuntGame: WebGame = {
  id: "real-color-hunt",
  title: "Vânătoarea de culori",
  skillId: "real_world_transfer",
  domain: "hybrid_transfer",
  instruction: "Hai la vânătoare! Căutăm culori prin cameră!",
  coPlayPrompt:
    "Continuați vânătoarea: câte lucruri de aceeași culoare găsiți?",
  icon: () => colorBadge("#F25C4C"),
  bubbleColor: "#7FC86B",
  axes: [
    { name: "stepCount", values: [2, 3, 4, 5, 6] },
    { name: "ruleCount", values: [1, 2] },
    { name: "memoryDelaySec", values: [0, 3, 8, 15, 20, 40] },
    {
      name: "parentPromptSupport",
      values: ["full", "brief", "optional"],
    },
  ],
  initialDifficulty: {
    stepCount: 2,
    ruleCount: 1,
    memoryDelaySec: 0,
    parentPromptSupport: "full",
  },
  scored: false,

  async play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult> {
    const stepCount = Math.max(
      2,
      Math.min(6, Number(difficulty["stepCount"] ?? 2)),
    );
    const ruleCount = Math.max(
      1,
      Math.min(2, Number(difficulty["ruleCount"] ?? 1)),
    );
    const memoryDelaySec = Math.max(
      0,
      Math.min(40, Number(difficulty["memoryDelaySec"] ?? 0)),
    );
    const parentPromptSupport = String(
      difficulty["parentPromptSupport"] ?? "full",
    );
    const palette = shuffle(LEARN_COLORS.slice(0, 4), createRng(seed));
    const tasks = Array.from({ length: stepCount }, (_, index) => {
      const first = palette[index % palette.length]!;
      const second = palette[(index + 1) % palette.length]!;
      return ruleCount === 1 ? [first] : [first, second];
    });
    const { createPixiChoiceScene } = await import(
      "../runtime/pixiChoiceScene"
    );

    for (let stepIndex = 0; stepIndex < tasks.length; stepIndex += 1) {
      const colors = tasks[stepIndex]!;
      if (ctx.isCancelled()) break;
      clear(ctx.mount);
      let settled = false;
      let inputReady = false;
      let resolveStep: (found: boolean) => void = () => undefined;
      const stepResult = new Promise<boolean>((resolve) => {
        resolveStep = resolve;
      });
      let completionTimer: number | null = null;
      let cancelWatch: number | null = null;
      const colorWords = colors.map((color) => color.label).join(" și ");
      const spokenTask =
        parentPromptSupport === "full"
          ? `Căutați împreună ceva ${colorWords} în cameră!`
          : parentPromptSupport === "brief"
            ? `Găsește ceva ${colorWords}!`
            : `Caută ${colorWords}!`;

      const scene = await createPixiChoiceScene(ctx.mount, {
        targetSvg: colorTaskBadge(colors),
        targetLabel:
          colors.length === 1
            ? `culoarea ${colorWords}`
            : `culorile ${colorWords}`,
        targetDescriptionFollowsVisibility: true,
        options: [
          {
            id: "found",
            svg: FOUND_BADGE,
            label: `Am găsit ceva ${colorWords}`,
          },
        ],
        reducedMotion: ctx.reducedMotion,
        onSelect(id) {
          if (!inputReady || settled || id !== "found") return;
          inputReady = false;
          settled = true;
          scene.markCorrect(id);
          completionTimer = window.setTimeout(
            () => resolveStep(true),
            ctx.reducedMotion ? 180 : 520,
          );
        },
      });
      ctx.onCleanup(scene.destroy);
      scene.setOptionEnabled("found", false);
      scene.readyElement.dataset.sceneReady = "true";
      scene.readyElement.dataset.stepCount = String(stepCount);
      scene.readyElement.dataset.ruleCount = String(ruleCount);
      scene.readyElement.dataset.memoryDelaySec = String(memoryDelaySec);
      scene.readyElement.dataset.parentPromptSupport = parentPromptSupport;
      scene.readyElement.dataset.stepIndex = String(stepIndex + 1);

      await ctx.speak(`${spokenTask} Apasă când ai găsit!`);
      if (ctx.isCancelled()) {
        scene.destroy();
        break;
      }

      if (memoryDelaySec > 0) {
        await wait(ctx.reducedMotion ? 650 : 1_200);
        scene.setTargetVisible(false);
        await ctx.speak("Ține minte și caută!");
        if (!(await waitUntilReady(ctx, memoryDelaySec * 1_000))) {
          scene.destroy();
          break;
        }
        await ctx.speak("Acum poți arăta că ai găsit!");
      }

      if (ctx.isCancelled()) {
        scene.destroy();
        break;
      }
      scene.setOptionEnabled("found", true);
      inputReady = true;
      scene.readyElement.dataset.gameReady = "true";
      cancelWatch = window.setInterval(() => {
        if (!ctx.isCancelled() || settled) return;
        inputReady = false;
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

async function waitUntilReady(
  ctx: GameContext,
  durationMs: number,
): Promise<boolean> {
  let remaining = durationMs;
  while (remaining > 0) {
    if (ctx.isCancelled()) return false;
    const slice = Math.min(200, remaining);
    await wait(slice);
    remaining -= slice;
  }
  return !ctx.isCancelled();
}
