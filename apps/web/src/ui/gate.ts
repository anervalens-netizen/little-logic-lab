/**
 * Poarta pentru adulți: ține apăsat 3 secunde.
 * Suficient pentru un copil de 3 ani, rapid pentru un părinte.
 */

import { el } from "./dom";

export function openParentGate(onPassed: () => void, onCancel?: () => void): HTMLElement {
  const backdrop = el("div", { className: "gate-backdrop", role: "dialog", "aria-label": "Zonă pentru adulți" });
  const card = el("div", { className: "gate-card" });
  const title = el("h2", {}, "Zonă pentru adulți");
  title.style.fontSize = "26px";
  const hint = el("p", {}, "Ține apăsat butonul 3 secunde.");
  hint.style.cssText = "color:#7A6C5D;font-size:18px;margin-top:6px;";

  const fill = el("div", { className: "fill" });
  const label = el("span", {}, "Ține apăsat");
  const hold = el("button", { className: "gate-hold", "aria-label": "Ține apăsat 3 secunde" }, fill, label);

  const cancel = el("button", { className: "btn-big", style: "font-size:20px;min-height:64px;padding:10px 30px;margin-top:14px;" }, "Înapoi");

  card.append(title, hint, hold, cancel);
  backdrop.append(card);

  let timer: number | null = null;
  let startTime = 0;
  let raf = 0;
  const HOLD_MS = 3000;

  const cleanup = () => {
    if (timer !== null) clearTimeout(timer);
    cancelAnimationFrame(raf);
    backdrop.remove();
  };

  const tick = () => {
    const progress = Math.min(1, (performance.now() - startTime) / HOLD_MS);
    fill.style.transform = `scaleY(${progress})`;
    if (progress < 1) raf = requestAnimationFrame(tick);
  };

  const begin = (event: Event) => {
    event.preventDefault();
    startTime = performance.now();
    raf = requestAnimationFrame(tick);
    timer = window.setTimeout(() => {
      cleanup();
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

  hold.addEventListener("pointerdown", begin);
  hold.addEventListener("pointerup", stop);
  hold.addEventListener("pointerleave", stop);
  hold.addEventListener("pointercancel", stop);
  cancel.addEventListener("click", () => {
    cleanup();
    onCancel?.();
  });

  return backdrop;
}
