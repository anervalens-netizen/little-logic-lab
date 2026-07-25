/** „Pune forma la loc" — puzzle cu forme: fiecare piesă în gaura ei. */

import { createRng, chooseDistinct, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { trayWithItems } from "./widgets";
import { el, clear, svgEl, wait } from "../ui/dom";
import { showHintGlow, particlesAt } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxPlace, sfxPick } from "../audio/sfx";
import { makeDraggable } from "../ui/dragdrop";
import { drawShape, drawShapeHole, SHAPE_LABELS, type ShapeId } from "../art/shapes";
import { LEARN_COLORS } from "../art/palette";

const EASY: readonly ShapeId[] = ["circle", "square", "triangle", "star", "heart"];
const SIMILAR_PAIRS: readonly ShapeId[][] = [
  ["circle", "oval"],
  ["square", "diamond"],
  ["star", "heart"],
];

export const insetPuzzleGame: WebGame = {
  id: "inset-puzzle",
  title: "Pune forma la loc",
  skillId: "spatial_matching",
  domain: "spatial_planning",
  instruction: "Fiecare formă are locul ei! Pune forma în gaura potrivită!",
  coPlayPrompt: "Căutați acasă capace și cutii care se potrivesc între ele!",
  icon: () => drawShape("heart", "#FF9EC6"),
  bubbleColor: "#FF9EC6",
  axes: [
    { name: "pieceCount", values: [2, 3, 4] },
    { name: "similarity", values: [0, 1] },
  ],
  initialDifficulty: { pieceCount: 2, similarity: 0 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const pieceCount = Math.max(2, Number(difficulty["pieceCount"] ?? 2));
    const similar = Number(difficulty["similarity"] ?? 0) >= 1;
    const rng = createRng(seed);

    const pool = similar && pieceCount <= 2 ? (SIMILAR_PAIRS[Math.floor(rng() * SIMILAR_PAIRS.length)] ?? EASY) : EASY;
    const shapes = chooseDistinct([...pool], Math.min(pieceCount, pool.length), rng);
    const colors = chooseDistinct([...LEARN_COLORS], shapes.length, rng);

    const support = new SupportTracker();
    clear(ctx.mount);

    const layout = el("div", {});
    layout.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:100%;height:100%;gap:8px;";

    // Panoul cu găuri.
    const board = el("div", {});
    board.style.cssText =
      "display:flex;gap:clamp(14px,3.4vw,34px);background:rgba(255,255,255,0.6);border-radius:36px;padding:22px clamp(16px,3vw,30px);box-shadow:0 6px 0 rgba(74,63,53,0.10);flex-wrap:wrap;justify-content:center;";

    const holes = new Map<ShapeId, HTMLElement>();
    shapes.forEach((shape, index) => {
      const hole = el("button", { className: "pop-in", "aria-label": `gaura ${SHAPE_LABELS[shape]}` });
      hole.style.cssText =
        "width:clamp(110px,20vmin,180px);aspect-ratio:1;background:transparent;border:none;position:relative;";
      hole.style.animationDelay = `${index * 120}ms`;
      hole.append(svgEl(drawShapeHole(shape)));
      board.append(hole);
      holes.set(shape, hole);
    });

    // Piesele (amestecate în tavă).
    const piecesOrder = chooseDistinct(shapes, shapes.length, createRng(`${seed}:pieces`));
    const { tray, nodes } = trayWithItems(
      piecesOrder.map((shape, i) => ({
        id: shape,
        svg: drawShape(shape, colors[i]?.hex ?? "#F25C4C"),
        label: SHAPE_LABELS[shape],
      })),
    );

    layout.append(board, tray);
    ctx.mount.append(layout);

    speak("Pune fiecare formă în gaura ei!");
    await wait(900);

    let selected: ShapeId | null = null;
    let placedCount = 0;

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

      const deselect = () => {
        selected = null;
        for (const n of nodes.values()) n.classList.remove("selected");
        for (const h of holes.values()) h.classList.remove("bin-ready");
      };

      const place = async (shape: ShapeId, silent = false) => {
        const piece = nodes.get(shape);
        const hole = holes.get(shape);
        if (!piece || !hole) return;
        if (!silent) {
          sfxPlace();
          speak(SHAPE_LABELS[shape], { rate: 1 });
        }
        piece.classList.add("placed");
        const art = svgEl(drawShape(shape, colors[shapes.indexOf(shape)]?.hex ?? "#F25C4C"));
        art.style.cssText = "position:absolute;inset:0;animation:pop-in 380ms backwards;";
        hole.append(art);
        deselect();
        placedCount += 1;
        if (placedCount >= shapes.length) {
          await wait(500);
          finish({
            completed: true,
            correctFirstTry: support.wasFirstTryClean,
            correctEventually: true,
            hintsUsed: support.hintsUsed,
            wrongAttempts: support.wrongAttempts,
          });
        }
      };

      const tryFit = (shape: ShapeId, holeShape: ShapeId, hole: HTMLElement): void => {
        if (settled) return;
        if (holeShape === shape) {
          support.registerSuccess();
          const shellRect = ctx.shell.getBoundingClientRect();
          const holeRect = hole.getBoundingClientRect();
          particlesAt(
            ctx.shell,
            holeRect.left - shellRect.left + holeRect.width / 2,
            holeRect.top - shellRect.top + holeRect.height / 2,
          );
          void place(holeShape);
          return;
        }
        const verdict = support.registerError(hole);
        deselect();
        if (verdict === "hint") {
          const correctHole = holes.get(shape);
          if (correctHole) showHintGlow(correctHole);
          speak("Uite, aici se potrivește!");
        } else if (verdict === "simplify") {
          speak("Hai să le punem împreună!");
          void (async () => {
            for (const s of shapes) {
              if (ctx.isCancelled()) return;
              const piece = nodes.get(s);
              if (piece && !piece.classList.contains("placed")) {
                showHintGlow(holes.get(s) ?? piece);
                await wait(500);
                await place(s, true);
                await wait(380);
              }
            }
          })();
        }
      };

      for (const [shapeId, piece] of nodes) {
        const shape = shapeId as ShapeId;
        piece.addEventListener("click", () => {
          if (settled || piece.classList.contains("placed")) return;
          if (selected === shape) {
            deselect();
            return;
          }
          selected = shape;
          sfxPick();
          for (const [s, n] of nodes) n.classList.toggle("selected", s === shape);
          for (const h of holes.values()) h.classList.add("bin-ready");
        });

        makeDraggable(piece, {
          data: shape,
          canDrag: () => !settled && !piece.classList.contains("placed"),
          targets: () => [...holes.entries()].map(([data, node]) => ({ node, data })),
          onDrop: (target) => {
            deselect();
            tryFit(shape, target.data as ShapeId, target.node);
          },
        });
      }

      for (const [holeShape, hole] of holes) {
        hole.addEventListener("click", () => {
          if (settled || selected === null) return;
          const picked = selected;
          tryFit(picked, holeShape, hole);
        });
      }
    });
  },
};
