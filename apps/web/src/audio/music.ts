/**
 * Muzică ambientală generativă, foarte discretă (oprită implicit).
 * Buclă de acorduri lente, tip „cutie de muzică", generată cu Web Audio.
 */

import { getAudioContext, getMaster } from "./audio";

let timer: number | null = null;
let running = false;

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // Do
  [293.66, 349.23, 440.0], // Re minor
  [329.63, 392.0, 493.88], // Mi minor
  [349.23, 440.0, 523.25], // Fa
];

function pluck(freq: number, when: number, volume: number): void {
  const ctx = getAudioContext();
  const master = getMaster();
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);
  osc.connect(gain).connect(master);
  osc.start(when);
  osc.stop(when + 2);
}

let chordIndex = 0;

function scheduleBar(): void {
  const ctx = getAudioContext();
  if (!ctx || !running) return;
  const chord = CHORDS[chordIndex % CHORDS.length] ?? CHORDS[0]!;
  chordIndex += 1;
  const t0 = ctx.currentTime + 0.05;
  chord.forEach((freq, i) => {
    pluck(freq, t0 + i * 0.35, 0.028);
    pluck(freq * 2, t0 + 1.2 + i * 0.3, 0.012);
  });
  timer = window.setTimeout(scheduleBar, 2600);
}

export function startMusic(): void {
  if (running) return;
  running = true;
  scheduleBar();
}

export function stopMusic(): void {
  running = false;
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

export function musicRunning(): boolean {
  return running;
}
