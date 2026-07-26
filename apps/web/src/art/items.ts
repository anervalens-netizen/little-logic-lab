/**
 * Biblioteca de itemi ilustrați (animale, vehicule, mâncare, obiecte).
 * Stil unitar: contur gros, fețe drăgălașe, culori calde.
 * Majoritatea acceptă recolorare — esențial pentru jocurile de sortare.
 */

import { svg, cuteFace, INK } from "./svg";
import { shade, tint } from "./palette";
import {
  ITEM_METADATA,
  type ItemCategory,
  type ItemId,
} from "../generated/item-manifest";

export type { ItemCategory, ItemId };

export interface ItemDef {
  readonly id: ItemId;
  /** Cheie stabilă din manifestul de asset-uri. */
  readonly assetKey: `procedural/items/${string}`;
  /** Forma de bază: „pisică". */
  readonly label: string;
  /** Forma cu articol hotărât: „pisica" — pentru „Atinge pisica!". */
  readonly labelDef: string;
  readonly category: ItemCategory;
  /** Culoarea implicită (hex). */
  readonly color: string;
  /** Poate fi desenat în orice culoare (pentru sort-by-color). */
  readonly recolorable: boolean;
  readonly draw: (color?: string) => string;
}

const W = (body: string) => svg(body);

/* ---------------- Animale ---------------- */

function drawCat(color = "#F5A95C"): string {
  const dark = shade(color, 0.8);
  return W(`
    <path d="M 30 44 L 36 12 L 58 34 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 90 44 L 84 12 L 62 34 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 36 38 L 39 22 L 50 33 Z" fill="#FFD9E0"/>
    <path d="M 84 38 L 81 22 L 70 33 Z" fill="#FFD9E0"/>
    <circle cx="60" cy="64" r="36" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 22 60 L 4 54 M 23 70 L 5 72 M 98 60 L 116 54 M 97 70 L 115 72" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    ${cuteFace(60, 58, 14)}
    <path d="M 56 74 L 60 78 L 64 74 Z" fill="#FF9EC6"/>
  `);
}

function drawDog(color = "#C89B6D"): string {
  const dark = shade(color, 0.75);
  return W(`
    <ellipse cx="26" cy="56" rx="14" ry="26" fill="${dark}" transform="rotate(14 26 56)"/>
    <ellipse cx="94" cy="56" rx="14" ry="26" fill="${dark}" transform="rotate(-14 94 56)"/>
    <circle cx="60" cy="60" r="36" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="60" cy="76" rx="17" ry="13" fill="${tint(color, 0.5)}"/>
    <circle cx="60" cy="70" r="5.5" fill="${INK}"/>
    ${cuteFace(60, 52, 15, { blush: true })}
    <path d="M 52 84 Q 60 90 68 84" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
  `);
}

function drawRabbit(color = "#FFFFFF"): string {
  const dark = "#C9C2BA";
  return W(`
    <rect x="38" y="2" width="16" height="44" rx="8" fill="${color}" stroke="${dark}" stroke-width="3.5" transform="rotate(-6 46 24)"/>
    <rect x="66" y="2" width="16" height="44" rx="8" fill="${color}" stroke="${dark}" stroke-width="3.5" transform="rotate(6 74 24)"/>
    <rect x="42" y="10" width="8" height="28" rx="4" fill="#FFD9E0" transform="rotate(-6 46 24)"/>
    <rect x="70" y="10" width="8" height="28" rx="4" fill="#FFD9E0" transform="rotate(6 74 24)"/>
    <circle cx="60" cy="70" r="34" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    ${cuteFace(60, 64, 13)}
    <ellipse cx="60" cy="80" rx="5" ry="4" fill="#FF9EC6"/>
  `);
}

function drawDuck(color = "#FFD35C"): string {
  const dark = shade(color, 0.8);
  return W(`
    <ellipse cx="60" cy="72" rx="34" ry="28" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="44" cy="74" rx="14" ry="10" fill="${tint(color, 0.35)}" transform="rotate(-16 44 74)"/>
    <circle cx="70" cy="42" r="22" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="92" cy="46" rx="12" ry="7" fill="#FFA94D" stroke="${shade("#FFA94D", 0.8)}" stroke-width="2.5"/>
    ${cuteFace(70, 38, 10, { smileW: 6 })}
  `);
}

function drawFish(color = "#4FA8E8"): string {
  const dark = shade(color, 0.72);
  return W(`
    <path d="M 96 60 L 116 42 L 112 60 L 116 78 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="56" cy="60" rx="42" ry="30" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 52 32 Q 60 18 72 30" fill="${tint(color, 0.3)}" stroke="${dark}" stroke-width="3"/>
    <path d="M 46 44 Q 56 60 46 76 M 66 42 Q 74 60 66 78" stroke="${tint(color, 0.45)}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="34" cy="54" r="6.5" fill="${INK}"/>
    <circle cx="36.5" cy="51.5" r="2.4" fill="#fff"/>
    <path d="M 22 66 Q 28 71 34 68" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="90" cy="34" r="4" fill="rgba(255,255,255,0.7)"/>
    <circle cx="100" cy="24" r="3" fill="rgba(255,255,255,0.7)"/>
  `);
}

function drawElephant(color = "#B9C3E8"): string {
  const dark = shade(color, 0.75);
  return W(`
    <ellipse cx="18" cy="56" rx="18" ry="24" fill="${tint(color, 0.25)}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="102" cy="56" rx="18" ry="24" fill="${tint(color, 0.25)}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="60" cy="58" r="36" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 54 74 Q 52 96 60 104 Q 68 108 72 100 Q 66 98 66 88 Q 66 78 68 74 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    ${cuteFace(60, 50, 16, { blush: true })}
  `);
}

function drawFrog(color = "#7FC86B"): string {
  const dark = shade(color, 0.7);
  return W(`
    <circle cx="38" cy="34" r="14" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="82" cy="34" r="14" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="38" cy="34" r="7" fill="${INK}"/>
    <circle cx="82" cy="34" r="7" fill="${INK}"/>
    <circle cx="40.5" cy="31.5" r="2.6" fill="#fff"/>
    <circle cx="84.5" cy="31.5" r="2.6" fill="#fff"/>
    <ellipse cx="60" cy="70" rx="38" ry="30" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="60" cy="82" rx="24" ry="14" fill="${tint(color, 0.45)}"/>
    <path d="M 40 64 Q 60 78 80 64" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    <circle cx="34" cy="62" r="5" fill="#FFB6A3" opacity="0.8"/>
    <circle cx="86" cy="62" r="5" fill="#FFB6A3" opacity="0.8"/>
  `);
}

function drawBear(color = "#A67B5B"): string {
  const dark = shade(color, 0.72);
  return W(`
    <circle cx="30" cy="32" r="14" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="90" cy="32" r="14" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="30" cy="32" r="6.5" fill="${tint(color, 0.4)}"/>
    <circle cx="90" cy="32" r="6.5" fill="${tint(color, 0.4)}"/>
    <circle cx="60" cy="62" r="37" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="60" cy="74" rx="16" ry="12" fill="${tint(color, 0.45)}"/>
    <ellipse cx="60" cy="69" rx="6" ry="4.6" fill="${INK}"/>
    ${cuteFace(60, 54, 15)}
    <path d="M 54 80 Q 60 84 66 80" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>
  `);
}

function drawBird(color = "#4FA8E8"): string {
  const dark = shade(color, 0.72);
  return W(`
    <ellipse cx="60" cy="66" rx="34" ry="32" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="38" cy="70" rx="16" ry="12" fill="${tint(color, 0.3)}" stroke="${dark}" stroke-width="3" transform="rotate(-18 38 70)"/>
    <ellipse cx="60" cy="82" rx="18" ry="12" fill="${tint(color, 0.55)}"/>
    <path d="M 54 26 Q 50 14 60 12 Q 58 20 62 24 Z" fill="${shade(color, 0.8)}"/>
    <path d="M 60 62 L 74 68 L 60 74 Z" fill="#FFA94D" stroke="${shade("#FFA94D", 0.75)}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="48" cy="54" r="6" fill="${INK}"/>
    <circle cx="50.2" cy="51.8" r="2.2" fill="#fff"/>
    <circle cx="40" cy="64" r="4.6" fill="#FFB6A3" opacity="0.85"/>
  `);
}

function drawButterfly(color = "#FF9EC6"): string {
  const dark = shade(color, 0.72);
  return W(`
    <ellipse cx="34" cy="46" rx="24" ry="20" fill="${color}" stroke="${dark}" stroke-width="3" transform="rotate(-18 34 46)"/>
    <ellipse cx="86" cy="46" rx="24" ry="20" fill="${color}" stroke="${dark}" stroke-width="3" transform="rotate(18 86 46)"/>
    <ellipse cx="36" cy="82" rx="17" ry="13" fill="${tint(color, 0.3)}" stroke="${dark}" stroke-width="3" transform="rotate(12 36 82)"/>
    <ellipse cx="84" cy="82" rx="17" ry="13" fill="${tint(color, 0.3)}" stroke="${dark}" stroke-width="3" transform="rotate(-12 84 82)"/>
    <circle cx="34" cy="44" r="6" fill="${tint(color, 0.55)}"/>
    <circle cx="86" cy="44" r="6" fill="${tint(color, 0.55)}"/>
    <ellipse cx="60" cy="64" rx="7" ry="26" fill="${INK}"/>
    <circle cx="60" cy="36" r="8" fill="${INK}"/>
    <path d="M 55 30 Q 48 18 40 16 M 65 30 Q 72 18 80 16" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <circle cx="40" cy="15" r="3" fill="${INK}"/>
    <circle cx="80" cy="15" r="3" fill="${INK}"/>
  `);
}

function drawBee(color = "#FFD35C"): string {
  const dark = INK;
  return W(`
    <ellipse cx="34" cy="40" rx="16" ry="11" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(-24 34 40)"/>
    <ellipse cx="86" cy="40" rx="16" ry="11" fill="rgba(205,235,255,0.9)" stroke="#9CC6E8" stroke-width="2.5" transform="rotate(24 86 40)"/>
    <ellipse cx="60" cy="66" rx="32" ry="28" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 36 52 Q 60 62 84 52 M 33 68 Q 60 78 87 68" stroke="${dark}" stroke-width="7" fill="none"/>
    <path d="M 52 34 Q 48 24 42 22 M 68 34 Q 72 24 78 22" stroke="${dark}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <circle cx="42" cy="21" r="3" fill="${dark}"/>
    <circle cx="78" cy="21" r="3" fill="${dark}"/>
    <circle cx="50" cy="44" r="5" fill="${INK}"/>
    <circle cx="70" cy="44" r="5" fill="${INK}"/>
    <circle cx="51.8" cy="42" r="1.8" fill="#fff"/>
    <circle cx="71.8" cy="42" r="1.8" fill="#fff"/>
    <path d="M 54 90 Q 60 94 66 90" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  `);
}

function drawPig(color = "#FFB6C9"): string {
  const dark = shade(color, 0.75);
  return W(`
    <path d="M 30 36 L 26 12 L 52 26 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 90 36 L 94 12 L 68 26 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="60" cy="62" r="37" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="60" cy="72" rx="14" ry="10.5" fill="${tint(color, 0.35)}" stroke="${dark}" stroke-width="3"/>
    <circle cx="55" cy="72" r="2.6" fill="${INK}"/>
    <circle cx="65" cy="72" r="2.6" fill="${INK}"/>
    ${cuteFace(60, 50, 15, { blush: true })}
  `);
}

function drawCow(color = "#FFFFFF"): string {
  const dark = "#8D857C";
  return W(`
    <path d="M 32 22 Q 26 8 38 6 Q 34 16 40 22 Z" fill="#E8C98F" stroke="${dark}" stroke-width="2.5"/>
    <path d="M 88 22 Q 94 8 82 6 Q 86 16 80 22 Z" fill="#E8C98F" stroke="${dark}" stroke-width="2.5"/>
    <ellipse cx="24" cy="46" rx="12" ry="8" fill="#FFD9E0" stroke="${dark}" stroke-width="3" transform="rotate(-20 24 46)"/>
    <ellipse cx="96" cy="46" rx="12" ry="8" fill="#FFD9E0" stroke="${dark}" stroke-width="3" transform="rotate(20 96 46)"/>
    <circle cx="60" cy="60" r="36" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 30 40 Q 40 26 54 34 Q 46 46 34 48 Z" fill="#7D6B5D" opacity="0.85"/>
    <ellipse cx="60" cy="80" rx="19" ry="13" fill="#FFD9E0" stroke="${dark}" stroke-width="3"/>
    <circle cx="53" cy="80" r="3" fill="${INK}"/>
    <circle cx="67" cy="80" r="3" fill="${INK}"/>
    ${cuteFace(60, 48, 14, { blush: false })}
  `);
}

function drawLion(color = "#F5B85C"): string {
  const mane = "#E08A4B";
  const dark = shade(mane, 0.7);
  return W(`
    <circle cx="60" cy="60" r="44" fill="${mane}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="${shade(mane, 0.85)}" stroke-width="10" stroke-dasharray="10 12"/>
    <circle cx="60" cy="60" r="31" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="38" cy="38" r="8" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <circle cx="82" cy="38" r="8" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <ellipse cx="60" cy="70" rx="13" ry="10" fill="${tint(color, 0.45)}"/>
    <path d="M 55 66 L 60 71 L 65 66 Z" fill="${INK}"/>
    ${cuteFace(60, 52, 13)}
  `);
}

function drawMouse(color = "#C9C4CC"): string {
  const dark = shade(color, 0.7);
  return W(`
    <circle cx="28" cy="30" r="17" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="92" cy="30" r="17" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="28" cy="30" r="9" fill="#FFD9E0"/>
    <circle cx="92" cy="30" r="9" fill="#FFD9E0"/>
    <circle cx="60" cy="66" r="34" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    ${cuteFace(60, 60, 13)}
    <circle cx="60" cy="78" r="4.6" fill="#FF9EC6"/>
    <path d="M 30 74 L 12 70 M 31 80 L 13 82 M 90 74 L 108 70 M 89 80 L 107 82" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  `);
}

function drawOwl(color = "#B08BD8"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 32 26 L 24 6 L 48 18 Z" fill="${color}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 88 26 L 96 6 L 72 18 Z" fill="${color}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="60" cy="64" rx="36" ry="38" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="60" cy="80" rx="20" ry="16" fill="${tint(color, 0.4)}"/>
    <circle cx="45" cy="52" r="13" fill="#fff" stroke="${dark}" stroke-width="3"/>
    <circle cx="75" cy="52" r="13" fill="#fff" stroke="${dark}" stroke-width="3"/>
    <circle cx="45" cy="52" r="6" fill="${INK}"/>
    <circle cx="75" cy="52" r="6" fill="${INK}"/>
    <circle cx="47" cy="50" r="2.2" fill="#fff"/>
    <circle cx="77" cy="50" r="2.2" fill="#fff"/>
    <path d="M 60 62 L 54 70 L 66 70 Z" fill="#FFA94D" stroke="${shade("#FFA94D", 0.75)}" stroke-width="2" stroke-linejoin="round"/>
  `);
}

/* ---------------- Vehicule ---------------- */

function drawCar(color = "#F25C4C"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 36 58 Q 38 38 58 36 Q 80 34 86 56 Z" fill="${tint(color, 0.2)}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="46" y="42" width="16" height="14" rx="3" fill="#CDEBFF"/>
    <rect x="66" y="42" width="14" height="14" rx="3" fill="#CDEBFF"/>
    <rect x="14" y="56" width="92" height="26" rx="13" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="36" cy="84" r="12" fill="${INK}"/>
    <circle cx="84" cy="84" r="12" fill="${INK}"/>
    <circle cx="36" cy="84" r="5" fill="#D9D4CE"/>
    <circle cx="84" cy="84" r="5" fill="#D9D4CE"/>
    <circle cx="100" cy="66" r="4" fill="#FFE9A8"/>
  `);
}

function drawBus(color = "#FFD35C"): string {
  const dark = shade(color, 0.72);
  return W(`
    <rect x="12" y="32" width="96" height="50" rx="12" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <rect x="20" y="40" width="18" height="16" rx="4" fill="#CDEBFF"/>
    <rect x="44" y="40" width="18" height="16" rx="4" fill="#CDEBFF"/>
    <rect x="68" y="40" width="18" height="16" rx="4" fill="#CDEBFF"/>
    <rect x="92" y="40" width="10" height="30" rx="4" fill="${tint(color, 0.35)}" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="34" cy="84" r="12" fill="${INK}"/>
    <circle cx="86" cy="84" r="12" fill="${INK}"/>
    <circle cx="34" cy="84" r="5" fill="#D9D4CE"/>
    <circle cx="86" cy="84" r="5" fill="#D9D4CE"/>
  `);
}

function drawTrain(color = "#4FA8E8"): string {
  const dark = shade(color, 0.7);
  return W(`
    <rect x="66" y="20" width="14" height="18" rx="3" fill="${shade(color, 0.8)}" stroke="${dark}" stroke-width="3"/>
    <circle cx="73" cy="14" r="6" fill="rgba(255,255,255,0.85)"/>
    <circle cx="82" cy="8" r="4.5" fill="rgba(255,255,255,0.7)"/>
    <rect x="14" y="38" width="70" height="36" rx="8" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <rect x="22" y="46" width="16" height="14" rx="3" fill="#CDEBFF"/>
    <rect x="84" y="48" width="24" height="26" rx="8" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="30" cy="82" r="11" fill="${INK}"/>
    <circle cx="58" cy="82" r="11" fill="${INK}"/>
    <circle cx="92" cy="82" r="11" fill="${INK}"/>
    <circle cx="30" cy="82" r="4.5" fill="#D9D4CE"/>
    <circle cx="58" cy="82" r="4.5" fill="#D9D4CE"/>
    <circle cx="92" cy="82" r="4.5" fill="#D9D4CE"/>
  `);
}

function drawBoat(color = "#7FC86B"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 60 18 L 60 62" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M 60 20 L 92 58 L 60 58 Z" fill="#FF9EC6" stroke="${shade("#FF9EC6", 0.7)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 60 28 L 32 56 L 60 56 Z" fill="${tint("#FF9EC6", 0.4)}" stroke="${shade("#FF9EC6", 0.7)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 16 62 L 104 62 L 92 90 Q 60 98 28 90 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="42" cy="76" r="5" fill="${tint(color, 0.5)}"/>
    <circle cx="60" cy="78" r="5" fill="${tint(color, 0.5)}"/>
    <circle cx="78" cy="76" r="5" fill="${tint(color, 0.5)}"/>
  `);
}

function drawPlane(color = "#9B8CF2"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 14 66 Q 14 52 34 52 L 86 52 Q 108 52 108 62 Q 108 72 86 72 L 34 72 Q 14 72 14 66 Z" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 48 52 L 36 30 Q 34 26 40 26 L 50 26 Q 54 26 56 30 L 66 52 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 52 72 L 42 88 Q 40 92 46 92 L 54 92 Q 58 92 60 88 L 68 72 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 92 52 L 98 38 L 106 38 L 104 52 Z" fill="${shade(color, 0.8)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="36" cy="62" r="4" fill="#CDEBFF"/>
    <circle cx="50" cy="62" r="4" fill="#CDEBFF"/>
    <circle cx="64" cy="62" r="4" fill="#CDEBFF"/>
  `);
}

function drawRocket(color = "#F25C4C"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 60 8 Q 84 32 84 62 L 36 62 Q 36 32 60 8 Z" fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="36" y="62" width="48" height="26" rx="8" fill="${tint(color, 0.25)}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="60" cy="42" r="12" fill="#CDEBFF" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 36 70 L 20 92 Q 18 96 24 96 L 38 92 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 84 70 L 100 92 Q 102 96 96 96 L 82 92 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 92 Q 46 104 60 112 Q 74 104 70 92 Z" fill="#FFD35C" stroke="${shade("#FFD35C", 0.75)}" stroke-width="3"/>
  `);
}

/* ---------------- Mâncare ---------------- */

function drawApple(color = "#F25C4C"): string {
  const dark = shade(color, 0.72);
  return W(`
    <path d="M 60 34 Q 58 24 50 20" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M 62 26 Q 74 14 86 22 Q 78 34 62 30 Z" fill="#7FC86B" stroke="${shade("#7FC86B", 0.7)}" stroke-width="3"/>
    <path d="M 60 34 C 44 22 22 32 22 58 C 22 84 44 102 60 96 C 76 102 98 84 98 58 C 98 32 76 22 60 34 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="42" cy="52" rx="8" ry="12" fill="rgba(255,255,255,0.35)" transform="rotate(-18 42 52)"/>
    ${cuteFace(60, 56, 13)}
  `);
}

function drawBanana(color = "#FFD35C"): string {
  const dark = shade(color, 0.72);
  return W(`
    <path d="M 26 30 Q 20 78 66 96 Q 92 102 100 88 Q 104 80 94 78 Q 50 74 44 30 Q 42 18 34 20 Q 26 20 26 30 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 34 34 Q 40 70 84 84" stroke="${tint(color, 0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="52" cy="62" r="4.6" fill="${INK}"/>
    <circle cx="53.6" cy="60.4" r="1.7" fill="#fff"/>
    <path d="M 58 72 Q 62 75 66 72" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
  `);
}

function drawCookie(color = "#C89B6D"): string {
  const dark = shade(color, 0.7);
  return W(`
    <circle cx="60" cy="60" r="40" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <circle cx="42" cy="44" r="6" fill="${shade(color, 0.55)}"/>
    <circle cx="74" cy="38" r="5" fill="${shade(color, 0.55)}"/>
    <circle cx="84" cy="66" r="6" fill="${shade(color, 0.55)}"/>
    <circle cx="50" cy="82" r="5" fill="${shade(color, 0.55)}"/>
    <circle cx="30" cy="66" r="4.5" fill="${shade(color, 0.55)}"/>
    ${cuteFace(60, 56, 13)}
  `);
}

function drawStrawberry(color = "#F25C4C"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 60 104 C 30 82 20 58 26 40 Q 30 26 44 28 L 76 28 Q 90 26 94 40 C 100 58 90 82 60 104 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 60 30 L 52 14 L 58 20 L 60 10 L 62 20 L 68 14 Z" fill="#4E9A51"/>
    <path d="M 38 26 Q 60 14 82 26 Q 74 34 60 32 Q 46 34 38 26 Z" fill="#7FC86B" stroke="#4E9A51" stroke-width="2.5"/>
    <g fill="#FFE9A8">
      <circle cx="42" cy="52" r="2.6"/><circle cx="60" cy="48" r="2.6"/><circle cx="78" cy="52" r="2.6"/>
      <circle cx="50" cy="68" r="2.6"/><circle cx="70" cy="68" r="2.6"/><circle cx="60" cy="84" r="2.6"/>
    </g>
    ${cuteFace(60, 58, 13)}
  `);
}

function drawCarrot(color = "#FFA94D"): string {
  const dark = shade(color, 0.72);
  return W(`
    <path d="M 52 34 Q 40 20 34 8 Q 46 12 54 24 Q 56 12 60 4 Q 64 12 66 24 Q 74 12 86 8 Q 80 20 68 34 Z"
      fill="#7FC86B" stroke="#4E9A51" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 46 34 L 74 34 Q 78 70 62 104 Q 60 108 58 104 Q 42 70 46 34 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 50 52 L 64 50 M 52 68 L 66 66 M 55 84 L 64 82" stroke="${shade(color, 0.8)}" stroke-width="3" stroke-linecap="round"/>
    ${cuteFace(60, 52, 10, { eyeR: 3.8, smileW: 6 })}
  `);
}

function drawCupcake(color = "#FF9EC6"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 34 58 Q 30 34 60 32 Q 90 34 86 58 Q 92 58 92 66 Q 92 74 84 74 L 36 74 Q 28 74 28 66 Q 28 58 34 58 Z"
      fill="${color}" stroke="${dark}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="60" cy="26" r="8" fill="#F25C4C" stroke="${shade("#F25C4C", 0.7)}" stroke-width="2.5"/>
    <path d="M 42 74 L 48 102 Q 60 108 72 102 L 78 74 Z" fill="#FFE9A8" stroke="${shade("#FFE9A8", 0.7)}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 50 76 L 53 100 M 60 78 L 60 102 M 70 76 L 67 100" stroke="${shade("#FFE9A8", 0.72)}" stroke-width="3"/>
    ${cuteFace(60, 54, 12)}
  `);
}

/* ---------------- Obiecte & natură ---------------- */

function drawBall(color = "#F25C4C"): string {
  const dark = shade(color, 0.7);
  return W(`
    <circle cx="60" cy="60" r="40" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 60 20 Q 78 60 60 100" stroke="${tint(color, 0.5)}" stroke-width="9" fill="none"/>
    <path d="M 24 44 Q 60 60 96 44 M 24 76 Q 60 60 96 76" stroke="${tint(color, 0.35)}" stroke-width="6" fill="none"/>
    <ellipse cx="42" cy="38" rx="10" ry="7" fill="rgba(255,255,255,0.4)" transform="rotate(-28 42 38)"/>
  `);
}

function drawBalloon(color = "#F25C4C"): string {
  const dark = shade(color, 0.7);
  return W(`
    <path d="M 60 84 Q 52 96 60 104 Q 68 110 62 116" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M 54 80 L 66 80 L 60 90 Z" fill="${shade(color, 0.85)}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="60" cy="46" rx="32" ry="36" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <ellipse cx="46" cy="32" rx="9" ry="13" fill="rgba(255,255,255,0.4)" transform="rotate(-20 46 32)"/>
    ${cuteFace(60, 46, 12)}
  `);
}

function drawFlower(color = "#FF9EC6"): string {
  const dark = shade(color, 0.7);
  const petal = (cx: number, cy: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="18" fill="${color}" stroke="${dark}" stroke-width="3"/>`;
  return W(`
    <path d="M 60 66 L 60 108" stroke="#4E9A51" stroke-width="5" stroke-linecap="round"/>
    <path d="M 60 92 Q 44 88 38 76 Q 52 76 60 86 Z" fill="#7FC86B" stroke="#4E9A51" stroke-width="2.5"/>
    ${petal(60, 24)}${petal(34, 40)}${petal(86, 40)}${petal(42, 66)}${petal(78, 66)}
    <circle cx="60" cy="46" r="16" fill="#FFD35C" stroke="${shade("#FFD35C", 0.72)}" stroke-width="3"/>
    ${cuteFace(60, 44, 6.5, { eyeR: 2.6, smileW: 4, blush: false })}
  `);
}

function drawTree(color = "#7FC86B"): string {
  const dark = shade(color, 0.68);
  return W(`
    <rect x="52" y="70" width="16" height="34" rx="6" fill="#A67B5B" stroke="${shade("#A67B5B", 0.7)}" stroke-width="3"/>
    <circle cx="40" cy="52" r="24" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <circle cx="80" cy="52" r="24" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <circle cx="60" cy="36" r="26" fill="${tint(color, 0.15)}" stroke="${dark}" stroke-width="3"/>
    <circle cx="48" cy="34" r="4" fill="#F25C4C"/>
    <circle cx="74" cy="44" r="4" fill="#F25C4C"/>
    <circle cx="58" cy="56" r="4" fill="#F25C4C"/>
  `);
}

function drawHouse(color = "#FFA94D"): string {
  const dark = shade(color, 0.7);
  return W(`
    <rect x="24" y="52" width="72" height="50" rx="6" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    <path d="M 14 54 L 60 16 L 106 54 Z" fill="#F25C4C" stroke="${shade("#F25C4C", 0.7)}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="50" y="72" width="20" height="30" rx="4" fill="#A67B5B" stroke="${shade("#A67B5B", 0.7)}" stroke-width="3"/>
    <circle cx="66" cy="88" r="2.4" fill="#FFE9A8"/>
    <rect x="32" y="60" width="14" height="14" rx="3" fill="#CDEBFF" stroke="${dark}" stroke-width="2.5"/>
    <rect x="74" y="60" width="14" height="14" rx="3" fill="#CDEBFF" stroke="${dark}" stroke-width="2.5"/>
  `);
}

function drawSun(color = "#FFD35C"): string {
  const dark = shade(color, 0.75);
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const x1 = 60 + Math.cos(angle) * 40;
    const y1 = 60 + Math.sin(angle) * 40;
    const x2 = 60 + Math.cos(angle) * 52;
    const y2 = 60 + Math.sin(angle) * 52;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
  }).join("");
  return W(`
    ${rays}
    <circle cx="60" cy="60" r="30" fill="${color}" stroke="${dark}" stroke-width="3.5"/>
    ${cuteFace(60, 56, 11)}
  `);
}

function drawMoon(color = "#FFE9A8"): string {
  return W(`
    <path d="M 78 14 Q 44 26 44 60 Q 44 94 78 106 Q 60 110 42 100 Q 16 86 16 60 Q 16 34 42 20 Q 60 10 78 14 Z"
      fill="${color}" stroke="${shade(color, 0.8)}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="48" cy="52" r="4" fill="${INK}"/>
    <path d="M 44 66 Q 48 69 52 66" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    <circle cx="84" cy="34" r="3" fill="#fff"/>
    <circle cx="96" cy="52" r="2.4" fill="#fff"/>
  `);
}

function drawCloud(color = "#FFFFFF"): string {
  const dark = "#B9CFDE";
  return W(`
    <ellipse cx="44" cy="66" rx="24" ry="18" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <ellipse cx="72" cy="58" rx="26" ry="22" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <ellipse cx="62" cy="76" rx="30" ry="16" fill="${color}" stroke="${dark}" stroke-width="3"/>
    ${cuteFace(60, 62, 12)}
  `);
}

/* ---------------- Registru ---------------- */

const DRAW_BY_ID = {
  cat: drawCat,
  dog: drawDog,
  rabbit: drawRabbit,
  duck: drawDuck,
  fish: drawFish,
  elephant: drawElephant,
  frog: drawFrog,
  bear: drawBear,
  bird: drawBird,
  butterfly: drawButterfly,
  bee: drawBee,
  pig: drawPig,
  cow: drawCow,
  lion: drawLion,
  mouse: drawMouse,
  owl: drawOwl,
  car: drawCar,
  bus: drawBus,
  train: drawTrain,
  boat: drawBoat,
  plane: drawPlane,
  rocket: drawRocket,
  apple: drawApple,
  banana: drawBanana,
  cookie: drawCookie,
  strawberry: drawStrawberry,
  carrot: drawCarrot,
  cupcake: drawCupcake,
  ball: drawBall,
  balloon: drawBalloon,
  flower: drawFlower,
  tree: drawTree,
  house: drawHouse,
  sun: drawSun,
  moon: drawMoon,
  cloud: drawCloud,
} satisfies Record<ItemId, (color?: string) => string>;

export const ITEMS: readonly ItemDef[] = ITEM_METADATA.map(
  ({ defaultColor, ...item }) => ({
    ...item,
    color: defaultColor,
    draw: DRAW_BY_ID[item.id],
  }),
);

const byId = new Map<ItemId, ItemDef>(ITEMS.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef {
  const found = byId.get(id as ItemId);
  if (!found) throw new Error(`Unknown item: ${id}`);
  return found;
}

export function drawItem(id: string, color?: string): string {
  return getItem(id).draw(color);
}
