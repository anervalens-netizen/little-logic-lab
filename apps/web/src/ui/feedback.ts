/** Feedback vizual: confetti, scântei, laude și demonstrația cu mânuța. */

import { el, svgEl, wait } from "./dom";
import { sfxSuccess, sfxWin, sfxGentleNo, sfxHint } from "../audio/sfx";
import { speakCueAndWait } from "../audio/speech";
import { demonstrationDelay } from "./accessibilityPreferences";

const CONFETTI_COLORS = [
  "#F25C4C",
  "#FFD35C",
  "#7FC86B",
  "#4FA8E8",
  "#9B8CF2",
  "#FF9EC6",
];

let motionReduced = false;
export function setMotionReduced(value: boolean): void {
  motionReduced = value;
  document.documentElement.classList.toggle("reduced-motion", value);
}
export function isMotionReduced(): boolean {
  return motionReduced;
}

export function confettiBurst(container: HTMLElement, count = 36): void {
  if (motionReduced) return;
  for (let i = 0; i < count; i += 1) {
    const piece = el("div", { className: "confetti-piece" });
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = "-3%";
    piece.style.background =
      CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#FFD35C";
    piece.style.setProperty("--fall-ms", `${1300 + Math.random() * 1400}ms`);
    piece.style.setProperty(
      "--spin",
      `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
    );
    piece.style.animationDelay = `${Math.random() * 350}ms`;
    if (i % 3 === 0) piece.style.borderRadius = "50%";
    container.append(piece);
    setTimeout(() => piece.remove(), 3400);
  }
}

export function sparklesAt(
  container: HTMLElement,
  x: number,
  y: number,
  count = 8,
): void {
  if (motionReduced) return;
  for (let i = 0; i < count; i += 1) {
    const star = svgEl(
      `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 0 L14.5 9 L24 12 L14.5 15 L12 24 L9.5 15 L0 12 L9.5 9 Z" fill="#FFD35C"/></svg>`,
    );
    star.classList.add("sparkle");
    const angle = (i / count) * Math.PI * 2;
    star.style.left = `${x + Math.cos(angle) * 46 - 13}px`;
    star.style.top = `${y + Math.sin(angle) * 46 - 13}px`;
    star.style.animationDelay = `${i * 45}ms`;
    container.append(star);
    setTimeout(() => star.remove(), 1300);
  }
}

export async function praise(
  container: HTMLElement,
  opts: { text?: string; voice?: boolean; win?: boolean } = {},
): Promise<void> {
  const text =
    opts.text ??
    (opts.win
      ? "Ai găsit soluția din prima!"
      : "Ai continuat cu răbdare și ai reușit!");
  const cueId = opts.win ? "praise-first-try" : "praise-persistence";
  const overlay = el("div", { className: "praise-overlay" });
  overlay.append(el("div", { className: "praise-text" }, text));
  container.append(overlay);
  if (opts.win) sfxWin();
  else sfxSuccess();

  await Promise.all([
    opts.voice === false
      ? Promise.resolve()
      : speakCueAndWait(cueId, text, { rate: 1 }),
    wait(motionReduced ? 500 : 1500),
  ]);
  overlay.remove();
}

export function gentleNo(card?: HTMLElement | null): void {
  sfxGentleNo();
  if (card) {
    card.classList.remove("gentle-no");
    void card.offsetWidth;
    card.classList.add("gentle-no");
    setTimeout(() => card.classList.remove("gentle-no"), 500);
  }
}

export function markCorrect(card: HTMLElement): void {
  card.classList.add("correct-flash");
  const rect = card.getBoundingClientRect();
  const parent =
    card.offsetParent instanceof HTMLElement
      ? card.offsetParent
      : card.parentElement;
  if (parent) {
    const parentRect = parent.getBoundingClientRect();
    sparklesAt(
      parent,
      rect.left - parentRect.left + rect.width / 2,
      rect.top - parentRect.top + rect.height / 2,
    );
  }
}

export function showHintGlow(card: HTMLElement): void {
  sfxHint();
  card.classList.add("hint-glow");
  setTimeout(() => card.classList.remove("hint-glow"), 2700);
}

export function jelly(node: HTMLElement): void {
  node.classList.remove("lll-jelly");
  void node.offsetWidth;
  node.classList.add("lll-jelly");
  setTimeout(() => node.classList.remove("lll-jelly"), 620);
}

export function particlesAt(
  container: HTMLElement,
  x: number,
  y: number,
  opts: { count?: number; hearts?: boolean } = {},
): void {
  if (motionReduced) return;
  const count = opts.count ?? 7;
  const colors = ["#FFD35C", "#FF9EC6", "#7FC86B", "#4FA8E8", "#9B8CF2"];
  for (let i = 0; i < count; i += 1) {
    const p = opts.hearts
      ? svgEl(
          `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21 C4 14 1 9 1 6 C1 2.5 4 1 6.5 1 C8.5 1 10.5 2.5 12 5 C13.5 2.5 15.5 1 17.5 1 C20 1 23 2.5 23 6 C23 9 20 14 12 21 Z" fill="${colors[i % colors.length]}"/></svg>`,
        )
      : el("div", {});
    if (!opts.hearts) {
      const size = 8 + Math.random() * 8;
      p.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${colors[i % colors.length]};`;
    }
    p.classList.add("lll-particle");
    const angle =
      (i / count) * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const dist = 30 + Math.random() * 50;
    p.style.left = `${x + Math.cos(angle) * dist - 10}px`;
    p.style.top = `${y + Math.sin(angle) * dist * 0.4 - 10}px`;
    p.style.animationDelay = `${i * 40}ms`;
    container.append(p);
    setTimeout(() => p.remove(), 1500);
  }
}

export function danceItem(node: HTMLElement): void {
  node.classList.remove("lll-dance");
  void node.offsetWidth;
  node.classList.add("lll-dance");
  setTimeout(() => node.classList.remove("lll-dance"), 1700);
}

export function demoHand(): HTMLElement {
  const hand = svgEl(`
    <svg viewBox="0 0 80 80" width="72" height="72">
      <path d="M40 8 Q46 8 46 16 L46 34 L52 30 Q58 27 60 33 L66 42 Q70 48 66 56 Q60 70 44 70 Q30 70 24 58 L16 42 Q13 36 19 34 Q24 32 27 38 L32 46 L32 16 Q32 8 40 8 Z"
        fill="#FFFDF7" stroke="#4A3F35" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`);
  hand.classList.add("demo-hand");
  hand.style.opacity = "0";
  return hand;
}

export async function demoTap(
  container: HTMLElement,
  target: HTMLElement,
  opts: { holdMs?: number } = {},
): Promise<void> {
  if (motionReduced) return;
  const hand = container.querySelector<HTMLElement>(".demo-hand") ?? demoHand();
  if (!hand.parentElement) container.append(hand);
  const cRect = container.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  hand.style.left = `${tRect.left - cRect.left + tRect.width / 2 - 24}px`;
  hand.style.top = `${tRect.top - cRect.top + tRect.height / 2 - 10}px`;
  hand.style.opacity = "1";
  hand.classList.add("tapping");
  await wait(demonstrationDelay(opts.holdMs ?? 1100));
  hand.classList.remove("tapping");
}
