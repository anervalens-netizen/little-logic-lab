/**
 * Fabrică pentru jocuri de sortare: „atinge obiectul, apoi coșul potrivit”.
 */

import {
  generateSortLevel,
  initializeSort,
  reduceSort,
  type ContentItem,
  type DifficultyAxisSpec,
  type DifficultyVector,
} from "@core";
import type { SpeechCueId } from "../audio/speech";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { trayWithItems, coloredBin } from "./widgets";
import { el, clear, svgEl, wait } from "../ui/dom";
import {
  showHintGlow,
  isMotionReduced,
  particlesAt,
  jelly,
} from "../ui/feedback";
import { sfxPick, sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { makeDraggable } from "../ui/dragdrop";
import type { PixiDragScene } from "../runtime/pixiDragScene";
import { demonstrationDelay } from "../ui/accessibilityPreferences";

export interface SortItemVisual {
  readonly id: string;
  readonly svg: string;
  readonly speakOnPlace?: string;
  readonly speakOnPlaceCueId?: SpeechCueId;
}

export interface SortGameSpec {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  readonly instruction: string;
  readonly instructionCueId?: SpeechCueId;
  readonly hintSpeech?: string;
  readonly hintCueId?: SpeechCueId;
  readonly helpSpeech?: string;
  readonly helpCueId?: SpeechCueId;
  readonly coPlayPrompt: string;
  readonly icon: () => string;
  readonly bubbleColor: string;
  readonly axes: readonly DifficultyAxisSpec[];
  readonly initialDifficulty: DifficultyVector;
  readonly renderer?: "dom" | "pixi";
  readonly content: readonly ContentItem[];
  readonly contentForSeed?: (seed: string) => readonly ContentItem[];
  readonly attribute: string;
  readonly binVisual: (
    value: string,
    index: number,
  ) => { hex: string; badge?: string; label: string };
  readonly itemVisual: (itemId: string) => SortItemVisual;
  readonly speakPick?: (itemId: string) => string;
}

function speakWithCue(
  ctx: GameContext,
  cueId: SpeechCueId | undefined,
  text: string,
  opts: { readonly rate?: number } = {},
): Promise<void> {
  return cueId ? ctx.speakCue(cueId, text, opts) : ctx.speak(text, opts);
}

export function createSortGame(spec: SortGameSpec): WebGame {
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
      const binCount = Number(difficulty["binCount"] ?? 2);
      const itemCount = Number(difficulty["itemCount"] ?? 2);
      const content = spec.contentForSeed
        ? spec.contentForSeed(seed)
        : spec.content;

      let level = generateSortLevel(seed, {
        gameId: spec.id,
        items: content,
        attribute: spec.attribute,
        binCount: Math.max(2, binCount),
        itemCount: Math.max(2, itemCount),
      });
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const covered = new Set(
          Object.values(level.payload.correctBinByItemId),
        );
        if (level.payload.bins.every((bin) => covered.has(bin))) break;
        level = generateSortLevel(`${seed}#cover${attempt}`, {
          gameId: spec.id,
          items: content,
          attribute: spec.attribute,
          binCount: Math.max(2, binCount),
          itemCount: Math.max(2, itemCount),
        });
      }

      if (spec.renderer === "pixi") {
        return playPixiSortRound(ctx, spec, level.payload);
      }

      let state = initializeSort(level.payload.correctBinByItemId);
      const support = new SupportTracker();
      clear(ctx.mount);

      const layout = el("div", {});
      layout.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:100%;height:100%;gap:6px;";
      const itemVisuals = level.payload.itemIds.map((id) =>
        spec.itemVisual(id),
      );
      const { tray, nodes } = trayWithItems(
        itemVisuals.map((visual) => ({
          id: visual.id,
          svg: visual.svg,
          label: visual.speakOnPlace ?? visual.id,
        })),
      );
      const binsRow = el("div", { className: "sort-bins" });
      const binNodes = new Map<string, HTMLElement>();
      level.payload.bins.forEach((binValue, binIndex) => {
        const visual = spec.binVisual(binValue, binIndex);
        const bin = coloredBin(binValue, visual.hex, visual.badge);
        bin.setAttribute("aria-label", visual.label);
        binNodes.set(binValue, bin);
        binsRow.append(bin);
      });
      layout.append(tray, binsRow);
      ctx.mount.append(layout);

      await Promise.all([
        speakWithCue(ctx, spec.instructionCueId, spec.instruction),
        wait(demonstrationDelay(900)),
      ]);
      if (ctx.isCancelled()) return abortedSort();

      let selectedItemId: string | null = null;
      let interactionLocked = false;
      let simplifying = false;

      const selectItem = (itemId: string): void => {
        if (interactionLocked || simplifying) return;
        selectedItemId = itemId;
        for (const [id, node] of nodes) {
          node.classList.toggle("selected", id === itemId);
        }
        sfxPick();
        if (spec.speakPick) void ctx.speak(spec.speakPick(itemId), { rate: 1 });
        for (const bin of binNodes.values()) bin.classList.add("bin-ready");
      };

      const deselect = (): void => {
        selectedItemId = null;
        for (const node of nodes.values()) node.classList.remove("selected");
        for (const bin of binNodes.values()) bin.classList.remove("bin-ready");
      };

      return await new Promise<PlayResult>((resolve) => {
        let settled = false;
        let operationGeneration = 0;
        let cancelWatch: number | null = null;
        const active = (generation: number) =>
          generation === operationGeneration && !settled && !ctx.isCancelled();
        const finish = (result: PlayResult) => {
          if (settled) return;
          settled = true;
          interactionLocked = true;
          operationGeneration += 1;
          if (cancelWatch !== null) window.clearInterval(cancelWatch);
          resolve(result);
        };

        const placeInto = async (
          itemId: string,
          binValue: string,
          silent = false,
        ): Promise<void> => {
          const node = nodes.get(itemId);
          const bin = binNodes.get(binValue);
          if (!node || !bin) return;
          if (!silent) sfxPlace();
          const visual = itemVisuals.find((item) => item.id === itemId);
          if (visual?.speakOnPlace && !silent) {
            void speakWithCue(
              ctx,
              visual.speakOnPlaceCueId,
              visual.speakOnPlace,
              { rate: 1 },
            );
          }
          node.classList.add("placed");
          const mini = el("div", { className: "bin-item" });
          if (visual) {
            const art = svgEl(visual.svg);
            art.style.width = "100%";
            art.style.height = "100%";
            mini.append(art);
          }
          bin.append(mini);
          deselect();
          await wait(isMotionReduced() ? 100 : 260);
        };

        const autoCompleteRemaining = async (): Promise<void> => {
          if (simplifying || settled) return;
          simplifying = true;
          interactionLocked = true;
          const generation = ++operationGeneration;
          await speakWithCue(
            ctx,
            spec.helpCueId,
            spec.helpSpeech ?? "Hai să le punem împreună! Uite așa!",
          );
          if (!active(generation)) return;
          const remaining = level.payload.itemIds.filter(
            (id) => state.placedBinByItemId[id] === undefined,
          );
          for (const itemId of remaining) {
            if (!active(generation)) return;
            const correctBin = level.payload.correctBinByItemId[itemId];
            if (!correctBin) continue;
            const bin = binNodes.get(correctBin);
            if (bin) showHintGlow(bin);
            state = reduceSort(state, {
              type: "place",
              itemId,
              binId: correctBin,
            });
            await placeInto(itemId, correctBin, true);
            if (!active(generation)) return;
            await wait(420);
          }
          if (!active(generation)) return;
          finish({
            completed: true,
            correctFirstTry: false,
            correctEventually: true,
            hintsUsed: support.hintsUsed + 1,
            wrongAttempts: support.wrongAttempts,
          });
        };

        const tryPlace = (
          itemId: string,
          binValue: string,
          bin: HTMLElement,
        ): void => {
          if (
            interactionLocked ||
            simplifying ||
            settled ||
            state.placedBinByItemId[itemId] !== undefined
          ) {
            return;
          }
          interactionLocked = true;
          const before = state;
          state = reduceSort(state, {
            type: "place",
            itemId,
            binId: binValue,
          });
          if (state === before) {
            interactionLocked = false;
            return;
          }

          if (state.lastIncorrectItemId === itemId) {
            const verdict = support.registerError(bin);
            deselect();
            if (verdict === "hint") {
              const correctBinValue =
                level.payload.correctBinByItemId[itemId];
              const correctBinNode = correctBinValue
                ? binNodes.get(correctBinValue)
                : undefined;
              if (correctBinNode) {
                showHintGlow(correctBinNode);
                jelly(correctBinNode);
              }
              const generation = ++operationGeneration;
              void speakWithCue(
                ctx,
                spec.hintCueId,
                spec.hintSpeech ?? "Uite, aici e locul lui!",
              ).then(() => {
                if (active(generation)) {
                  interactionLocked = false;
                  selectItem(itemId);
                }
              });
            } else if (verdict === "simplify") {
              interactionLocked = false;
              void autoCompleteRemaining();
            } else {
              interactionLocked = false;
            }
            return;
          }

          support.registerSuccess();
          playItemVoice(itemId);
          const shellRect = ctx.shell.getBoundingClientRect();
          const binRect = bin.getBoundingClientRect();
          particlesAt(
            ctx.shell,
            binRect.left - shellRect.left + binRect.width / 2,
            binRect.top - shellRect.top + binRect.height * 0.3,
          );
          const generation = ++operationGeneration;
          void placeInto(itemId, binValue).then(() => {
            if (!active(generation)) return;
            if (state.completed) {
              finish({
                completed: true,
                correctFirstTry: support.wasFirstTryClean,
                correctEventually: true,
                hintsUsed: support.hintsUsed,
                wrongAttempts: support.wrongAttempts,
              });
            } else {
              interactionLocked = false;
            }
          });
        };

        for (const [itemId, node] of nodes) {
          node.addEventListener("click", () => {
            if (
              interactionLocked ||
              simplifying ||
              settled ||
              state.placedBinByItemId[itemId] !== undefined
            ) {
              return;
            }
            if (selectedItemId === itemId) deselect();
            else selectItem(itemId);
          });
          makeDraggable(node, {
            data: itemId,
            canDrag: () =>
              !interactionLocked &&
              !simplifying &&
              !settled &&
              state.placedBinByItemId[itemId] === undefined,
            targets: () =>
              [...binNodes.entries()].map(([data, binNode]) => ({
                node: binNode,
                data,
              })),
            onDrop: (target) => {
              deselect();
              tryPlace(itemId, target.data, target.node);
            },
          });
        }
        for (const [binValue, bin] of binNodes) {
          bin.addEventListener("click", () => {
            if (
              interactionLocked ||
              simplifying ||
              settled ||
              selectedItemId === null
            ) {
              return;
            }
            tryPlace(selectedItemId, binValue, bin);
          });
        }

        cancelWatch = window.setInterval(() => {
          if (!ctx.isCancelled()) return;
          finish({
            completed: state.completed,
            correctFirstTry: false,
            correctEventually: state.completed,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
            abandoned: !state.completed,
          });
        }, 250);
      });
    },
  };
}

async function playPixiSortRound(
  ctx: GameContext,
  spec: SortGameSpec,
  level: {
    readonly bins: readonly string[];
    readonly itemIds: readonly string[];
    readonly correctBinByItemId: Readonly<Record<string, string>>;
  },
): Promise<PlayResult> {
  clear(ctx.mount);
  const { createPixiDragScene } = await import("../runtime/pixiDragScene");
  const support = new SupportTracker();
  let state = initializeSort(level.correctBinByItemId);
  let settled = false;
  let inputReady = false;
  let cancelWatch: number | null = null;
  let resolveResult: (result: PlayResult) => void = () => undefined;
  let simplifying = false;
  let activeScene: PixiDragScene | null = null;
  let activeBatchIndex = 0;
  let sceneToken = 0;
  let operationGeneration = 0;
  const batchSize = window.innerWidth < 600 ? 3 : 4;
  const batches: readonly (readonly string[])[] = Array.from(
    { length: Math.ceil(level.itemIds.length / batchSize) },
    (_, index) =>
      level.itemIds.slice(index * batchSize, (index + 1) * batchSize),
  );
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
    sceneToken += 1;
    if (cancelWatch !== null) window.clearInterval(cancelWatch);
    resolveResult(outcome);
  };

  const itemVisuals = new Map(
    level.itemIds.map((itemId) => {
      const visual = spec.itemVisual(itemId);
      return [itemId, visual] as const;
    }),
  );
  const targets = level.bins.map((binId, index) => {
    const visual = spec.binVisual(binId, index);
    return {
      id: binId,
      label: visual.label,
      color: visual.hex,
      ...(visual.badge ? { svg: visual.badge } : {}),
    };
  });

  async function showBatch(
    batchIndex: number,
    interactive: boolean,
  ): Promise<PixiDragScene | null> {
    const batch = batches[batchIndex];
    if (!batch || settled || ctx.isCancelled()) return null;
    inputReady = false;
    activeScene?.destroy();
    activeScene = null;
    const token = ++sceneToken;
    let scene!: PixiDragScene;
    scene = await createPixiDragScene(ctx.mount, {
      items: batch.map((itemId) => {
        const visual = itemVisuals.get(itemId);
        return {
          id: itemId,
          svg: visual?.svg ?? spec.icon(),
          label: visual?.speakOnPlace ?? itemId,
        };
      }),
      targets,
      presentation: "bins",
      reducedMotion: ctx.reducedMotion,
      onDrop(itemId, binId) {
        if (!inputReady || settled || simplifying) return "ignore";
        inputReady = false;
        const before = state;
        state = reduceSort(state, { type: "place", itemId, binId });
        if (state === before) {
          inputReady = true;
          return "ignore";
        }

        if (state.lastIncorrectItemId === itemId) {
          const verdict = support.registerError();
          if (verdict === "hint") {
            const correctBin = level.correctBinByItemId[itemId];
            if (correctBin) {
              window.setTimeout(() => {
                if (!settled && !ctx.isCancelled()) {
                  scene.emphasizeTarget(correctBin);
                }
              }, 180);
            }
            const generation = ++operationGeneration;
            void speakWithCue(
              ctx,
              spec.hintCueId,
              spec.hintSpeech ?? "Uite, aici e locul lui!",
            ).then(() => {
              if (active(generation) && !simplifying) inputReady = true;
            });
          } else if (verdict === "simplify") {
            simplifying = true;
            inputReady = false;
            window.setTimeout(
              () => void autoCompleteRemaining(batchIndex),
              ctx.reducedMotion ? 120 : 460,
            );
          } else {
            inputReady = true;
          }
          return "incorrect";
        }

        support.registerSuccess();
        sfxPlace();
        playItemVoice(itemId);
        const visual = itemVisuals.get(itemId);
        if (visual?.speakOnPlace) {
          void speakWithCue(
            ctx,
            visual.speakOnPlaceCueId,
            visual.speakOnPlace,
            { rate: 1 },
          );
        }
        const batchCompleted = batch.every(
          (id) => state.placedBinByItemId[id] !== undefined,
        );
        if (batchCompleted) {
          const generation = ++operationGeneration;
          void wait(ctx.reducedMotion ? 380 : 720).then(() => {
            if (!active(generation)) return;
            if (batchIndex + 1 < batches.length) {
              void showBatch(batchIndex + 1, true);
            } else {
              finish({
                completed: true,
                correctFirstTry: support.wasFirstTryClean,
                correctEventually: true,
                hintsUsed: support.hintsUsed,
                wrongAttempts: support.wrongAttempts,
              });
            }
          });
        } else {
          inputReady = true;
        }
        return "correct";
      },
    });
    if (token !== sceneToken || settled || ctx.isCancelled()) {
      scene.destroy();
      return null;
    }
    activeScene = scene;
    activeBatchIndex = batchIndex;
    inputReady = interactive && !simplifying;
    if (interactive) scene.readyElement.dataset.gameReady = "true";
    return scene;
  }

  async function autoCompleteRemaining(startBatchIndex: number): Promise<void> {
    const generation = ++operationGeneration;
    await speakWithCue(
      ctx,
      spec.helpCueId,
      spec.helpSpeech ?? "Hai să le punem împreună! Uite așa!",
    );
    if (!active(generation)) return;
    for (
      let batchIndex = startBatchIndex;
      batchIndex < batches.length;
      batchIndex += 1
    ) {
      if (!active(generation)) return;
      const scene =
        batchIndex === activeBatchIndex
          ? activeScene
          : await showBatch(batchIndex, false);
      const batch = batches[batchIndex];
      if (!scene || !batch || !active(generation)) return;
      for (const itemId of batch) {
        if (!active(generation)) return;
        if (state.placedBinByItemId[itemId] !== undefined) continue;
        const correctBin = level.correctBinByItemId[itemId];
        if (!correctBin) continue;
        scene.emphasizeTarget(correctBin);
        state = reduceSort(state, {
          type: "place",
          itemId,
          binId: correctBin,
        });
        await scene.autoPlace(itemId, correctBin);
        if (!active(generation)) return;
        await wait(ctx.reducedMotion ? 100 : 280);
      }
      if (batchIndex + 1 < batches.length) {
        await wait(ctx.reducedMotion ? 100 : 320);
      }
    }
    if (!active(generation)) return;
    finish({
      completed: true,
      correctFirstTry: false,
      correctEventually: true,
      hintsUsed: support.hintsUsed + 1,
      wrongAttempts: support.wrongAttempts,
    });
  }

  ctx.onCleanup(() => {
    operationGeneration += 1;
    sceneToken += 1;
    activeScene?.destroy();
    activeScene = null;
  });
  const initialScene = await showBatch(0, false);
  await Promise.all([
    speakWithCue(ctx, spec.instructionCueId, spec.instruction),
    wait(demonstrationDelay(900)),
  ]);
  if (ctx.isCancelled()) return abortedSort();
  inputReady = true;
  if (initialScene) initialScene.readyElement.dataset.gameReady = "true";
  cancelWatch = window.setInterval(() => {
    if (!ctx.isCancelled()) return;
    finish({
      completed: state.completed,
      correctFirstTry: false,
      correctEventually: state.completed,
      hintsUsed: support.hintsUsed,
      wrongAttempts: support.wrongAttempts,
      abandoned: !state.completed,
    });
  }, 200);
  return result;
}

function abortedSort(): PlayResult {
  return {
    completed: false,
    correctFirstTry: false,
    correctEventually: false,
    hintsUsed: 0,
    wrongAttempts: 0,
    abandoned: true,
  };
}
