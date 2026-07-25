/** Carduri pentru rutinele zilnice — „Ce facem întâi?". Scene simple, calde. */

import { svg, INK, cuteFace } from "./svg";

export type RoutineId =
  | "wake_up"
  | "potty"
  | "wash_hands"
  | "brush_teeth"
  | "get_dressed"
  | "eat"
  | "play"
  | "bath"
  | "pajamas"
  | "sleep";

export const ROUTINE_LABELS: Record<RoutineId, string> = {
  wake_up: "ne trezim",
  potty: "mergem la oliță",
  wash_hands: "ne spălăm pe mâini",
  brush_teeth: "ne spălăm pe dinți",
  get_dressed: "ne îmbrăcăm",
  eat: "mâncăm",
  play: "ne jucăm",
  bath: "facem baie",
  pajamas: "ne punem pijamaua",
  sleep: "adormim",
};

/** Lanțuri de rutină (ordine corectă) pentru niveluri. */
export const ROUTINE_CHAINS: readonly (readonly RoutineId[])[] = [
  ["wake_up", "potty", "eat"],
  ["wake_up", "get_dressed", "play"],
  ["eat", "brush_teeth", "sleep"],
  ["play", "bath", "pajamas"],
  ["bath", "pajamas", "sleep"],
  ["wake_up", "eat", "play"],
  ["play", "wash_hands", "eat"],
  ["eat", "bath", "sleep"],
];

const SKIN = "#FFD9B8";

function kidHead(cx: number, cy: number, r: number, hair = "#7D5A40"): string {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}" stroke="#E0B48F" stroke-width="3"/>
    <path d="M ${cx - r} ${cy - r * 0.3} Q ${cx} ${cy - r * 1.9} ${cx + r} ${cy - r * 0.3} Q ${cx} ${cy - r * 1.1} ${cx - r} ${cy - r * 0.3} Z" fill="${hair}"/>
    ${cuteFace(cx, cy + r * 0.08, r * 0.36, { eyeR: r * 0.13, smileW: r * 0.26 })}
  `;
}

export function drawRoutine(id: RoutineId): string {
  switch (id) {
    case "wake_up":
      return svg(`
        <rect x="10" y="62" width="100" height="34" rx="10" fill="#B9C3E8" stroke="#8B97CC" stroke-width="3"/>
        <rect x="10" y="50" width="30" height="20" rx="8" fill="#FFF" stroke="#D9D4CE" stroke-width="3"/>
        <path d="M 46 62 L 110 62 L 110 96 L 46 96 Z" fill="#FF9EC6" stroke="#E87BA8" stroke-width="3"/>
        ${kidHead(30, 46, 15)}
        <path d="M 88 22 L 92 30 L 100 31 L 94 37 L 95 45 L 88 41 L 81 45 L 82 37 L 76 31 L 84 30 Z" fill="#FFD35C"/>
        <circle cx="102" cy="16" r="6" fill="#FFD35C"/>
      `);
    case "potty":
      return svg(`
        <ellipse cx="60" cy="98" rx="34" ry="8" fill="rgba(74,63,53,0.1)"/>
        <path d="M 36 44 L 84 44 L 80 92 Q 60 100 40 92 Z" fill="#CDEBFF" stroke="#9CC6E8" stroke-width="3.5"/>
        <ellipse cx="60" cy="44" rx="24" ry="9" fill="#FFF" stroke="#9CC6E8" stroke-width="3.5"/>
        <ellipse cx="60" cy="44" rx="14" ry="5" fill="#BFE3F2"/>
        <path d="M 30 30 Q 36 20 46 24 Q 40 30 42 38" stroke="#7FC86B" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="92" cy="26" r="8" fill="#FFD35C" stroke="#E8B23C" stroke-width="2.5"/>
      `);
    case "wash_hands":
      return svg(`
        <rect x="28" y="52" width="64" height="16" rx="8" fill="#FFF" stroke="#B9CFDE" stroke-width="3"/>
        <path d="M 52 52 L 52 34 Q 52 28 58 28 L 66 28" stroke="#B8B2AA" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M 60 38 Q 58 46 56 50 M 66 40 Q 65 46 64 50" stroke="#7FC4E8" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="46" cy="78" r="9" fill="${SKIN}" stroke="#E0B48F" stroke-width="2.5"/>
        <circle cx="74" cy="78" r="9" fill="${SKIN}" stroke="#E0B48F" stroke-width="2.5"/>
        <circle cx="40" cy="40" r="5" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="80" cy="34" r="4" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="88" cy="46" r="3" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2"/>
      `);
    case "brush_teeth":
      return svg(`
        ${kidHead(52, 56, 26)}
        <rect x="70" y="48" width="34" height="10" rx="5" fill="#4FA8E8" stroke="#2F86C8" stroke-width="2.5" transform="rotate(-12 87 53)"/>
        <rect x="66" y="44" width="14" height="9" rx="3" fill="#FFF" transform="rotate(-12 73 48)"/>
        <circle cx="96" cy="30" r="4" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="104" cy="40" r="3" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2"/>
      `);
    case "get_dressed":
      return svg(`
        <path d="M 40 26 Q 60 14 80 26 L 96 40 L 84 52 L 78 46 L 78 96 L 42 96 L 42 46 L 36 52 L 24 40 Z"
          fill="#4FA8E8" stroke="#2F86C8" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="60" cy="56" r="4" fill="#FFF"/>
        <circle cx="60" cy="72" r="4" fill="#FFF"/>
        <path d="M 44 100 L 58 100 L 56 112 L 46 112 Z M 62 100 L 76 100 L 74 112 L 64 112 Z" fill="#9B8CF2" stroke="#7A68E0" stroke-width="2.5"/>
      `);
    case "eat":
      return svg(`
        <circle cx="60" cy="66" r="38" fill="#FFF" stroke="#D9D4CE" stroke-width="3.5"/>
        <circle cx="60" cy="66" r="26" fill="#FFF6E3" stroke="#EDE4D0" stroke-width="2"/>
        <circle cx="52" cy="60" r="7" fill="#F25C4C"/>
        <circle cx="68" cy="62" r="7" fill="#F25C4C"/>
        <circle cx="59" cy="74" r="7" fill="#7FC86B"/>
        <path d="M 20 40 L 20 92 M 16 40 L 16 52 Q 16 56 20 56 Q 24 56 24 52 L 24 40" stroke="#B8B2AA" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 100 40 Q 92 46 96 56 Q 98 60 100 62 L 100 92" stroke="#B8B2AA" stroke-width="4" stroke-linecap="round" fill="none"/>
      `);
    case "play":
      return svg(`
        <rect x="20" y="60" width="34" height="34" rx="8" fill="#F25C4C" stroke="#C94530" stroke-width="3"/>
        <rect x="62" y="60" width="34" height="34" rx="8" fill="#FFD35C" stroke="#E8B23C" stroke-width="3"/>
        <rect x="41" y="28" width="34" height="34" rx="8" fill="#4FA8E8" stroke="#2F86C8" stroke-width="3"/>
        <circle cx="37" cy="77" r="6" fill="#FFF"/>
        <path d="M 79 68 L 79 86 M 71 77 L 87 77" stroke="#FFF" stroke-width="4" stroke-linecap="round"/>
        <path d="M 58 44 L 66 56 L 50 56 Z" fill="#FFF"/>
      `);
    case "bath":
      return svg(`
        <path d="M 18 56 L 102 56 L 96 90 Q 60 100 24 90 Z" fill="#CDEBFF" stroke="#9CC6E8" stroke-width="3.5"/>
        <path d="M 22 56 Q 60 48 98 56" stroke="#9CC6E8" stroke-width="3" fill="none"/>
        ${kidHead(60, 44, 17, "#5C4632")}
        <circle cx="38" cy="46" r="7" fill="rgba(255,255,255,0.95)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="82" cy="40" r="5.5" fill="rgba(255,255,255,0.95)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="90" cy="52" r="4" fill="rgba(255,255,255,0.95)" stroke="#9CC6E8" stroke-width="2"/>
        <circle cx="28" cy="52" r="4.5" fill="rgba(255,255,255,0.95)" stroke="#9CC6E8" stroke-width="2"/>
      `);
    case "pajamas":
      return svg(`
        <path d="M 40 24 Q 60 12 80 24 L 94 38 L 83 49 L 78 44 L 78 96 L 42 96 L 42 44 L 37 49 L 26 38 Z"
          fill="#9B8CF2" stroke="#7A68E0" stroke-width="3.5" stroke-linejoin="round"/>
        <g fill="#FFE9A8">
          <circle cx="52" cy="44" r="3.4"/><circle cx="68" cy="56" r="3.4"/><circle cx="54" cy="70" r="3.4"/>
          <circle cx="70" cy="82" r="3.4"/><circle cx="50" cy="88" r="3.4"/>
        </g>
        <path d="M 96 18 Q 88 22 88 30 Q 88 38 96 42 Q 90 43 85 39 Q 78 34 78 30 Q 78 22 85 19 Q 90 16 96 18 Z" fill="#FFE9A8"/>
      `);
    case "sleep":
      return svg(`
        <rect x="10" y="66" width="100" height="30" rx="10" fill="#8B97CC" stroke="#6E7AB5" stroke-width="3"/>
        <rect x="10" y="54" width="30" height="18" rx="8" fill="#FFF" stroke="#D9D4CE" stroke-width="3"/>
        <path d="M 44 66 L 110 66 L 110 96 L 44 96 Z" fill="#9B8CF2" stroke="#7A68E0" stroke-width="3"/>
        <circle cx="30" cy="52" r="14" fill="${SKIN}" stroke="#E0B48F" stroke-width="3"/>
        <path d="M 17 48 Q 30 32 43 48 Q 30 40 17 48 Z" fill="#7D5A40"/>
        <path d="M 23 52 Q 25.5 55 28 52 M 33 52 Q 35.5 55 38 52" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M 26 59 Q 30 62 34 59" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M 92 16 Q 84 20 84 28 Q 84 36 92 40 Q 86 41 81 37 Q 74 32 74 26 Q 74 18 82 15 Q 87 13 92 16 Z" fill="#FFE9A8"/>
        <circle cx="98" cy="30" r="2.6" fill="#FFE9A8"/>
        <circle cx="104" cy="20" r="2" fill="#FFE9A8"/>
      `);
  }
}
