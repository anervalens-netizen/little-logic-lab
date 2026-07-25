/**
 * Motor de drag & drop pentru degete mici:
 * - obiectul se lipește de deget (clonă), ținta se emoționează când e sub el;
 * - eliberare pe țintă → zbor cu elastic înăuntru; altundeva → „boing" înapoi;
 * - atingerea simplă (fără mișcare) rămâne „tap" — jocurile își păstrează logica.
 */

import { sfxSwipe, sfxBoing, sfxPlop } from "../audio/sfx";

export interface DropTargetSpec {
  readonly node: HTMLElement;
  readonly data: string;
}

export interface DragSpec {
  /** Identificatorul purtat de obiect (ex. itemId). */
  readonly data: string;
  /** Ținte posibile la momentul începerii tragerii. */
  readonly targets: () => readonly DropTargetSpec[];
  /** Eliberare validă pe o țintă. */
  readonly onDrop: (target: DropTargetSpec) => void;
  /** Poate începe tragerea? (ex. nu e deja plasat) */
  readonly canDrag?: () => boolean;
}

const DRAG_THRESHOLD_PX = 10;
const activeDrags = new WeakMap<HTMLElement, boolean>();

export function makeDraggable(element: HTMLElement, spec: DragSpec): void {
  if (activeDrags.has(element)) return;
  activeDrags.set(element, true);

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let clone: HTMLElement | null = null;
  let hovered: DropTargetSpec | null = null;
  let suppressClick = false;

  // Click-ul generat după un drag real nu trebuie să declanșeze și logica de tap.
  element.addEventListener(
    "click",
    (event) => {
      if (suppressClick) {
        event.stopImmediatePropagation();
        event.preventDefault();
        suppressClick = false;
      }
    },
    true,
  );

  const hitTest = (x: number, y: number): DropTargetSpec | null => {
    for (const target of spec.targets()) {
      const rect = target.node.getBoundingClientRect();
      const pad = 18; // ținte „magnetice", iertătoare
      if (x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad) {
        return target;
      }
    }
    return null;
  };

  const setHovered = (next: DropTargetSpec | null): void => {
    if (hovered?.node === next?.node) return;
    hovered?.node.classList.remove("drop-hover");
    hovered = next;
    hovered?.node.classList.add("drop-hover");
  };

  const finish = (x: number, y: number): void => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    const activeClone = clone;
    clone = null;

    if (!dragging) {
      element.classList.remove("lll-drag-ghost");
      return; // a fost doar un tap — click-ul curge normal
    }
    suppressClick = true;
    dragging = false;

    const target = hitTest(x, y);
    setHovered(null);
    element.classList.remove("lll-drag-ghost");

    if (activeClone) {
      if (target) {
        // Zbor elastic în țintă, apoi dispare; jocul actualizează UI-ul real.
        sfxPlop();
        const rect = target.node.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - x;
        const dy = rect.top + rect.height / 2 - y;
        activeClone
          .animate(
            [
              { transform: `translate(-50%, -62%) scale(1.16) rotate(4deg)`, left: `${x}px`, top: `${y}px` },
              { transform: `translate(calc(-50% + ${dx}px), calc(-62% + ${dy}px)) scale(0.5)`, left: `${x}px`, top: `${y}px` },
            ],
            { duration: 300, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)", fill: "forwards" },
          )
          .finished.then(() => activeClone.remove())
          .catch(() => activeClone.remove());
        spec.onDrop(target);
      } else {
        // „Boing" — revine elastic acasă.
        sfxBoing();
        const home = element.getBoundingClientRect();
        const dx = home.left + home.width / 2 - x;
        const dy = home.top + home.height / 2 - y;
        activeClone
          .animate(
            [
              { transform: "translate(-50%, -62%) scale(1.16) rotate(4deg)" },
              { transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-62% + ${dy * 0.6 - 60}px)) scale(0.9) rotate(-8deg)`, offset: 0.6 },
              { transform: `translate(calc(-50% + ${dx}px), calc(-62% + ${dy}px)) scale(1) rotate(0deg)` },
            ],
            { duration: 480, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)", fill: "forwards" },
          )
          .finished.then(() => {
            activeClone.remove();
            element.classList.add("lll-jelly");
            setTimeout(() => element.classList.remove("lll-jelly"), 600);
          })
          .catch(() => activeClone.remove());
      }
    }
    pointerId = null;
  };

  const onMove = (event: PointerEvent): void => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const x = event.clientX;
    const y = event.clientY;
    if (!dragging && Math.hypot(x - startX, y - startY) > DRAG_THRESHOLD_PX) {
      dragging = true;
      sfxSwipe();
      element.classList.add("lll-drag-ghost");
      clone = element.cloneNode(true) as HTMLElement;
      clone.classList.add("lll-drag-clone");
      clone.classList.remove("pop-in", "lll-drag-ghost");
      clone.style.animation = "none";
      const rect = element.getBoundingClientRect();
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      document.body.append(clone);
    }
    if (dragging && clone) {
      clone.style.left = `${x}px`;
      clone.style.top = `${y}px`;
      clone.style.transform = "translate(-50%, -62%) scale(1.16) rotate(4deg)";
      setHovered(hitTest(x, y));
    }
  };

  const onUp = (event: PointerEvent): void => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    finish(event.clientX, event.clientY);
  };

  element.addEventListener("pointerdown", (event) => {
    if (pointerId !== null) return;
    if (spec.canDrag && !spec.canDrag()) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragging = false;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
}
