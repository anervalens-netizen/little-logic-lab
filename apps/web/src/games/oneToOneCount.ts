/** „Dă câte unul" — corespondență unu-la-unu: fiecare personaj primește exact unul. */

import { createRng, chooseOne, type DifficultyVector } from "@core";
import type { GameContext, PlayResult, WebGame } from "./types";
import { SupportTracker } from "./support";
import { el, clear, svgEl, wait } from "../ui/dom";
import { showHintGlow, jelly, particlesAt } from "../ui/feedback";
import { speak } from "../audio/speech";
import { sfxPlace } from "../audio/sfx";
import { playItemVoice } from "../audio/voices";
import { makeDraggable } from "../ui/dragdrop";
import { drawItem } from "../art/items";

const RECEIVERS = ["bear", "rabbit", "cat", "dog", "pig", "frog"] as const;
const TREATS = ["cookie", "apple", "strawberry", "cupcake", "carrot", "banana"] as const;
const COUNT_WORDS = ["unu", "doi", "trei", "patru"];

export const oneToOneCountGame: WebGame = {
  id: "one-to-one-count",
  title: "Dă câte unul",
  skillId: "one_to_one_correspondence",
  domain: "numeracy",
  instruction: "Dă fiecărui prieten câte unul! Unul pentru fiecare!",
  coPlayPrompt: "La masă: dă fiecăruia câte o linguriță sau câte un șervețel!",
  icon: () => drawItem("cookie"),
  bubbleColor: "#FFA94D",
  axes: [{ name: "maxQuantity", values: [1, 2, 3] }],
  initialDifficulty: { maxQuantity: 2 },
  scored: true,

  async play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult> {
    const maxQuantity = Number(difficulty["maxQuantity"] ?? 2);
    const count = Math.max(1, Math.min(4, maxQuantity));
    const rng = createRng(seed);
    const receiver = chooseOne([...RECEIVERS], rng);
    const treat = chooseOne([...TREATS], rng);
    const treatItem = drawItem(treat);

    const support = new SupportTracker();
    clear(ctx.mount);

    const layout = el("div", {});
    layout.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:100%;height:100%;gap:8px;";

    const receiversRow = el("div", {});
    receiversRow.style.cssText =
      "display:flex;gap:clamp(16px,4vw,40px);align-items:flex-end;justify-content:center;flex:1;";

    const receivers: { node: HTMLElement; served: boolean }[] = [];
    for (let i = 0; i < count; i += 1) {
      const wrap = el("button", { className: "pop-in", "aria-label": `prietenul ${i + 1}` });
      wrap.style.cssText =
        "position:relative;width:clamp(120px,22vmin,200px);background:rgba(255,255,255,0.55);border-radius:32px;padding:12px;border:4px dashed rgba(74,63,53,0.12);transition:transform 160ms ease;";
      wrap.style.animationDelay = `${i * 130}ms`;
      wrap.append(svgEl(drawItem(receiver)));
      receiversRow.append(wrap);
      receivers.push({ node: wrap, served: false });
    }

    const tray = el("div", { className: "tray" });
    const treatNodes: HTMLElement[] = [];
    for (let i = 0; i < count; i += 1) {
      const node = el("button", { className: "tray-item", "aria-label": `răsfăț ${i + 1}` });
      node.style.animationDelay = `${i * 110}ms`;
      node.append(svgEl(treatItem));
      tray.append(node);
      treatNodes.push(node);
    }

    layout.append(receiversRow, tray);
    ctx.mount.append(layout);

    speak(`Avem ${COUNT_WORDS[count - 1] ?? count} prieteni! Dă fiecăruia câte unul!`);
    await wait(1200);

    let selectedTreat: HTMLElement | null = null;
    let servedCount = 0;
    let countedAloud = 0;

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
        selectedTreat = null;
        for (const t of treatNodes) t.classList.remove("selected");
        for (const r of receivers) r.node.style.transform = "";
      };

      const serve = async (receiverEntry: { node: HTMLElement; served: boolean }, treatNode: HTMLElement | null) => {
        if (!treatNode) return;
        sfxPlace();
        playItemVoice(treat);
        countedAloud += 1;
        speak(`${COUNT_WORDS[countedAloud - 1] ?? countedAloud}!`, { rate: 0.95 });
        treatNode.classList.add("placed");
        receiverEntry.served = true;
        jelly(receiverEntry.node);
        receiverEntry.node.classList.add("lll-hop");
        setTimeout(() => receiverEntry.node.classList.remove("lll-hop"), 700);
        const shellRect = ctx.shell.getBoundingClientRect();
        const rRect = receiverEntry.node.getBoundingClientRect();
        particlesAt(ctx.shell, rRect.left - shellRect.left + rRect.width / 2, rRect.top - shellRect.top + 20, { hearts: true, count: 5 });
        const mini = el("div", {});
        mini.style.cssText =
          "position:absolute;bottom:-6px;right:-6px;width:44%;animation:pop-in 400ms backwards;";
        mini.append(svgEl(treatItem));
        receiverEntry.node.append(mini);
        receiverEntry.node.style.border = "4px solid rgba(127,200,107,0.6)";
        deselect();
        servedCount += 1;
        if (servedCount >= count) {
          await wait(700);
          speak("Fiecare are câte unul! Bravo!");
          setTimeout(
            () =>
              finish({
                completed: true,
                correctFirstTry: support.wasFirstTryClean,
                correctEventually: true,
                hintsUsed: support.hintsUsed,
                wrongAttempts: support.wrongAttempts,
              }),
            1200,
          );
        }
      };

      const offerTo = (receiverEntry: { node: HTMLElement; served: boolean }, treatNode: HTMLElement): void => {
        if (settled) return;
        if (receiverEntry.served) {
          const verdict = support.registerError(receiverEntry.node);
          speak("Are deja unul! Dă altui prieten!", { rate: 1 });
          if (verdict === "hint") {
            const next = receivers.find((r) => !r.served);
            if (next) showHintGlow(next.node);
          } else if (verdict === "simplify") {
            const next = receivers.find((r) => !r.served);
            if (next) {
              showHintGlow(next.node);
              speak("Uite, lui îi dăm!");
            }
          }
          return;
        }
        support.registerSuccess();
        void serve(receiverEntry, treatNode);
      };

      for (const treatNode of treatNodes) {
        treatNode.addEventListener("click", () => {
          if (settled) return;
          if (selectedTreat === treatNode) {
            deselect();
            return;
          }
          selectedTreat = treatNode;
          for (const t of treatNodes) t.classList.toggle("selected", t === treatNode);
          for (const r of receivers) {
            r.node.style.transform = r.served ? "" : "scale(1.05)";
          }
        });

        makeDraggable(treatNode, {
          data: "treat",
          canDrag: () => !settled && !treatNode.classList.contains("placed"),
          targets: () => receivers.filter((r) => !r.served).map((r) => ({ node: r.node, data: "friend" })),
          onDrop: (target) => {
            const entry = receivers.find((r) => r.node === target.node);
            if (entry) offerTo(entry, treatNode);
          },
        });
      }

      for (const receiverEntry of receivers) {
        receiverEntry.node.addEventListener("click", () => {
          if (settled || !selectedTreat) return;
          offerTo(receiverEntry, selectedTreat);
        });
      }
    });
  },
};
