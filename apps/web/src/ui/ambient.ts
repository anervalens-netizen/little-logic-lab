/** Ambient viu: nori plutitori, licurici care urcă, un fluture care trece. */

import { el, svgEl } from "./dom";
import { isMotionReduced } from "./feedback";
import { drawItem } from "../art/items";

function cloud(scale: number, topVh: number, durationS: number, delayS: number): HTMLElement {
  const node = el("div", { className: "ambient-cloud" });
  node.style.cssText = `top:${topVh}vh;width:${Math.round(150 * scale)}px;animation-duration:${durationS}s;animation-delay:${delayS}s;`;
  node.append(svgEl(drawItem("cloud")));
  return node;
}

function firefly(leftVw: number, durationS: number, delayS: number): HTMLElement {
  const node = el("div", { className: "ambient-firefly" });
  node.style.cssText = `left:${leftVw}vw;animation-duration:${durationS}s;animation-delay:${delayS}s;`;
  return node;
}

/** Atașează stratul ambient unui ecran (dispare odată cu el). */
export function attachAmbient(screen: HTMLElement, opts: { butterfly?: boolean } = {}): void {
  if (isMotionReduced()) return;
  const layer = el("div", {});
  layer.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;";
  layer.append(
    cloud(1, 9, 95, -30),
    cloud(0.72, 20, 120, -70),
    cloud(0.55, 4, 80, -10),
    firefly(12, 11, 2),
    firefly(28, 13, 6.5),
    firefly(55, 12, 4),
    firefly(74, 14, 8),
    firefly(90, 11.5, 1),
  );
  if (opts.butterfly !== false) {
    const b = el("div", { className: "ambient-butterfly" });
    b.append(svgEl(drawItem("butterfly")));
    layer.append(b);
  }
  screen.append(layer);
}
