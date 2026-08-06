/** Contractul unui joc web + contextul pe care îl primește de la motor. */

import type {
  DifficultyAxisSpec,
  DifficultyVector,
  AttemptOutcome,
} from "@core";
import type { SpeechCueId } from "../audio/speech";

export interface PlayResult extends AttemptOutcome {}

export interface GameContext {
  readonly mount: HTMLElement;
  readonly shell: HTMLElement;
  /** Compatibilitate pentru conținutul identificat încă prin text. */
  readonly speak: (
    text: string,
    opts?: { readonly rate?: number; readonly blockInput?: boolean },
  ) => Promise<void>;
  /** Calea premium: clipul este rezolvat exclusiv prin ID stabil. */
  readonly speakCue: (
    cueId: SpeechCueId,
    fallbackText: string,
    opts?: { readonly rate?: number; readonly blockInput?: boolean },
  ) => Promise<void>;
  readonly hush: () => void;
  readonly reducedMotion: boolean;
  readonly demonstrate: (target: HTMLElement) => Promise<void>;
  readonly onCleanup: (cleanup: () => void) => void;
  readonly isCancelled: () => boolean;
}

export interface WebGame {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  readonly instruction: string;
  readonly instructionCueId?: SpeechCueId;
  readonly coPlayPrompt: string;
  readonly icon: () => string;
  readonly bubbleColor: string;
  readonly axes: readonly DifficultyAxisSpec[];
  readonly initialDifficulty: DifficultyVector;
  readonly scored: boolean;
  play(
    ctx: GameContext,
    difficulty: DifficultyVector,
    seed: string,
  ): Promise<PlayResult>;
}
