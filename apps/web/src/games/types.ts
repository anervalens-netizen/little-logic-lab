/** Contractul unui joc web + contextul pe care îl primește de la motor. */

import type { DifficultyAxisSpec, DifficultyVector, AttemptOutcome } from "@core";

export interface PlayResult extends AttemptOutcome {}

export interface GameContext {
  /** Zona centrală de joc. */
  readonly mount: HTMLElement;
  /** Întregul ecran (overlay-uri, confetti). */
  readonly shell: HTMLElement;
  /** Rostește un text (ro-RO) dacă vocea e activă. */
  readonly speak: (text: string, opts?: { rate?: number }) => void;
  /** Oprește vocea. */
  readonly hush: () => void;
  readonly reducedMotion: boolean;
  /** Mânuță demonstrativă peste un element. */
  readonly demonstrate: (target: HTMLElement) => Promise<void>;
  /** Semnal de așteptare: true dacă jocul a fost întrerupt (ieșire din ecran). */
  readonly isCancelled: () => boolean;
}

export interface WebGame {
  readonly id: string;
  readonly title: string;
  readonly skillId: string;
  readonly domain: string;
  /** Instrucțiunea rostită la început de nivel. */
  readonly instruction: string;
  /** Întrebare/activitate de co-play pentru final (transfer în lumea reală). */
  readonly coPlayPrompt: string;
  /** Pictograma din bulă, pe ecranul principal. */
  readonly icon: () => string;
  readonly bubbleColor: string;
  /** Axe de dificultate, în ordinea în care se pot modifica (câte una). */
  readonly axes: readonly DifficultyAxisSpec[];
  /** Dificultatea de pornire (banda 30–36 luni, conservatoare). */
  readonly initialDifficulty: DifficultyVector;
  /** Jocurile hibride/deschise nu se punctează și nu influențează mastery. */
  readonly scored: boolean;
  /**
   * Rulează UN nivel complet: demonstrează, lasă copilul să joace,
   * aplică politica de suport și rezolvă cu rezultatul.
   */
  play(ctx: GameContext, difficulty: DifficultyVector, seed: string): Promise<PlayResult>;
}
