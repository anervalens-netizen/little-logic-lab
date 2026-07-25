/** Helperi pentru construit SVG ca string, într-un stil unitar (viewBox 120). */

export function svg(inner: string, viewBox = "0 0 120 120"): string {
  // Fără xmlns: markup-ul e injectat prin innerHTML, unde parserul HTML
  // creează corect elementele în namespace-ul SVG.
  return `<svg viewBox="${viewBox}" width="100%" height="100%">${inner}</svg>`;
}

export const INK = "#4A3F35";

/** Față drăgălașă: ochi mari cu luciu, zâmbet, obrajori. */
export function cuteFace(
  cx: number,
  cy: number,
  spacing: number,
  opts: { eyeR?: number; smileW?: number; blush?: boolean } = {},
): string {
  const eyeR = opts.eyeR ?? 4.6;
  const smileW = opts.smileW ?? 9;
  const blush = opts.blush ?? true;
  const lx = cx - spacing;
  const rx = cx + spacing;
  return `
    <circle class="lll-eye" cx="${lx}" cy="${cy}" r="${eyeR}" fill="${INK}"/>
    <circle class="lll-eye" cx="${rx}" cy="${cy}" r="${eyeR}" fill="${INK}"/>
    <circle cx="${lx + eyeR * 0.35}" cy="${cy - eyeR * 0.35}" r="${eyeR * 0.32}" fill="#fff"/>
    <circle cx="${rx + eyeR * 0.35}" cy="${cy - eyeR * 0.35}" r="${eyeR * 0.32}" fill="#fff"/>
    <path d="M ${cx - smileW} ${cy + eyeR + 5.5} Q ${cx} ${cy + eyeR + 5.5 + smileW * 0.85} ${cx + smileW} ${cy + eyeR + 5.5}"
      stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    ${blush ? `<circle cx="${lx - eyeR - 4.5}" cy="${cy + eyeR + 4}" r="4.4" fill="#FFB6A3" opacity="0.8"/>
    <circle cx="${rx + eyeR + 4.5}" cy="${cy + eyeR + 4}" r="4.4" fill="#FFB6A3" opacity="0.8"/>` : ""}
  `;
}

/** Umbră de sol sub un obiect. */
export function groundShadow(cx: number, cy: number, rx: number): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.18}" fill="rgba(74,63,53,0.12)"/>`;
}
