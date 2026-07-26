/**
 * „Vocile" obiectelor — sunete sintetizate cu Web Audio, blânde și amuzante.
 * Animalele „vorbesc", vehiculele pornesc, mingea face boing.
 * Fără fișiere audio: totul e generat, complet offline.
 */

import { getAudioContext, getMaster } from "./audio";
import { beginAudioTone } from "../runtime/resourceDiagnostics";

interface Note {
  f0: number;
  f1?: number;
  dur: number; // ms
  at?: number; // delay ms
  type?: OscillatorType;
  vol?: number;
  vib?: number; // vibrato depth Hz
}

function play(notes: Note[]): void {
  const ctx = getAudioContext();
  const master = getMaster();
  if (!ctx || !master) return;
  for (const n of notes) {
    const t0 = ctx.currentTime + (n.at ?? 0) / 1000;
    const durS = n.dur / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(Math.max(1, n.f0), t0);
    if (n.f1 !== undefined && n.f1 !== n.f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, n.f1), t0 + durS);
    }
    if (n.vib) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.value = 9;
      lfoGain.gain.value = n.vib;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + durS);
    }
    const peak = n.vol ?? 0.12;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durS);
    osc.connect(gain).connect(master);
    const releaseDiagnostic = beginAudioTone();
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      osc.disconnect();
      gain.disconnect();
      lfo?.disconnect();
      lfoGain?.disconnect();
      releaseDiagnostic();
    };
    osc.addEventListener("ended", release, { once: true });
    try {
      osc.start(t0);
      osc.stop(t0 + durS + 0.05);
    } catch (error) {
      release();
      throw error;
    }
  }
}

let noiseBuffer: AudioBuffer | null = null;

function noise(durMs: number, vol: number, filterFreq: number, at = 0): void {
  const ctx = getAudioContext();
  const master = getMaster();
  if (!ctx || !master) return;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + at / 1000;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  src.connect(filter).connect(gain).connect(master);
  const releaseDiagnostic = beginAudioTone();
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    src.disconnect();
    filter.disconnect();
    gain.disconnect();
    releaseDiagnostic();
  };
  src.addEventListener("ended", release, { once: true });
  try {
    src.start(t0);
    src.stop(t0 + durMs / 1000 + 0.05);
  } catch (error) {
    release();
    throw error;
  }
}

/** Sunetul specific fiecărui item. Volum mic, caracter blând. */
const VOICES: Record<string, () => void> = {
  // --- animale ---
  cat: () => play([{ f0: 640, f1: 500, dur: 220, vib: 24, vol: 0.11 }, { f0: 520, f1: 760, dur: 260, at: 210, vib: 20, vol: 0.1 }]),
  dog: () => play([{ f0: 260, f1: 130, dur: 90, type: "sawtooth", vol: 0.09 }, { f0: 260, f1: 130, dur: 90, at: 150, type: "sawtooth", vol: 0.09 }]),
  rabbit: () => play([{ f0: 880, f1: 660, dur: 90, vol: 0.08 }, { f0: 880, f1: 660, dur: 90, at: 130, vol: 0.08 }]),
  duck: () => play([{ f0: 250, f1: 210, dur: 110, type: "square", vol: 0.055 }, { f0: 250, f1: 210, dur: 110, at: 160, type: "square", vol: 0.055 }]),
  fish: () => play([{ f0: 500, f1: 700, dur: 80, vol: 0.08 }, { f0: 650, f1: 880, dur: 80, at: 110, vol: 0.08 }, { f0: 800, f1: 1050, dur: 90, at: 220, vol: 0.08 }]),
  elephant: () => play([{ f0: 260, f1: 520, dur: 260, type: "sawtooth", vol: 0.06, vib: 30 }, { f0: 520, f1: 300, dur: 240, at: 250, type: "sawtooth", vol: 0.05, vib: 26 }]),
  frog: () => play([{ f0: 120, dur: 90, type: "square", vol: 0.07 }, { f0: 120, dur: 90, at: 140, type: "square", vol: 0.07 }, { f0: 130, dur: 110, at: 280, type: "square", vol: 0.07 }]),
  bear: () => play([{ f0: 170, f1: 120, dur: 320, type: "triangle", vol: 0.12, vib: 14 }]),
  bird: () => play([{ f0: 2300, f1: 3100, dur: 90, vol: 0.07 }, { f0: 2600, f1: 3400, dur: 90, at: 120, vol: 0.07 }, { f0: 2100, f1: 2900, dur: 130, at: 240, vol: 0.07 }]),
  butterfly: () => play([{ f0: 1050, f1: 1400, dur: 160, vol: 0.06 }, { f0: 1400, f1: 1050, dur: 180, at: 170, vol: 0.06 }]),
  bee: () => play([{ f0: 190, dur: 480, type: "sawtooth", vol: 0.05, vib: 34 }]),
  pig: () => play([{ f0: 380, f1: 170, dur: 90, type: "sawtooth", vol: 0.07 }, { f0: 380, f1: 170, dur: 90, at: 140, type: "sawtooth", vol: 0.07 }]),
  cow: () => play([{ f0: 160, f1: 120, dur: 560, vol: 0.12, vib: 18 }]),
  lion: () => play([{ f0: 140, f1: 90, dur: 480, type: "sawtooth", vol: 0.08, vib: 20 }]),
  mouse: () => play([{ f0: 1800, f1: 2500, dur: 80, vol: 0.06 }, { f0: 2000, f1: 2600, dur: 80, at: 110, vol: 0.06 }]),
  owl: () => play([{ f0: 430, f1: 380, dur: 200, vol: 0.1 }, { f0: 430, f1: 360, dur: 280, at: 260, vol: 0.1 }]),
  // --- vehicule ---
  car: () => play([{ f0: 90, f1: 190, dur: 480, type: "sawtooth", vol: 0.06 }]),
  bus: () => play([{ f0: 290, dur: 140, type: "square", vol: 0.06 }, { f0: 290, dur: 140, at: 200, type: "square", vol: 0.06 }]),
  train: () => play([{ f0: 660, f1: 880, dur: 240, vol: 0.09 }, { f0: 880, f1: 660, dur: 260, at: 250, vol: 0.09 }]),
  boat: () => play([{ f0: 220, f1: 180, dur: 420, type: "triangle", vol: 0.1 }]),
  plane: () => { noise(520, 0.045, 900); play([{ f0: 220, f1: 520, dur: 520, type: "sawtooth", vol: 0.03 }]); },
  rocket: () => play([{ f0: 200, f1: 950, dur: 620, type: "sawtooth", vol: 0.05 }]),
  // --- mâncare: „muf" ---
  apple: () => { noise(90, 0.06, 500); noise(90, 0.06, 500, 150); },
  banana: () => play([{ f0: 500, f1: 800, dur: 150, vol: 0.07 }, { f0: 800, f1: 500, dur: 150, at: 160, vol: 0.07 }]),
  cookie: () => { noise(80, 0.07, 700); noise(80, 0.07, 700, 130); noise(80, 0.06, 700, 260); },
  strawberry: () => play([{ f0: 700, f1: 1000, dur: 120, vol: 0.07 }, { f0: 1000, f1: 700, dur: 140, at: 130, vol: 0.07 }]),
  carrot: () => { noise(100, 0.06, 600); noise(90, 0.06, 600, 160); },
  cupcake: () => play([{ f0: 600, f1: 900, dur: 160, vol: 0.07 }, { f0: 900, f1: 1200, dur: 180, at: 170, vol: 0.06 }]),
  // --- obiecte & natură ---
  ball: () => play([{ f0: 320, f1: 90, dur: 220, vol: 0.12 }, { f0: 260, f1: 80, dur: 180, at: 200, vol: 0.08 }]),
  balloon: () => play([{ f0: 1100, f1: 1800, dur: 240, vol: 0.05, vib: 40 }]),
  flower: () => play([{ f0: 523, dur: 120, vol: 0.07 }, { f0: 659, dur: 120, at: 110, vol: 0.07 }, { f0: 784, dur: 180, at: 220, vol: 0.07 }]),
  tree: () => { noise(420, 0.035, 800); },
  house: () => play([{ f0: 660, f1: 660, dur: 160, vol: 0.09 }, { f0: 880, f1: 880, dur: 220, at: 160, vol: 0.08 }]),
  sun: () => play([{ f0: 523, dur: 140, vol: 0.08 }, { f0: 659, dur: 140, at: 120, vol: 0.08 }, { f0: 784, dur: 140, at: 240, vol: 0.08 }, { f0: 1046, dur: 240, at: 360, vol: 0.08 }]),
  moon: () => play([{ f0: 520, f1: 400, dur: 300, vol: 0.07 }, { f0: 400, f1: 320, dur: 360, at: 300, vol: 0.06 }]),
  cloud: () => { noise(300, 0.03, 500); },
};

/** Redă sunetul caracteristic unui item (sau un pop blând dacă nu are). */
export function playItemVoice(itemId: string): void {
  const base = itemId.split("--")[0] ?? itemId;
  const voice = VOICES[base];
  if (voice) voice();
}

/** Există voce pentru item? */
export function hasVoice(itemId: string): boolean {
  const base = itemId.split("--")[0] ?? itemId;
  return base in VOICES;
}
