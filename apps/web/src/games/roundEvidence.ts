export interface RoundEvidenceSnapshot {
  readonly responseMs?: number;
  readonly interactionCount: number;
}

/**
 * Măsoară local latența dintre activarea reală a inputului și prima acțiune.
 * Nu persistă coordonate și nu transmite nimic în afara dispozitivului.
 */
export function observeRoundEvidence(
  mount: HTMLElement,
): {
  readonly snapshot: () => RoundEvidenceSnapshot;
  readonly destroy: () => void;
} {
  let readyAt: number | null = null;
  let responseMs: number | undefined;
  let interactionCount = 0;
  let destroyed = false;

  const markReady = () => {
    if (readyAt !== null || destroyed) return;
    if (mount.matches('[data-game-ready="true"]') || mount.querySelector('[data-game-ready="true"]')) {
      readyAt = performance.now();
    }
  };

  const recordInteraction = (event: Event) => {
    if (destroyed) return;
    markReady();
    if (readyAt === null) return;
    if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") {
      return;
    }
    interactionCount += 1;
    if (responseMs === undefined) {
      responseMs = Math.max(0, Math.round(performance.now() - readyAt));
    }
  };

  const observer = new MutationObserver(markReady);
  observer.observe(mount, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-game-ready"],
  });
  mount.addEventListener("pointerdown", recordInteraction, true);
  mount.addEventListener("keydown", recordInteraction, true);
  markReady();

  return {
    snapshot: () => ({
      ...(responseMs === undefined ? {} : { responseMs }),
      interactionCount,
    }),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      mount.removeEventListener("pointerdown", recordInteraction, true);
      mount.removeEventListener("keydown", recordInteraction, true);
    },
  };
}
