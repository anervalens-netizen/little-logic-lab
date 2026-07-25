import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "content/game-catalog.json"), "utf8"),
);
const ladders = JSON.parse(
  fs.readFileSync(path.join(root, "content/level-ladders.json"), "utf8"),
);

const p0Ids = new Set(
  catalog.games
    .filter((game) => game.implementationPriority === "P0")
    .map((game) => game.id),
);

const manifest = {
  version: `${catalog.version}:${ladders.version}`,
  games: catalog.games
    .filter((game) => p0Ids.has(game.id))
    .map((game) => ({
      id: game.id,
      minAgeMonths: game.minAgeMonths,
      maxAgeMonths: game.maxAgeMonths,
    })),
  ladders: ladders.ladders
    .filter((ladder) => p0Ids.has(ladder.gameId))
    .map((ladder) => ({
      gameId: ladder.gameId,
      stages: ladder.stages.map((stage) => ({
        id: stage.id,
        recommendedBand: stage.recommendedBand,
        difficulty: stage.difficulty,
      })),
    })),
};

const output = path.join(
  root,
  "apps/web/src/generated/content-manifest.json",
);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest)}\n`);
console.log(
  `Generated compact web manifest for ${manifest.games.length} P0 games.`,
);
