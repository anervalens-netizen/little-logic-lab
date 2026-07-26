/**
 * Poarta pentru adulți: ține apăsat 3 secunde.
 * Suficient pentru un copil de 3 ani, rapid pentru un părinte.
 */

import { el } from "./dom";

export function openParentGate(
  onPassed: () => void,
  onCancel?: () => void,
): HTMLElement {
  const previouslyFocused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const backdrop = el("div", {
    className: "gate-backdrop",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "parent-gate-title",
    "aria-describedby": "parent-gate-hint",
  });
  const card = el("div", { className: "gate-card" });
  const title = el("h2", { id: "parent-gate-title" }, "Zonă pentru adulți");
  title.style.fontSize = "26px";
  const hint = el(
    "p",
    { id: "parent-gate-hint" },
    "Ține apăsat butonul 3 secunde.",
  );
  hint.style.cssText = "color:#7A6C5D;font-size:18px;margin-top:6px;";

  const fill = el("div", { className: "fill" });
  const label = el("span", {}, "Ține apăsat");
  const hold = el(
    "button",
    { className: "gate-hold", "aria-label": "Ține apăsat 3 secunde" },
    fill,
    label,
  );

  const cancelButton = el(
    "button",
    {
      className: "btn-big",
      style:
        "font-size:20px;min-height:64px;padding:10px 30px;margin-top:14px;",
    },
    "Înapoi",
  );

  card.append(title, hint, hold, cancelButton);
  backdrop.append(card);

  let timer: number | null = null;
  let startTime = 0;
  let raf = 0;
  let keyboardHolding = false;
  const HOLD_MS = 3000;

  const siblingStates: Array<{
    element: HTMLElement;
    inert: boolean;
    ariaHidden: string | null;
  }> = [];

  const cleanup = (restoreFocus: boolean) => {
    if (timer !== null) clearTimeout(timer);
    cancelAnimationFrame(raf);
    for (const { element, inert, ariaHidden } of siblingStates) {
      element.inert = inert;
      if (ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", ariaHidden);
    }
    backdrop.remove();
    if (restoreFocus && previouslyFocused?.isConnected) {
      previouslyFocused.focus();
    }
  };

  const tick = () => {
    const progress = Math.min(1, (performance.now() - startTime) / HOLD_MS);
    fill.style.transform = `scaleY(${progress})`;
    if (progress < 1) raf = requestAnimationFrame(tick);
  };

  const begin = (event: Event) => {
    event.preventDefault();
    if (timer !== null) return;
    startTime = performance.now();
    raf = requestAnimationFrame(tick);
    timer = window.setTimeout(() => {
      timer = null;
      cleanup(false);
      onPassed();
    }, HOLD_MS);
  };

  const stop = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    cancelAnimationFrame(raf);
    fill.style.transform = "scaleY(0)";
  };

  const closeGate = () => {
    cleanup(true);
    onCancel?.();
  };

  hold.addEventListener("pointerdown", begin);
  hold.addEventListener("pointerup", stop);
  hold.addEventListener("pointerleave", stop);
  hold.addEventListener("pointercancel", stop);
  hold.addEventListener("keydown", (event) => {
    if (
      (event.key === " " || event.key === "Enter") &&
      !event.repeat &&
      !keyboardHolding
    ) {
      keyboardHolding = true;
      begin(event);
    }
  });
  hold.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") {
      keyboardHolding = false;
      stop();
    }
  });
  cancelButton.addEventListener("click", closeGate);
  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeGate();
      return;
    }
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === hold) {
      event.preventDefault();
      cancelButton.focus();
    } else if (!event.shiftKey && document.activeElement === cancelButton) {
      event.preventDefault();
      hold.focus();
    }
  });

  queueMicrotask(() => {
    const parent = backdrop.parentElement;
    if (!parent) return;
    for (const sibling of parent.children) {
      if (!(sibling instanceof HTMLElement) || sibling === backdrop) continue;
      siblingStates.push({
        element: sibling,
        inert: sibling.inert,
        ariaHidden: sibling.getAttribute("aria-hidden"),
      });
      sibling.inert = true;
      sibling.setAttribute("aria-hidden", "true");
    }
    hold.focus();
  });

  return backdrop;
}
