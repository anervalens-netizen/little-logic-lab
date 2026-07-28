/** Manager de ecrane cu tranziții blânde și cleanup izolat. */

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

function releaseScreen(screen: HTMLElement): void {
  try {
    cleanupByScreen.get(screen)?.();
  } catch (reason) {
    document.documentElement.dataset.screenCleanupState = "failed";
    console.error("Screen cleanup failed", reason);
  } finally {
    cleanupByScreen.delete(screen);
    screen.remove();
  }
}

export function showScreen(factory: ScreenFactory): Promise<void> {
  const operation = transition.catch(() => undefined).then(async () => {
    // Factory-ul rulează înainte să modificăm ecranul curent. Dacă eșuează,
    // experiența existentă rămâne utilizabilă.
    const next = factory();
    next.classList.add("screen");
    next.setAttribute("data-screen-ready", "false");
    const host = root();
    const old = current;

    if (old) {
      old.classList.add("leaving");
      host.append(next);
      try {
        await wait(240);
      } finally {
        releaseScreen(old);
      }
    } else {
      host.append(next);
    }

    current = next;
    next.setAttribute("data-screen-ready", "true");
    document.documentElement.dataset.screenCleanupState = "healthy";
  });
  transition = operation;
  return operation;
}
