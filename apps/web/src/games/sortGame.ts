/**
 * Fabrică pentru jocuri de sortare: „atinge obiectul, apoi coșul potrivit".
 * Mecanica pură: generateSortLevel + reduceSort din core.
 */

import {
  generateSortLevel,
  initializeSort,
  reduceSort,
  type ContentItem,
  type DifficultyAxisSpec,
  type DifficultyVector,
} from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { trayWithItems, coloredBin } from "./widgets";
import { el, clear, svgEl, wait } from "../ui/dom";
import { showHintGlow, isMotionReduced, particlesAt, jelly } from "../ui/feedback";
import { sfxPick, sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { makeDraggable } from "../ui/dragdrop";
import { speak } from "../audio/speech";

export interface SortItemVisual {
  readonly id: string;
  readonly svg: string;
  /** Rostit la plasare (ex. numele culorii). */
  readonly speakOnPlace?: string;
}

export interface SortGameSpec {
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
  readonly content: readonly ContentItem[];
  /** Alternativ: conținut ales deterministic din seed (ex. un singur tip de obiect). */
  readonly contentForSeed?: (seed: string) => readonly ContentItem[];
  readonly attribute: string;
  readonly binVisual: (value: string, index: number) => { hex: string; badge?: string; label: string };
  readonly itemVisual: (itemId: string) => SortItemVisual;
  /** Rostit când copilul selectează un obiect (opțional). */
  readonly speakPick?: (itemId: string) => string;
}

export function createSortGame(spec: SortGameSpec): WebGame {
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

    async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
      const binCount = Number(difficulty["binCount"] ?? 2);
      const itemCount = Number(difficulty["itemCount"] ?? 2);

      const content = spec.contentForSeed ? spec.contentForSeed(seed) : spec.content;

      // Generează până când fiecare coș primește cel puțin un obiect (determinist).
      let level = generateSortLevel(seed, {
        gameId: spec.id,
        items: content,
        attribute: spec.attribute,
        binCount: Math.max(2, binCount),
        itemCount: Math.max(2, itemCount),
      });
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const covered = new Set(Object.values(level.payload.correctBinByItemId));
        if (level.payload.bins.every((bin) => covered.has(bin))) break;
        level = generateSortLevel(`${seed}#cover${attempt}`, {
          gameId: spec.id,
          items: content,
          attribute: spec.attribute,
          binCount: Math.max(2, binCount),
          itemCount: Math.max(2, itemCount),
        });
      }

      let state = initializeSort(level.payload.correctBinByItemId);
      const support = new SupportTracker();

      clear(ctx.mount);
      const layout = el("div", {});
      layout.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:100%;height:100%;gap:6px;";

      const itemVisuals = level.payload.itemIds.map((id) => spec.itemVisual(id));
      const { tray, nodes } = trayWithItems(
        itemVisuals.map((v) => ({ id: v.id, svg: v.svg, label: v.speakOnPlace ?? v.id })),
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

      speak(spec.instruction);
      await wait(900);

      let selectedItemId: string | null = null;

      const selectItem = (itemId: string): void => {
        selectedItemId = itemId;
        for (const [id, node] of nodes) {
          node.classList.toggle("selected", id === itemId);
        }
        sfxPick();
        if (spec.speakPick) speak(spec.speakPick(itemId), { rate: 1 });
        for (const bin of binNodes.values()) bin.classList.add("bin-ready");
      };

      const deselect = (): void => {
        selectedItemId = null;
        for (const node of nodes.values()) node.classList.remove("selected");
        for (const bin of binNodes.values()) bin.classList.remove("bin-ready");
      };

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
            finish({
              completed: state.completed,
              correctFirstTry: false,
              correctEventually: state.completed,
              hintsUsed: support.hintsUsed,
              wrongAttempts: support.wrongAttempts,
              abandoned: !state.completed,
            });
          }
        }, 250);

        const placeInto = async (itemId: string, binValue: string, silent = false): Promise<void> => {
          const node = nodes.get(itemId);
          const bin = binNodes.get(binValue);
          if (!node || !bin) return;
          if (!silent) sfxPlace();
          const speakText = itemVisuals.find((v) => v.id === itemId)?.speakOnPlace;
          if (speakText && !silent) speak(speakText, { rate: 1 });
          node.classList.add("placed");
          const mini = el("div", { className: "bin-item" });
          const visual = itemVisuals.find((v) => v.id === itemId);
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
          const remaining = level.payload.itemIds.filter(
            (id) => state.placedBinByItemId[id] === undefined,
          );
          speak("Hai să le punem împreună! Uite așa!");
          for (const itemId of remaining) {
            if (ctx.isCancelled()) break;
            const correctBin = level.payload.correctBinByItemId[itemId];
            if (!correctBin) continue;
            const bin = binNodes.get(correctBin);
            if (bin) showHintGlow(bin);
            state = reduceSort(state, { type: "place", itemId, binId: correctBin });
            await placeInto(itemId, correctBin, true);
            await wait(420);
          }
          finish({
            completed: true,
            correctFirstTry: false,
            correctEventually: true,
            hintsUsed: support.hintsUsed + 1,
            wrongAttempts: support.wrongAttempts,
          });
        };

        /** Logica comună de plasare (click pe coș SAU drop din drag). */
        const tryPlace = (itemId: string, binValue: string, bin: HTMLElement): void => {
          if (settled || state.placedBinByItemId[itemId] !== undefined) return;
          const before = state;
          state = reduceSort(state, { type: "place", itemId, binId: binValue });
          if (state === before) return;

          if (state.lastIncorrectItemId === itemId) {
            const verdict = support.registerError(bin);
            deselect();
            if (verdict === "hint") {
              const correctBinValue = level.payload.correctBinByItemId[itemId];
              const correctBinNode = correctBinValue ? binNodes.get(correctBinValue) : undefined;
              if (correctBinNode) {
                showHintGlow(correctBinNode);
                jelly(correctBinNode);
              }
              speak("Uite, aici e locul lui!");
              selectItem(itemId);
            } else if (verdict === "simplify") {
              void autoCompleteRemaining();
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
          void placeInto(itemId, binValue).then(() => {
            if (state.completed) {
              finish({
                completed: true,
                correctFirstTry: support.wasFirstTryClean,
                correctEventually: true,
                hintsUsed: support.hintsUsed,
                wrongAttempts: support.wrongAttempts,
              });
            }
          });
        };

        // Selectare obiect din tavă (tap rămâne disponibil).
        for (const [itemId, node] of nodes) {
          node.addEventListener("click", () => {
            if (settled || state.placedBinByItemId[itemId] !== undefined) return;
            if (selectedItemId === itemId) {
              deselect();
              return;
            }
            selectItem(itemId);
          });

          // Tragere cu degetul către coș.
          makeDraggable(node, {
            data: itemId,
            canDrag: () => !settled && state.placedBinByItemId[itemId] === undefined,
            targets: () =>
              [...binNodes.entries()].map(([data, binNode]) => ({ node: binNode, data })),
            onDrop: (target) => {
              deselect();
              tryPlace(itemId, target.data, target.node);
            },
          });
        }

        // Atingere coș.
        for (const [binValue, bin] of binNodes) {
          bin.addEventListener("click", () => {
            if (settled || selectedItemId === null) return;
            const itemId = selectedItemId;
            tryPlace(itemId, binValue, bin);
          });
        }
      });
    },
  };
}
