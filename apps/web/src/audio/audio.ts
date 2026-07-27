/** Context audio partajat; se deblochează la prima atingere (regula browserelor). */

let ctx: AudioContext | null = null;
let output: GainNode | null = null;
let sfxBus: GainNode | null = null;
let voiceBus: GainNode | null = null;
let enabled = true;

export function setAudioEnabled(value: boolean): void {
  enabled = value;
  if (output) output.gain.value = value ? 1 : 0;
}

export function audioEnabled(): boolean {
  return enabled;
}

export function getAudioContext(): AudioContext | null {
  if (!enabled) return null;
  if (ctx === null) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    output = ctx.createGain();
    sfxBus = ctx.createGain();
    voiceBus = ctx.createGain();
    output.gain.value = 1;
    sfxBus.gain.value = 1;
    voiceBus.gain.value = 1;
    sfxBus.connect(output);
    voiceBus.connect(output);
    output.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Compatibilitate: efectele existente se conectează la magistrala SFX. */
export function getMaster(): GainNode | null {
  getAudioContext();
  return sfxBus;
}

export function getVoiceBus(): GainNode | null {
  getAudioContext();
  return voiceBus;
}

/** Reduce efectele cât timp vocea vorbește, fără a le opri complet. */
export function setVoiceDucking(active: boolean): void {
  const context = getAudioContext();
  const bus = getMaster();
  if (!context || !bus) return;
  const target = active ? 0.32 : 1;
  bus.gain.cancelScheduledValues(context.currentTime);
  bus.gain.setTargetAtTime(target, context.currentTime, active ? 0.025 : 0.08);
}
