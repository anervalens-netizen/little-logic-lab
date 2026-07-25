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
  const difficultyEntries = Object.entries(difficulty);
  const eligible = ladder.stages.filter(
    (stage) =>
      bandRank(stage.recommendedBand) <= bandRank(ageBand) &&
      difficultyEntries.every(([axis, value]) => stage.difficulty[axis] === value),
  );

  return (
    eligible.at(-1)?.id ??
    ladder.stages.find((stage) => stage.recommendedBand === ageBand)?.id ??
    ladder.stages[0]?.id ??
    `${gameId}:unmapped`
  );
}

function bandRank(band: AgeBandId): number {
  return ["A30_36", "B36_48", "C48_60", "D60_72"].indexOf(band);
}
