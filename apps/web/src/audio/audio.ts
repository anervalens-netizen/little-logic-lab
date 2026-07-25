/** Context audio partajat; se deblochează la prima atingere (regula browserelor). */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setAudioEnabled(value: boolean): void {
  enabled = value;
  if (master) master.gain.value = value ? 1 : 0;
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
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function getMaster(): GainNode | null {
  getAudioContext();
  return master;
}
