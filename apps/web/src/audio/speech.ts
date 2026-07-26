/** Voce RO locală, versionată și disponibilă offline. */

import manifest from "./ro-RO-v1.json";
import { setActiveVoiceElements } from "../runtime/resourceDiagnostics";

let voiceEnabled = true;
let activeAudio: HTMLAudioElement | null = null;

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

export function setVoiceEnabled(value: boolean): void {
  voiceEnabled = value;
  if (!value) stopSpeaking();
}

export function voiceAvailable(): boolean {
  return typeof Audio !== "undefined" && clipByText.size > 0;
}

export interface SpeakOptions {
  readonly rate?: number;
  readonly pitch?: number;
  readonly onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  stopSpeaking();
  if (!voiceEnabled || !voiceAvailable()) {
    options.onEnd?.();
    return;
  }

  const source = clipByText.get(text);
  if (!source) {
    // Instrucțiunea vizuală rămâne autoritară; nu apelăm servicii remote.
    options.onEnd?.();
    return;
  }

  const audio = new Audio(source);
  activeAudio = audio;
  setActiveVoiceElements(1);
  audio.preload = "auto";
  audio.playbackRate = options.rate ?? 1;
  audio.preservesPitch = true;

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    if (activeAudio === audio) {
      activeAudio = null;
      setActiveVoiceElements(0);
    }
    options.onEnd?.();
  };
  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener("error", finish, { once: true });
  void audio.play().catch(finish);
}

export function stopSpeaking(): void {
  if (!activeAudio) return;
  activeAudio.pause();
  activeAudio.removeAttribute("src");
  activeAudio.load();
  activeAudio = null;
  setActiveVoiceElements(0);
}
