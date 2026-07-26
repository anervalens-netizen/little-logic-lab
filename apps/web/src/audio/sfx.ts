/**
 * Efecte sonore generate cu Web Audio — fără fișiere, complet offline.
 * Toate sunetele sunt blânde: atac moale, volum moderat, fără frecvene aspre.
 */

import { getAudioContext, getMaster } from "./audio";
import { beginAudioTone } from "../runtime/resourceDiagnostics";

function tone(
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  type: OscillatorType,
  volume: number,
  delayMs = 0,
): void {
  const ctx = getAudioContext();
  const master = getMaster();
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + durationMs / 1000);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(gain).connect(master);
  const releaseDiagnostic = beginAudioTone();
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    osc.disconnect();
    gain.disconnect();
    releaseDiagnostic();
  };
  osc.addEventListener("ended", release, { once: true });
  try {
    osc.start(t0);
    osc.stop(t0 + durationMs / 1000 + 0.05);
  } catch (error) {
    release();
    throw error;
  }
}

/** Atingere obișnuită — „pop" scurt și rotund. */
export function sfxTap(): void {
  tone(520, 700, 90, "sine", 0.16);
}

/** Selectare dintr-o tavă. */
export function sfxPick(): void {
  tone(440, 660, 110, "triangle", 0.14);
}

/** Plasare corectă într-un coș. */
export function sfxPlace(): void {
  tone(523, 523, 100, "sine", 0.16);
  tone(784, 784, 140, "sine", 0.13, 80);
}

/** Răspuns corect — arpegiu major cald (Do–Mi–Sol–Do). */
export function sfxSuccess(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => tone(freq, freq, 240, "sine", 0.15, i * 95));
  tone(261.63, 261.63, 420, "triangle", 0.06);
}

/** Câștig de nivel — melodie scurtă și veselă. */
export function sfxWin(): void {
  const melody: [number, number][] = [
    [523.25, 0],
    [587.33, 110],
    [659.25, 220],
    [783.99, 330],
    [1046.5, 470],
    [1046.5, 640],
  ];
  for (const [freq, delay] of melody) {
    tone(freq, freq, 230, "sine", 0.14, delay);
    tone(freq / 2, freq / 2, 260, "triangle", 0.05, delay);
  }
}

/** Greșeală — două tonuri joase, calme, fără caracter pedepsitor. */
export function sfxGentleNo(): void {
  tone(330, 294, 200, "sine", 0.09);
  tone(294, 262, 260, "sine", 0.08, 170);
}

/** Indiciu — scânteie. */
export function sfxHint(): void {
  tone(880, 1320, 160, "sine", 0.1);
  tone(1320, 1760, 200, "sine", 0.08, 110);
}

/** Tranziție — șuier moale. */
export function sfxWhoosh(): void {
  tone(300, 900, 240, "sine", 0.05);
}

/** Apariție carte. */
export function sfxPop(): void {
  tone(300, 520, 120, "triangle", 0.14);
}

/** Pop cu pitch variabil — pentru atingeri repetate (nu devine monoton). */
export function sfxPopPitch(): void {
  const base = 420 + Math.random() * 240;
  tone(base, base * 1.4, 80, "triangle", 0.12);
}

/** Elastic — obiectul sare înapoi („boing"). */
export function sfxBoing(): void {
  tone(300, 90, 240, "sine", 0.13);
  tone(190, 70, 200, "sine", 0.09, 120);
}

/** Plop moale — obiectul a ajuns în coș. */
export function sfxPlop(): void {
  tone(500, 220, 120, "sine", 0.14);
  tone(750, 340, 110, "sine", 0.08, 60);
}

/** Șuier de tragere (drag start). */
export function sfxSwipe(): void {
  tone(240, 560, 160, "sine", 0.05);
}

/** Semnal „START" pentru jocul de așteptare. */
export function sfxGo(): void {
  tone(659.25, 659.25, 130, "sine", 0.16);
  tone(987.77, 987.77, 240, "sine", 0.14, 110);
}

/** Aplauze finale de sesiune — acord deschis, cald. */
export function sfxSessionEnd(): void {
  const freqs = [392, 523.25, 659.25, 783.99];
  freqs.forEach((f, i) => tone(f, f, 600, "sine", 0.1, i * 60));
  tone(1046.5, 1046.5, 700, "sine", 0.09, 350);
}
