/** Voce RO locală, versionată, bufferizată și disponibilă offline. */

import manifest from "./ro-RO-v1.json";
import { setActiveVoiceElements } from "../runtime/resourceDiagnostics";
import { playAudio, preloadAudio, stopAudioPlayback } from "./playback";

let voiceEnabled = true;
let speechGeneration = 0;

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

const clipByText = new Map(
  [...manifest.prompts, ...familyPrompts].map((prompt) => [
    prompt.text,
    `/audio/${manifest.version}/${prompt.id}.mp3`,
  ]),
);

function markSpeechState(state: "idle" | "loading" | "playing"): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.speechState = state;
  }
}

export function setVoiceEnabled(value: boolean): void {
  voiceEnabled = value;
  if (!value) stopSpeaking();
}

export function voiceAvailable(): boolean {
  if (typeof window === "undefined" || clipByText.size === 0) return false;
  return Boolean(
    window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext,
  );
}

export interface SpeakOptions {
  readonly rate?: number;
  readonly pitch?: number;
  readonly onStart?: () => void;
  readonly onEnd?: () => void;
}

/** Pregătește instrucțiunile apropiate pentru pornire fără latență. */
export async function preloadSpeech(texts: readonly string[]): Promise<void> {
  if (!voiceEnabled || !voiceAvailable()) return;
  const urls = texts
    .map((text) => clipByText.get(text))
    .filter((url): url is string => url !== undefined);
  await preloadAudio(urls);
}

/**
 * Redă și așteaptă durata reală a clipului. O replică nouă întrerupe replica
 * anterioară fără ca vechiul callback să poată avansa jocul.
 */
export async function speakAndWait(
  text: string,
  options: SpeakOptions = {},
): Promise<void> {
  const generation = ++speechGeneration;
  stopAudioPlayback();
  setActiveVoiceElements(0);

  if (!voiceEnabled || !voiceAvailable()) {
    markSpeechState("idle");
    options.onEnd?.();
    return;
  }

  const source = clipByText.get(text);
  if (!source) {
    // Instrucțiunea vizuală rămâne autoritară; nu apelăm servicii remote.
    markSpeechState("idle");
    options.onEnd?.();
    return;
  }

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
  markSpeechState("idle");
  options.onEnd?.();
}

/** Compatibilitate pentru feedback care nu trebuie să blocheze fluxul. */
export function speak(text: string, options: SpeakOptions = {}): void {
  void speakAndWait(text, options);
}

export function stopSpeaking(): void {
  speechGeneration += 1;
  stopAudioPlayback();
  setActiveVoiceElements(0);
  markSpeechState("idle");
}
