/** Lumi — licuriciul mascotă. Stări: idle, happy, think, sleepy. */

import { svg, INK } from "./svg";

export type LumiMood = "idle" | "happy" | "think" | "sleepy";

export function drawLumi(mood: LumiMood = "idle", size = 120): string {
  const eyes =
    mood === "sleepy"
      ? `<path d="M 44 52 Q 48 56 52 52 M 68 52 Q 72 56 76 52" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`
      : mood === "happy"
        ? `<path d="M 42 52 Q 47 46 52 52 M 68 52 Q 73 46 78 52" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`
        : `<circle cx="47" cy="52" r="5" fill="${INK}"/><circle cx="73" cy="52" r="5" fill="${INK}"/>
           <circle cx="48.7" cy="50.3" r="1.9" fill="#fff"/><circle cx="74.7" cy="50.3" r="1.9" fill="#fff"/>`;

  const mouth =
    mood === "happy"
      ? `<path d="M 50 64 Q 60 74 70 64 Q 65 70 60 70 Q 55 70 50 64 Z" fill="${INK}"/>`
      : mood === "think"
        ? `<path d="M 54 66 Q 60 63 66 66" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`
        : mood === "sleepy"
          ? `<circle cx="60" cy="67" r="3.4" fill="${INK}"/>`
          : `<path d="M 52 63 Q 60 70 68 63" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;

  const wings =
    mood === "happy"
      ? `<ellipse cx="26" cy="34" rx="22" ry="13" fill="rgba(205,235,255,0.95)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(-38 26 34)"/>
         <ellipse cx="94" cy="34" rx="22" ry="13" fill="rgba(205,235,255,0.95)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(38 94 34)"/>`
      : `<ellipse cx="30" cy="38" rx="19" ry="11" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(-26 30 38)"/>
         <ellipse cx="90" cy="38" rx="19" ry="11" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(26 90 38)"/>`;

  const glowOpacity = mood === "sleepy" ? 0.25 : mood === "happy" ? 0.95 : 0.6;

  const zzz =
    mood === "sleepy"
      ? `<text x="88" y="30" font-size="16" fill="${INK}" opacity="0.7" font-weight="bold">z</text>
         <text x="98" y="18" font-size="20" fill="${INK}" opacity="0.5" font-weight="bold">z</text>
         <text x="106" y="4" font-size="24" fill="${INK}" opacity="0.35" font-weight="bold">z</text>`
      : "";

  return svg(
    `
    <circle class="lumi-glow" cx="60" cy="70" r="46" fill="#FFF3B8" opacity="${glowOpacity}"/>
    ${wings}
    <path d="M 48 20 Q 44 8 34 6 M 72 20 Q 76 8 86 6" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="34" cy="6" r="4" fill="#FF9EC6"/>
    <circle cx="86" cy="6" r="4" fill="#FF9EC6"/>
    <ellipse cx="60" cy="62" rx="34" ry="38" fill="#FFD35C" stroke="#E8B23C" stroke-width="3"/>
    <ellipse cx="60" cy="76" rx="24" ry="22" fill="#FFEFA9"/>
    <ellipse cx="60" cy="76" rx="24" ry="22" fill="url(#lumiGlow)" opacity="0.5"/>
    ${eyes}
    ${mouth}
    <circle cx="36" cy="60" r="5.5" fill="#FFB6A3" opacity="0.85"/>
    <circle cx="84" cy="60" r="5.5" fill="#FFB6A3" opacity="0.85"/>
    <defs>
      <radialGradient id="lumiGlow" cx="0.5" cy="0.45" r="0.7">
        <stop offset="0%" stop-color="#FFFBEA"/>
        <stop offset="100%" stop-color="#FFEFA9" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${zzz}
  `,
  ).replace("<svg ", `<svg width="${size}" height="${size}" `);
}
