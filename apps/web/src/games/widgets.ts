/** Widget-uri comune: rând de cartonașe, scenă cu țintă, tavă + coșuri. */

import { el, svgEl, wait } from "../ui/dom";
import { sfxPop, sfxPopPitch } from "../audio/sfx";
import { jelly } from "../ui/feedback";

export interface ChoiceCard {
  readonly id: string;
  readonly card: HTMLElement;
}

let blinkSeed = 0;

function livenArt(art: HTMLElement, index: number): void {
  art.classList.add("lll-float");
  art.style.setProperty("--float-delay", `${(index * 0.4).toFixed(2)}s`);
}

function livenCard(card: HTMLElement, index: number): void {
  blinkSeed = (blinkSeed + 37) % 400;
  card.style.setProperty("--blink-delay", `${(blinkSeed / 100).toFixed(2)}s`);
  card.addEventListener("pointerdown", () => {
    jelly(card);
    sfxPopPitch();
  });
  card.style.animationDelay = `${index * 130}ms`;
}

/** Rând de cartonașe mari cu apariție etapizată; vii: plutesc, clipesc, gelatină. */
export function choiceRow(
  options: readonly { id: string; svg: string; label?: string }[],
  opts: { staggerMs?: number } = {},
): { row: HTMLElement; cards: ReadonlyMap<string, HTMLElement> } {
  const row = el("div", { className: "choice-row" });
  const cards = new Map<string, HTMLElement>();
  options.forEach((option, index) => {
    const card = el("button", { className: "choice-card pop-in", "aria-label": option.label ?? option.id });
    const art = svgEl(option.svg);
    art.style.width = "100%";
    art.style.height = "100%";
    card.append(art);
    livenArt(art, index);
    livenCard(card, index);
    card.style.animationDelay = `${index * (opts.staggerMs ?? 130)}ms`;
    row.append(card);
    cards.set(option.id, card);
  });
  return { row, cards };
}

/** Card țintă de sus (modelul de potrivit). */
export function targetStage(svgMarkup: string, label: string): HTMLElement {
  const stage = el("div", { className: "target-stage" });
  const card = el("div", { className: "target-card" });
  const art = svgEl(svgMarkup);
  art.style.width = "100%";
  art.style.height = "100%";
  art.classList.add("lll-float");
  card.append(art);
  stage.append(card, el("div", { className: "stage-label fade-text" }, label));
  return stage;
}

/** Tavă cu itemi + coșuri; logica de atingere rămâne la joc. */
export function trayWithItems(
  items: readonly { id: string; svg: string; label?: string }[],
): { tray: HTMLElement; nodes: ReadonlyMap<string, HTMLElement> } {
  const tray = el("div", { className: "tray" });
  const nodes = new Map<string, HTMLElement>();
  items.forEach((item, index) => {
    const node = el("button", { className: "tray-item", "aria-label": item.label ?? item.id });
    node.style.animationDelay = `${index * 110}ms`;
    const art = svgEl(item.svg);
    art.style.width = "100%";
    art.style.height = "100%";
    livenArt(art, index);
    node.append(art);
    blinkSeed = (blinkSeed + 53) % 400;
    node.style.setProperty("--blink-delay", `${(blinkSeed / 100).toFixed(2)}s`);
    node.addEventListener("pointerdown", () => sfxPopPitch());
    tray.append(node);
    nodes.set(item.id, node);
  });
  return { tray, nodes };
}

/** Coș colorat cu o etichetă vizuală (fără text obligatoriu). */
export function coloredBin(id: string, hex: string, iconSvg?: string): HTMLElement {
  const bin = el("button", { className: "sort-bin", "aria-label": id });
  bin.style.background = `linear-gradient(180deg, ${hex}33 0%, ${hex} 30%)`;
  if (iconSvg) {
    const badge = el("div", {});
    badge.style.cssText =
      "position:absolute;top:-42px;left:50%;transform:translateX(-50%);width:78px;height:78px;background:#FFFDF7;border-radius:24px;box-shadow:0 4px 0 rgba(74,63,53,0.12);padding:9px;border:3px solid rgba(74,63,53,0.07);";
    const art = svgEl(iconSvg);
    art.style.width = "100%";
    art.style.height = "100%";
    badge.append(art);
    bin.append(badge);
  }
  return bin;
}

export async function staggerPop(container: HTMLElement): Promise<void> {
  sfxPop();
  await wait(120);
}
