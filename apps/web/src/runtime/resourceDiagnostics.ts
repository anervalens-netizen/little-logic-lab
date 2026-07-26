/** Contoare live, fără dependențe, pentru resursele care trebuie eliberate. */

let activeAudioTones = 0;
let activeVoiceElements = 0;
let activeSvgTextureReferences = 0;
let svgTextureCacheEntries = 0;
let maxIdleSvgTextureEntries = 0;

function once(release: () => void): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    release();
  };
}

export function beginAudioTone(): () => void {
  activeAudioTones += 1;
  return once(() => {
    activeAudioTones = Math.max(0, activeAudioTones - 1);
  });
}

export function setActiveVoiceElements(count: number): void {
  activeVoiceElements = Math.max(0, count);
}

export function beginSvgTextureReference(): () => void {
  activeSvgTextureReferences += 1;
  return once(() => {
    activeSvgTextureReferences = Math.max(
      0,
      activeSvgTextureReferences - 1,
    );
  });
}

export function setSvgTextureCacheState(
  entries: number,
  maxIdleEntries: number,
): void {
  svgTextureCacheEntries = Math.max(0, entries);
  maxIdleSvgTextureEntries = Math.max(0, maxIdleEntries);
}

export function resourceDiagnostics(): {
  readonly activeAudioTones: number;
  readonly activeVoiceElements: number;
  readonly activeSvgTextureReferences: number;
  readonly svgTextureCacheEntries: number;
  readonly maxIdleSvgTextureEntries: number;
} {
  return {
    activeAudioTones,
    activeVoiceElements,
    activeSvgTextureReferences,
    svgTextureCacheEntries,
    maxIdleSvgTextureEntries,
  };
}
