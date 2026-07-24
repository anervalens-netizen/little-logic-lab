import type { AgeBandId, GameDefinition } from "./types.js";

export interface AgeBandRange {
  readonly id: AgeBandId;
  readonly minMonths: number;
  readonly maxMonths: number;
}

export const AGE_BAND_RANGES: readonly AgeBandRange[] = [
  { id: "A30_36", minMonths: 30, maxMonths: 35 },
  { id: "B36_48", minMonths: 36, maxMonths: 47 },
  { id: "C48_60", minMonths: 48, maxMonths: 59 },
  { id: "D60_72", minMonths: 60, maxMonths: 72 },
];

export function ageBandForMonths(ageMonths: number): AgeBandId {
  if (!Number.isFinite(ageMonths)) throw new Error("ageMonths must be finite.");
  const rounded = Math.floor(ageMonths);
  if (rounded <= 35) return "A30_36";
  if (rounded <= 47) return "B36_48";
  if (rounded <= 59) return "C48_60";
  return "D60_72";
}

export function isGameAgeEligible(
  game: Pick<GameDefinition, "minAgeMonths" | "maxAgeMonths">,
  ageMonths: number,
): boolean {
  return ageMonths >= game.minAgeMonths && ageMonths <= game.maxAgeMonths;
}

export interface InitialSessionSettings {
  readonly sessionMinutes: 3 | 5 | 7;
  readonly startingChoiceCount: 2 | 3 | 4;
  readonly targetSize: "large" | "extra_large";
  readonly reducedMotion: boolean;
  readonly musicEnabled: false;
}

export function initialSessionSettings(ageMonths: number): InitialSessionSettings {
  if (ageMonths < 36) {
    return {
      sessionMinutes: 5,
      startingChoiceCount: 2,
      targetSize: "extra_large",
      reducedMotion: true,
      musicEnabled: false,
    };
  }
  if (ageMonths < 48) {
    return {
      sessionMinutes: 5,
      startingChoiceCount: 3,
      targetSize: "large",
      reducedMotion: true,
      musicEnabled: false,
    };
  }
  return {
    sessionMinutes: 7,
    startingChoiceCount: 4,
    targetSize: "large",
    reducedMotion: false,
    musicEnabled: false,
  };
}
