/**
 * Voce sintetizată în română (Web Speech API).
 * Dacă nu există voce de română, folosim vocea implicită cu rată încetinită;
 * instrucțiunile au oricum și demonstrație vizuală — cititul nu e niciodată necesar.
 */

let voiceEnabled = true;
let cachedVoice: SpeechSynthesisVoice | null | undefined;

export function setVoiceEnabled(value: boolean): void {
  voiceEnabled = value;
  if (!value) stopSpeaking();
}

export function voiceAvailable(): boolean {
  return "speechSynthesis" in window;
}

function pickRomanianVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (!voiceAvailable()) {
    cachedVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith("ro")) ??
    voices.find((v) => v.lang.toLowerCase().includes("ro")) ??
    null;
  return cachedVoice;
}

if (voiceAvailable()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
  };
}

export interface SpeakOptions {
  readonly rate?: number;
  readonly pitch?: number;
  readonly onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!voiceEnabled || !voiceAvailable()) {
    options.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickRomanianVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "ro-RO";
  }
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.15;
  utterance.volume = 1;
  if (options.onEnd) {
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (voiceAvailable()) window.speechSynthesis.cancel();
}
