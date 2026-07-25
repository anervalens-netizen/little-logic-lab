import { ageBandForMonths, type AgeBandId, type DifficultyVector } from "@core";
import gameCatalogJson from "../../../../content/game-catalog.json";
import levelLaddersJson from "../../../../content/level-ladders.json";

interface CatalogGame {
  readonly id: string;
  readonly minAgeMonths: number;
  readonly maxAgeMonths: number;
  readonly entryBand: AgeBandId;
  readonly implementationPriority: "P0" | "P1" | "P2" | "P3";
}

interface CatalogData {
  readonly version: string;
  readonly games: readonly CatalogGame[];
}

interface LadderStage {
  readonly id: string;
  readonly recommendedBand: AgeBandId;
  readonly difficulty: DifficultyVector;
}

interface Ladder {
  readonly gameId: string;
  readonly stages: readonly LadderStage[];
}

interface LaddersData {
  readonly version: string;
  readonly ladders: readonly Ladder[];
}

const catalog = gameCatalogJson as unknown as CatalogData;
const ladderCatalog = levelLaddersJson as unknown as LaddersData;
const gamesById = new Map(catalog.games.map((game) => [game.id, game]));
const laddersByGameId = new Map(
  ladderCatalog.ladders.map((ladder) => [ladder.gameId, ladder]),
);

export const CONTENT_VERSION = `${catalog.version}:${ladderCatalog.version}`;

export function isGameAgeEligible(gameId: string, ageMonths: number): boolean {
  const game = gamesById.get(gameId);
  return (
    game !== undefined &&
    game.implementationPriority === "P0" &&
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
