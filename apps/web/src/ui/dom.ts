/** Helperi minusculi pentru construit DOM fără framework. */

import { waitForSpeechIdle } from "../audio/speech";

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

export function svgEl(markup: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup.trim();
  const svg = wrapper.firstElementChild;
  if (!(svg instanceof SVGElement)) throw new Error("Invalid SVG markup");
  const holder = document.createElement("div");
  holder.style.display = "contents";
  holder.append(svg);
  return holder;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Menține durata vizuală minimă, dar nu permite secvenței să depășească vocea
 * activă. Acoperă runtime-urile vechi care folosesc `speak(); await wait(...)`.
 */
export async function wait(ms: number): Promise<void> {
  await Promise.all([
    new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
    waitForSpeechIdle(),
  ]);
}

/** Așteaptă următorul cadru de animație. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
