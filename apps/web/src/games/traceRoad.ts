/** „Urmează drumul" — găsește calea până la casă, piatră cu piatră. */

import { generateGentleMaze, initializeMaze, reduceMaze, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { el, clear, svgEl, wait } from "../ui/dom";
import { isMotionReduced, danceItem } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxTap } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { drawItem } from "../art/items";
import { svg } from "../art/svg";

const STONE = svg(`<ellipse cx="60" cy="66" rx="42" ry="30" fill="#E8E2D6" stroke="#C9C2B4" stroke-width="4"/>
  <ellipse cx="48" cy="58" rx="14" ry="8" fill="#F2EDE3"/>`);

const GRASS = svg(`<ellipse cx="60" cy="64" rx="44" ry="32" fill="#9BD887"/>
  <circle cx="38" cy="52" r="5" fill="#FF9EC6"/><circle cx="82" cy="70" r="5" fill="#FFD35C"/>`);

const HOPPA_WALKER = "rabbit";

export const traceRoadGame: WebGame = {
  id: "trace-road",
  title: "Urmează drumul",
  skillId: "route_planning",
  domain: "spatial_planning",
  instruction: "Ajută iepurașul să ajungă acasă! Atinge pietrele, una câte una!",
  coPlayPrompt: "Faceți un drum din perne pe jos și mergeți pe el până la „casă”!",
  icon: () => drawItem("house"),
  bubbleColor: "#7FC86B",
  axes: [{ name: "gridSize", values: [2, 3] }],
  initialDifficulty: { gridSize: 2 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const gridSize = Number(difficulty["gridSize"] ?? 2);
    const level = generateGentleMaze(seed, { gameId: "trace-road", gridSize });
    let state = initializeMaze(level.payload.safePath);

    clear(ctx.mount);

    const board = el("div", {});
    const cell = "clamp(86px, 16vmin, 140px)";
    board.style.cssText = `display:grid;grid-template-columns:repeat(${gridSize}, ${cell});grid-auto-rows:${cell};gap:clamp(8px,1.6vmin,16px);align-content:center;justify-content:center;`;

    const walker = el("div", {});
    walker.style.cssText =
      "position:absolute;width:62%;left:19%;top:14%;z-index:3;transition:transform 380ms cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;";
    walker.append(svgEl(drawItem(HOPPA_WALKER)));

    const cellNodes: HTMLElement[][] = [];
    for (let row = 0; row < gridSize; row += 1) {
      const rowNodes: HTMLElement[] = [];
      for (let col = 0; col < gridSize; col += 1) {
        const onPath = level.payload.safePath.some((p) => p.row === row && p.column === col);
        const isStart = row === 0 && col === 0;
        const isGoal = row === gridSize - 1 && col === gridSize - 1;
        const cellNode = el("button", { className: "pop-in", "aria-label": `căsuța ${row + 1}-${col + 1}` });
        cellNode.style.cssText =
          "position:relative;background:transparent;border:none;padding:0;transition:transform 160ms ease;";
        cellNode.style.animationDelay = `${(row * gridSize + col) * 70}ms`;
        cellNode.append(svgEl(isGoal ? drawItem("house") : onPath ? STONE : GRASS));
        if (isGoal) cellNode.style.transform = "scale(1.06)";
        board.append(cellNode);
        rowNodes.push(cellNode);
        if (isStart) {
          cellNode.append(walker);
        }
      }
      cellNodes.push(rowNodes);
    }

    const holder = el("div", {});
    holder.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;";
    holder.append(board);
    ctx.mount.append(holder);

    speak("Atinge pietrele și du iepurașul acasă!");
    await wait(1000);

    let wrongAttempts = 0;
    let hintsUsed = 0;

    const pulseNext = () => {
      const next = level.payload.safePath[state.pathIndex + 1];
      if (!next) return;
      const node = cellNodes[next.row]?.[next.column];
      if (node) node.classList.add("hint-glow");
    };
    pulseNext();

    return await new Promise<PlayResult>((resolve) => {
      let settled = false;
      const finish = (result: PlayResult) => {
        if (settled) return;
        settled = true;
        for (const row of cellNodes) for (const n of row) n.classList.remove("hint-glow");
        resolve(result);
      };

      const cancelWatch = setInterval(() => {
        if (ctx.isCancelled()) {
          clearInterval(cancelWatch);
          finish({ completed: false, correctFirstTry: false, correctEventually: false, hintsUsed, wrongAttempts, abandoned: true });
        }
      }, 250);

      cellNodes.forEach((rowNodes, row) => {
        rowNodes.forEach((node, col) => {
          node.addEventListener("click", () => {
            if (settled) return;
            const before = state;
            state = reduceMaze(state, { type: "move_to", point: { row, column: col } });

            if (state === before || state.wrongAttempts > before.wrongAttempts) {
              wrongAttempts += 1;
              node.style.transform = "scale(0.9)";
              setTimeout(() => (node.style.transform = ""), 240);
              if (wrongAttempts === 2 || wrongAttempts === 4) {
                hintsUsed += 1;
                speak("Uite, piatra care luminează!");
              }
              return;
            }

            sfxTap();
            for (const r of cellNodes) for (const n of r) n.classList.remove("hint-glow");
            node.append(walker);
            if (!isMotionReduced()) {
              walker.classList.remove("lll-hop");
              void walker.offsetWidth;
              walker.classList.add("lll-hop");
              setTimeout(() => walker.classList.remove("lll-hop"), 650);
            }

            if (state.completed) {
              speak("Acasă! Bravo!");
              danceItem(walker);
              playItemVoice(HOPPA_WALKER);
              setTimeout(
                () =>
                  finish({
                    completed: true,
                    correctFirstTry: wrongAttempts === 0 && hintsUsed === 0,
                    correctEventually: true,
                    hintsUsed,
                    wrongAttempts,
                  }),
                900,
              );
              return;
            }
            pulseNext();
          });
        });
      });
    });
  },
};
