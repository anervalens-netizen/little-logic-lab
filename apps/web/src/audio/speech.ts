/** Voce RO locală, versionată, bufferizată și adresabilă prin ID stabil. */

import manifest from "./ro-RO-v1.json";
import { setActiveVoiceElements } from "../runtime/resourceDiagnostics";
import { setVoiceDucking } from "./audio";
import { playAudio, preloadAudio, stopAudioPlayback } from "./playback";

let voiceEnabled = true;
let speechGeneration = 0;
let speechActive = false;
const idleWaiters = new Set<() => void>();

function renderFamilyText(template: string, labelDef: string): string {
  const label = `${labelDef.charAt(0).toUpperCase()}${labelDef.slice(1)}`;
  return template
    .replaceAll("{labelDef}", labelDef)
    .replaceAll("{LabelDef}", label);
}

const familyPrompts = manifest.families.flatMap((family) =>
  family.items.flatMap((item) =>
    family.templates.map((template) => ({
      id: `${family.id}-${item.id}-${template.id}`,
      text: renderFamilyText(template.text, item.labelDef),
    })),
  ),
);

const prompts = [...manifest.prompts, ...familyPrompts];
const clipByText = new Map(
  prompts.map((prompt) => [
    prompt.text,
    `/audio/${manifest.version}/${prompt.id}.mp3`,
  ]),
);
const clipById = new Map(
  prompts.map((prompt) => [
    prompt.id,
    `/audio/${manifest.version}/${prompt.id}.mp3`,
  ]),
);
const textById = new Map(prompts.map((prompt) => [prompt.id, prompt.text]));

export type SpeechCueId = string;

function markSpeechState(state: "idle" | "loading" | "playing"): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.speechState = state;
  }
}

function setGameInputBlocked(blocked: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.speechBlocksInput = String(blocked);
  for (const area of document.querySelectorAll<HTMLElement>(".game-play-area")) {
    area.toggleAttribute("inert", blocked);
    area.setAttribute("aria-busy", String(blocked));
  }
}

function setSpeechActive(value: boolean, blockInput = true): void {
  speechActive = value;
  setVoiceDucking(value);
  setGameInputBlocked(value && blockInput);
  if (value) return;
  for (const resolve of idleWaiters) resolve();
  idleWaiters.clear();
}

export function waitForSpeechIdle(): Promise<void> {
  if (!speechActive) return Promise.resolve();
  return new Promise<void>((resolve) => idleWaiters.add(resolve));
}

export async function waitForSpeechBoundary(minimumMs = 0): Promise<void> {
  await Promise.all([
    waitForSpeechIdle(),
    new Promise<void>((resolve) => window.setTimeout(resolve, minimumMs)),
  ]);
}

export function setVoiceEnabled(value: boolean): void {
  voiceEnabled = value;
  if (!value) stopSpeaking();
}

export function voiceAvailable(): boolean {
  if (typeof window === "undefined" || clipById.size === 0) return false;
  return Boolean(
    window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext,
  );
}

export interface SpeakOptions {
  readonly rate?: number;
  readonly pitch?: number;
  readonly blockInput?: boolean;
  readonly onStart?: () => void;
  readonly onEnd?: () => void;
}

export function speechCueText(cueId: SpeechCueId): string | undefined {
  return textById.get(cueId);
}

export function speechCueAvailable(cueId: SpeechCueId): boolean {
  return clipById.has(cueId);
}

export async function preloadSpeech(texts: readonly string[]): Promise<void> {
  if (!voiceEnabled || !voiceAvailable()) return;
  const urls = texts
    .map((text) => clipByText.get(text))
    .filter((url): url is string => url !== undefined);
  await preloadAudio(urls);
}

export async function preloadSpeechCues(
  cueIds: readonly SpeechCueId[],
): Promise<void> {
  if (!voiceEnabled || !voiceAvailable()) return;
  const urls = cueIds
    .map((cueId) => clipById.get(cueId))
    .filter((url): url is string => url !== undefined);
  await preloadAudio(urls);
}

async function playResolvedSource(
  source: string | undefined,
  options: SpeakOptions,
): Promise<void> {
  const generation = ++speechGeneration;
  stopAudioPlayback();
  setActiveVoiceElements(0);

  if (!voiceEnabled || !voiceAvailable() || !source) {
    setSpeechActive(false);
    markSpeechState("idle");
    options.onEnd?.();
    return;
  }

  setSpeechActive(true, options.blockInput !== false);
  markSpeechState("loading");
  setActiveVoiceElements(1);
  await playAudio(source, {
    playbackRate: options.rate ?? 1,
    onStart: () => {
      if (generation !== speechGeneration) return;
      markSpeechState("playing");
      options.onStart?.();
    },
  });

  if (generation !== speechGeneration) return;
  setActiveVoiceElements(0);
  setSpeechActive(false);
  markSpeechState("idle");
  options.onEnd?.();
}

/** Compatibilitate pentru conținutul vechi identificat încă prin text. */
export function speakAndWait(
  text: string,
  options: SpeakOptions = {},
): Promise<void> {
  return playResolvedSource(clipByText.get(text), options);
}

/**
 * Calea premium. fallbackText este numai pentru demonstrația vizuală/logging;
 * redarea nu caută din nou după text dacă ID-ul lipsește.
 */
export function speakCueAndWait(
  cueId: SpeechCueId,
  _fallbackText: string,
  options: SpeakOptions = {},
): Promise<void> {
  return playResolvedSource(clipById.get(cueId), options);
}

export function speak(
  text: string,
  options: SpeakOptions = {},
): Promise<void> {
  return speakAndWait(text, options);
}

export function speakCue(
  cueId: SpeechCueId,
  fallbackText: string,
  options: SpeakOptions = {},
): Promise<void> {
  return speakCueAndWait(cueId, fallbackText, options);
}

export function stopSpeaking(): void {
  speechGeneration += 1;
  stopAudioPlayback();
  setActiveVoiceElements(0);
  setSpeechActive(false);
  markSpeechState("idle");
}
