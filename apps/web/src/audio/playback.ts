/** Redare audio locală, bufferizată, cu lifecycle și final determinist. */

import { getAudioContext, getVoiceBus } from "./audio";
import { findCurrentCachedAssetResponse } from "../app/contentPacks";

export interface AudioPlaybackOptions {
  readonly playbackRate?: number;
  readonly onStart?: () => void;
}

interface ActivePlayback {
  readonly source: AudioBufferSourceNode;
  readonly settle: () => void;
}

const MAX_DECODED_BUFFERS = 48;
const MAX_PRELOAD_CONCURRENCY = 3;
const AUDIO_FETCH_TIMEOUT_MS = 8_000;
const AUDIO_DECODE_TIMEOUT_MS = 8_000;
const PLAYBACK_END_GRACE_MS = 1_500;
const bufferByUrl = new Map<string, Promise<AudioBuffer>>();
let activePlayback: ActivePlayback | null = null;
let playbackGeneration = 0;

function rememberBuffer(
  url: string,
  buffer: Promise<AudioBuffer>,
): Promise<AudioBuffer> {
  bufferByUrl.delete(url);
  bufferByUrl.set(url, buffer);
  while (bufferByUrl.size > MAX_DECODED_BUFFERS) {
    const oldest = bufferByUrl.keys().next().value as string | undefined;
    if (!oldest || oldest === url) break;
    bufferByUrl.delete(oldest);
  }
  return buffer;
}

async function fetchLocalAudio(url: string): Promise<Response> {
  const pathname = new URL(url, window.location.origin).pathname;
  // Aceeași selecție de cache este folosită de gate-ul offline și de playback.
  // Un asset reparat poate fi redat în airplane mode, iar un cache vechi este exclus.
  const cached = await findCurrentCachedAssetResponse(pathname);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort("Local audio fetch timed out"),
    AUDIO_FETCH_TIMEOUT_MS,
  );
  try {
    const response = await fetch(url, {
      cache: "force-cache",
      credentials: "same-origin",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Audio ${url} returned ${response.status}`);
    }
    return response;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function decodeWithTimeout(
  context: AudioContext,
  bytes: ArrayBuffer,
): Promise<AudioBuffer> {
  let timeout = 0;
  try {
    return await Promise.race([
      context.decodeAudioData(bytes),
      new Promise<never>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error("Local audio decode timed out")),
          AUDIO_DECODE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const cached = bufferByUrl.get(url);
  if (cached) return await rememberBuffer(url, cached);

  const pending = (async () => {
    const context = getAudioContext();
    if (!context) throw new Error("Web Audio is unavailable");

    const response = await fetchLocalAudio(url);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0) throw new Error(`Audio ${url} is empty`);
    return await decodeWithTimeout(context, bytes);
  })().catch((error: unknown) => {
    bufferByUrl.delete(url);
    throw error;
  });

  return await rememberBuffer(url, pending);
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

/** Pregătește clipuri locale fără spike de decodare pe dispozitive mobile. */
export async function preloadAudio(urls: readonly string[]): Promise<void> {
  const uniqueUrls = [...new Set(urls)];
  let nextIndex = 0;
  const workerCount = Math.min(MAX_PRELOAD_CONCURRENCY, uniqueUrls.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < uniqueUrls.length) {
        const index = nextIndex;
        nextIndex += 1;
        const url = uniqueUrls[index];
        if (!url) continue;
        try {
          await loadAudioBuffer(url);
        } catch {
          // Redarea păstrează fallback-ul vizual; build-ul verifică asset-urile.
        }
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
  const voiceBus = getVoiceBus();
  if (!context || !voiceBus) return;

  try {
    if (context.state === "suspended") await context.resume();
    const buffer = await loadAudioBuffer(url);
    if (generation !== playbackGeneration) return;

    await new Promise<void>((resolve) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      const playbackRate = Math.max(0.5, Math.min(2, options.playbackRate ?? 1));
      source.playbackRate.value = playbackRate;
      source.connect(voiceBus);

      let settled = false;
      let watchdog = 0;
      const settle = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(watchdog);
        if (activePlayback?.source === source) activePlayback = null;
        source.disconnect();
        resolve();
      };

      activePlayback = { source, settle };
      source.addEventListener("ended", settle, { once: true });
      watchdog = window.setTimeout(() => {
        try {
          source.stop();
        } catch {
          // Sursa poate fi deja oprită; settle închide întotdeauna promisiunea.
        }
        settle();
      }, Math.ceil((buffer.duration / playbackRate) * 1_000) + PLAYBACK_END_GRACE_MS);

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

export function decodedAudioCacheSize(): number {
  return bufferByUrl.size;
}

export function stopAudioPlayback(): void {
  playbackGeneration += 1;
  stopActivePlayback();
}
