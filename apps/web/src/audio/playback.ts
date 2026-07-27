/** Redare audio locală, bufferizată, cu lifecycle și final determinist. */

import { getAudioContext, getMaster } from "./audio";

export interface AudioPlaybackOptions {
  readonly playbackRate?: number;
  readonly onStart?: () => void;
}

interface ActivePlayback {
  readonly source: AudioBufferSourceNode;
  readonly settle: () => void;
}

const bufferByUrl = new Map<string, Promise<AudioBuffer>>();
let activePlayback: ActivePlayback | null = null;
let playbackGeneration = 0;

async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const cached = bufferByUrl.get(url);
  if (cached) return cached;

  const pending = (async () => {
    const context = getAudioContext();
    if (!context) throw new Error("Web Audio is unavailable");

    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Audio ${url} returned ${response.status}`);
    }
    return await context.decodeAudioData(await response.arrayBuffer());
  })().catch((error: unknown) => {
    bufferByUrl.delete(url);
    throw error;
  });

  bufferByUrl.set(url, pending);
  return pending;
}

function stopActivePlayback(): void {
  const current = activePlayback;
  activePlayback = null;
  if (!current) return;

  try {
    current.source.stop();
  } catch {
    // Sursa poate fi deja încheiată; settle rămâne idempotent.
  }
  current.settle();
}

/** Pregătește clipuri locale fără a bloca interfața dacă un asset este corupt. */
export async function preloadAudio(urls: readonly string[]): Promise<void> {
  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      try {
        await loadAudioBuffer(url);
      } catch {
        // Redarea păstrează fallback-ul vizual; validarea build-ului verifică asset-urile.
      }
    }),
  );
}

/**
 * Redă un singur clip și se rezolvă numai când clipul s-a terminat sau a fost oprit.
 * O redare nouă invalidează întotdeauna redarea anterioară.
 */
export async function playAudio(
  url: string,
  options: AudioPlaybackOptions = {},
): Promise<void> {
  const generation = ++playbackGeneration;
  stopActivePlayback();

  const context = getAudioContext();
  const master = getMaster();
  if (!context || !master) return;

  try {
    if (context.state === "suspended") await context.resume();
    const buffer = await loadAudioBuffer(url);
    if (generation !== playbackGeneration) return;

    await new Promise<void>((resolve) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = options.playbackRate ?? 1;
      source.connect(master);

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        if (activePlayback?.source === source) activePlayback = null;
        source.disconnect();
        resolve();
      };

      activePlayback = { source, settle };
      source.addEventListener("ended", settle, { once: true });
      try {
        source.start();
        options.onStart?.();
      } catch {
        settle();
      }
    });
  } catch {
    if (generation === playbackGeneration) stopActivePlayback();
  }
}

export function stopAudioPlayback(): void {
  playbackGeneration += 1;
  stopActivePlayback();
}
