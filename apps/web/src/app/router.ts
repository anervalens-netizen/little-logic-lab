/** Manager de ecrane cu tranziții blânde. */

import { wait } from "../ui/dom";

export type ScreenFactory = () => HTMLElement;

const root = (): HTMLElement => {
  const node = document.getElementById("app");
  if (!node) throw new Error("Missing #app root");
  return node;
};

let current: HTMLElement | null = null;
let navigating = false;

export async function showScreen(factory: ScreenFactory): Promise<void> {
  if (navigating) return;
  navigating = true;
  try {
    const next = factory();
    next.classList.add("screen");
    const host = root();
    if (current) {
      current.classList.add("leaving");
      const old = current;
      host.append(next);
      await wait(240);
      old.remove();
    } else {
      host.append(next);
    }
    current = next;
  } finally {
    navigating = false;
  }
}
