/** Decoruri: pajiște, cer înnoptat. Desenate într-un viewBox 100×100, decupate. */

import { svg } from "./svg";

function slice(markup: string): string {
  return markup.replace(
    'width="100%" height="100%"',
    'width="100%" height="100%" preserveAspectRatio="xMidYMax slice"',
  );
}

export function meadowScene(): string {
  return slice(
    svg(
      `
      <circle cx="88" cy="12" r="8" fill="#FFE9A8" opacity="0.9"/>
      <circle cx="88" cy="12" r="12" fill="#FFF3C9" opacity="0.45"/>
      <g opacity="0.85" fill="#fff">
        <ellipse cx="18" cy="14" rx="10" ry="4.4"/>
        <ellipse cx="27" cy="11" rx="7.5" ry="3.6"/>
        <ellipse cx="68" cy="21" rx="8.5" ry="3.8" opacity="0.8"/>
      </g>
      <path d="M -5 80 Q 25 68 55 78 Q 80 86 105 76 L 105 105 L -5 105 Z" fill="#9BD887"/>
      <path d="M -5 90 Q 30 80 60 88 Q 85 94 105 88 L 105 105 L -5 105 Z" fill="#7FC86B"/>
      <g>
        <circle cx="10" cy="88" r="2.2" fill="#FF9EC6"/>
        <circle cx="10" cy="88" r="0.9" fill="#FFD35C"/>
        <circle cx="90" cy="84" r="2.2" fill="#9B8CF2"/>
        <circle cx="90" cy="84" r="0.9" fill="#FFD35C"/>
        <circle cx="72" cy="94" r="2" fill="#F25C4C"/>
        <circle cx="72" cy="94" r="0.8" fill="#FFD35C"/>
        <circle cx="30" cy="95" r="2" fill="#FFD35C"/>
        <circle cx="30" cy="95" r="0.8" fill="#F25C4C"/>
      </g>
    `,
      "0 0 100 100",
    ),
  );
}

export function nightScene(): string {
  const stars = [
    [12, 16, 1.4], [30, 8, 1], [48, 18, 1.7], [66, 10, 1.2], [82, 20, 1.4],
    [22, 30, 0.9], [58, 30, 1], [90, 34, 1.1], [8, 44, 1], [40, 40, 0.8],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF3C9" opacity="0.9"/>`)
    .join("");
  return slice(
    svg(
      `
      ${stars}
      <path d="M 78 8 Q 66 14 66 26 Q 66 38 78 44 Q 70 45 62 40 Q 52 33 52 24 Q 52 13 63 9 Q 71 6 78 8 Z" fill="#FFE9A8"/>
      <path d="M -5 84 Q 30 74 60 82 Q 85 88 105 82 L 105 105 L -5 105 Z" fill="#4E5A9E"/>
      <circle cx="20" cy="86" r="2" fill="#9B8CF2"/>
      <circle cx="20" cy="86" r="0.8" fill="#FFE9A8"/>
      <circle cx="84" cy="90" r="2" fill="#9B8CF2"/>
      <circle cx="84" cy="90" r="0.8" fill="#FFE9A8"/>
    `,
      "0 0 100 100",
    ),
  );
}
