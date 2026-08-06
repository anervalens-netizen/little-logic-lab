/** Forme geometrice colorabile pentru jocuri, puzzle și umbre. */

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
  | "oval"
  | "pentagon"
  | "cross";

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: "cerc",
  square: "pătrat",
  triangle: "triunghi",
  star: "steluță",
  heart: "inimioară",
  diamond: "romb",
  hexagon: "hexagon",
  oval: "oval",
  pentagon: "pentagon",
  cross: "cruce",
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
  "pentagon",
  "cross",
];

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
    case "pentagon":
      return `<path d="M60 12 L104 46 L87 102 L33 102 L16 46 Z"/>`;
    case "cross":
      return `<path d="M43 14 H77 V43 H106 V77 H77 V106 H43 V77 H14 V43 H43 Z"/>`;
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
  const face = withFace
    ? cuteFace(60, id === "triangle" ? 72 : 54, 13, { eyeR: 4.2 })
    : "";
  return svg(body + face);
}

/** Piesă premium pentru masa de lucru: volum, highlight și mâner discret. */
export function drawWorkshopShape(id: ShapeId, color: string): string {
  const edge = shade(color, 0.68);
  const shadow = shade(color, 0.52);
  return svg(`
    <defs>
      <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="7" stdDeviation="4" flood-color="#4A3F35" flood-opacity="0.22"/>
      </filter>
      <linearGradient id="piece-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/>
        <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g filter="url(#piece-shadow)" transform="translate(0 3)">
      <g fill="${shadow}" stroke="${edge}" stroke-width="5" stroke-linejoin="round" transform="translate(0 4)">${shapePath(id)}</g>
      <g fill="${color}" stroke="${edge}" stroke-width="5" stroke-linejoin="round">${shapePath(id)}</g>
      <g fill="url(#piece-light)" stroke="none" transform="translate(-4 -5) scale(.94) translate(4 5)">${shapePath(id)}</g>
      <circle cx="60" cy="57" r="9" fill="#FFF8EC" stroke="${edge}" stroke-width="4"/>
      <circle cx="57" cy="54" r="2.5" fill="#FFFFFF" opacity=".9"/>
    </g>
  `);
}

/** Locaș de atelier cu adâncime vizuală, dar contrast blând. */
export function drawWorkshopShapeHole(id: ShapeId): string {
  return svg(`
    <g transform="translate(0 3)" fill="rgba(74,63,53,0.18)" stroke="rgba(74,63,53,0.42)" stroke-width="7" stroke-linejoin="round">${shapePath(id)}</g>
    <g fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" stroke-width="3" stroke-linejoin="round" transform="translate(0 -2)">${shapePath(id)}</g>
  `);
}

export function drawShapeShadow(id: ShapeId): string {
  return svg(`<g fill="#3A3440">${shapePath(id)}</g>`);
}

export function drawShapeHole(id: ShapeId): string {
  return svg(
    `<g fill="rgba(74,63,53,0.08)" stroke="rgba(74,63,53,0.35)" stroke-width="4" stroke-dasharray="9 7" stroke-linejoin="round">${shapePath(id)}</g>`,
  );
}
