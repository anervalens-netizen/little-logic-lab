/** Forme geometrice drăgălașe, colorabile, cu față opțională. */

import { svg, cuteFace } from "./svg";
import { shade } from "./palette";

export type ShapeId =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "heart"
  | "diamond"
  | "hexagon"
  | "oval";

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: "cerc",
  square: "pătrat",
  triangle: "triunghi",
  star: "steluță",
  heart: "inimioară",
  diamond: "romb",
  hexagon: "hexagon",
  oval: "oval",
};

export const ALL_SHAPES: readonly ShapeId[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "diamond",
  "hexagon",
  "oval",
];

/** Silueta formei (folosită și la umbre și la puzzle). */
export function shapePath(id: ShapeId): string {
  switch (id) {
    case "circle":
      return `<circle cx="60" cy="60" r="40"/>`;
    case "square":
      return `<rect x="21" y="21" width="78" height="78" rx="14"/>`;
    case "triangle":
      return `<path d="M 60 18 L 102 96 Q 104 102 97 102 L 23 102 Q 16 102 18 96 Z"/>`;
    case "star":
      return `<path d="M60 12 L72.5 44 L106 45.5 L79.5 66 L89 100 L60 80.5 L31 100 L40.5 66 L14 45.5 L47.5 44 Z"/>`;
    case "heart":
      return `<path d="M60 102 C 30 78 14 58 14 40 C 14 24 26 14 39 14 C 48 14 56 19 60 28 C 64 19 72 14 81 14 C 94 14 106 24 106 40 C 106 58 90 78 60 102 Z"/>`;
    case "diamond":
      return `<path d="M60 14 L102 60 L60 106 L18 60 Z"/>`;
    case "hexagon":
      return `<path d="M60 12 L101 36 L101 84 L60 108 L19 84 L19 36 Z"/>`;
    case "oval":
      return `<ellipse cx="60" cy="60" rx="32" ry="44"/>`;
  }
}

export function drawShape(
  id: ShapeId,
  color: string,
  opts: { face?: boolean; size?: number } = {},
): string {
  const withFace = opts.face ?? true;
  const edge = shade(color, 0.78);
  const body = `<g fill="${color}" stroke="${edge}" stroke-width="4" stroke-linejoin="round">${shapePath(id)}</g>`;
  const face = withFace ? cuteFace(60, id === "triangle" ? 72 : 54, 13, { eyeR: 4.2 }) : "";
  return svg(body + face);
}

/** Siluetă complet neagră — pentru jocul „Potrivește umbra". */
export function drawShapeShadow(id: ShapeId): string {
  return svg(`<g fill="#3A3440">${shapePath(id)}</g>`);
}

/** Contur punctat — „gaura" din puzzle. */
export function drawShapeHole(id: ShapeId): string {
  return svg(
    `<g fill="rgba(74,63,53,0.08)" stroke="rgba(74,63,53,0.35)" stroke-width="4" stroke-dasharray="9 7" stroke-linejoin="round">${shapePath(id)}</g>`,
  );
}
