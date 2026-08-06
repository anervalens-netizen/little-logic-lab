/**
 * Muzică ambientală generativă, foarte discretă (oprită implicit).
 * Buclă de acorduri lente, tip „cutie de muzică”, generată cu Web Audio.
 */

import { getAudioContext, getMaster } from "./audio";
import { beginAudioTone } from "../runtime/resourceDiagnostics";

let timer: number | null = null;
let running = false;
let chordIndex = 0;
const activeNotes = new Map<
  OscillatorNode,
  { readonly gain: GainNode; readonly releaseDiagnostic: () => void }
>();

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0],
  [293.66, 349.23, 440.0],
  [329.63, 392.0, 493.88],
  [349.23, 440.0, 523.25],
];

function releaseNote(oscillator: OscillatorNode): void {
  const note = activeNotes.get(oscillator);
  if (!note) return;
  activeNotes.delete(oscillator);
  oscillator.disconnect();
  note.gain.disconnect();
  note.releaseDiagnostic();
}

function pluck(freq: number, when: number, volume: number): void {
  const ctx = getAudioContext();
  const master = getMaster();
  if (!ctx || !master || !running) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const releaseDiagnostic = beginAudioTone();
  activeNotes.set(osc, { gain, releaseDiagnostic });
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);
  osc.connect(gain).connect(master);
  osc.addEventListener("ended", () => releaseNote(osc), { once: true });
  try {
    osc.start(when);
    osc.stop(when + 2);
  } catch (error) {
    releaseNote(osc);
    throw error;
  }
}

function scheduleBar(): void {
  const ctx = getAudioContext();
  if (!ctx || !running) return;
  const chord = CHORDS[chordIndex % CHORDS.length] ?? CHORDS[0]!;
  chordIndex += 1;
  const t0 = ctx.currentTime + 0.05;
  chord.forEach((freq, index) => {
    pluck(freq, t0 + index * 0.35, 0.028);
    pluck(freq * 2, t0 + 1.2 + index * 0.3, 0.012);
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
    window.clearTimeout(timer);
    timer = null;
  }
  for (const oscillator of [...activeNotes.keys()]) {
    try {
      oscillator.stop();
    } catch {
      // Nota poate fi deja încheiată; releaseNote rămâne idempotent.
    }
    releaseNote(oscillator);
  }
}

export function musicRunning(): boolean {
  return running;
}
