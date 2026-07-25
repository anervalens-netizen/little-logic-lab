/** Manager de ecrane cu tranziții blânde. */

import { wait } from "../ui/dom";

export type ScreenFactory = () => HTMLElement;

const root = (): HTMLElement => {
  const node = document.getElementById("screen-root");
  if (!node) throw new Error("Missing #screen-root");
  return node;
};

let current: HTMLElement | null = null;
let transition: Promise<void> = Promise.resolve();
const cleanupByScreen = new WeakMap<HTMLElement, () => void>();

export function registerScreenCleanup(
  screen: HTMLElement,
  cleanup: () => void,
): void {
  cleanupByScreen.set(screen, cleanup);
}

export function showScreen(factory: ScreenFactory): Promise<void> {
  const operation = transition.catch(() => undefined).then(async () => {
    const next = factory();
    next.classList.add("screen");
    next.setAttribute("data-screen-ready", "false");
    const host = root();
    if (current) {
      current.classList.add("leaving");
      const old = current;
      host.append(next);
      await wait(240);
      cleanupByScreen.get(old)?.();
      cleanupByScreen.delete(old);
      old.remove();
    } else {
      host.append(next);
    }
    current = next;
    next.setAttribute("data-screen-ready", "true");
  });
  transition = operation;
  return operation;
}
