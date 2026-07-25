import { ageBandForMonths, type AgeBandId, type DifficultyVector } from "@core";
import contentManifestJson from "../generated/content-manifest.json";

interface CatalogGame {
  readonly id: string;
  readonly minAgeMonths: number;
  readonly maxAgeMonths: number;
}

interface ContentManifest {
  readonly version: string;
  readonly games: readonly CatalogGame[];
  readonly ladders: readonly {
    readonly gameId: string;
    readonly stages: readonly {
      readonly id: string;
      readonly recommendedBand: AgeBandId;
      readonly difficulty: DifficultyVector;
    }[];
  }[];
}

const content = contentManifestJson as unknown as ContentManifest;
const gamesById = new Map(content.games.map((game) => [game.id, game]));
const laddersByGameId = new Map(
  content.ladders.map((ladder) => [ladder.gameId, ladder]),
);

export const CONTENT_VERSION = content.version;

export function isGameAgeEligible(gameId: string, ageMonths: number): boolean {
  const game = gamesById.get(gameId);
  return (
    game !== undefined &&
    ageMonths >= game.minAgeMonths &&
    ageMonths <= game.maxAgeMonths
  );
}

/**
 * Găsește ancora care corespunde vectorului efectiv al prototipului.
 * Până la migrarea completă, vectorul poate conține doar un subset de axe.
 */
export function ladderStageFor(
  gameId: string,
  ageMonths: number,
  difficulty: DifficultyVector,
): string {
  const ladder = laddersByGameId.get(gameId);
  if (!ladder) return `${gameId}:unmapped`;

  const ageBand = ageBandForMonths(ageMonths);
  const eligible = ladder.stages.filter(
    (stage) => bandRank(stage.recommendedBand) <= bandRank(ageBand),
  );
  const exact = eligible.find((stage) =>
    sameDifficulty(stage.difficulty, difficulty),
  );
  const compatible = eligible.find((stage) =>
    Object.entries(difficulty).every(
      ([axis, value]) => stage.difficulty[axis] === value,
    ),
  );
  return exact?.id ?? compatible?.id ?? eligible[0]?.id ?? `${gameId}:unmapped`;
}

/** Completează vectorii vechi/parțiali cu stage-ul conservator eligibil. */
export function normalizeLadderDifficulty(
  gameId: string,
  ageMonths: number,
  difficulty: DifficultyVector,
): DifficultyVector | null {
  const stages = eligibleLadderStages(gameId, ageMonths);
  if (stages.length === 0) return null;
  const exact = stages.find((stage) =>
    sameDifficulty(stage.difficulty, difficulty),
  );
  if (exact) return { ...exact.difficulty };
  const compatible = stages.find((stage) =>
    Object.entries(difficulty).every(
      ([axis, value]) => stage.difficulty[axis] === value,
    ),
  );
  return { ...(compatible ?? stages[0])!.difficulty };
}

/**
 * Avansează/reduce strict cu un stage eligibil. Ladder-ul generat garantează
 * schimbarea unei singure axe între două stage-uri consecutive.
 */
export function stepLadderDifficulty(
  gameId: string,
  ageMonths: number,
  difficulty: DifficultyVector,
  direction: -1 | 1,
): { readonly vector: DifficultyVector; readonly changed: boolean } | null {
  const stages = eligibleLadderStages(gameId, ageMonths);
  if (stages.length === 0) return null;
  const normalized =
    normalizeLadderDifficulty(gameId, ageMonths, difficulty) ??
    stages[0]!.difficulty;
  const currentIndex = Math.max(
    0,
    stages.findIndex((stage) =>
      sameDifficulty(stage.difficulty, normalized),
    ),
  );
  const nextIndex = Math.max(
    0,
    Math.min(stages.length - 1, currentIndex + direction),
  );
  return {
    vector: { ...stages[nextIndex]!.difficulty },
    changed: nextIndex !== currentIndex,
  };
}

function eligibleLadderStages(gameId: string, ageMonths: number) {
  const ladder = laddersByGameId.get(gameId);
  if (!ladder) return [];
  const ageBand = ageBandForMonths(ageMonths);
  return ladder.stages.filter(
    (stage) => bandRank(stage.recommendedBand) <= bandRank(ageBand),
  );
}

function sameDifficulty(
  left: DifficultyVector,
  right: DifficultyVector,
): boolean {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(([axis, value]) => right[axis] === value)
  );
}

function bandRank(band: AgeBandId): number {
  return ["A30_36", "B36_48", "C48_60", "D60_72"].indexOf(band);
}
