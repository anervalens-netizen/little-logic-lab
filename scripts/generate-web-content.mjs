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
const release = JSON.parse(
  fs.readFileSync(path.join(root, "content/p0-release.json"), "utf8"),
);
const gameMetadataPack = JSON.parse(
  fs.readFileSync(path.join(root, "content/p0-game-metadata.json"), "utf8"),
);
const itemPack = JSON.parse(
  fs.readFileSync(path.join(root, "content/themes/p0-items.json"), "utf8"),
);

const p0Ids = new Set(
  catalog.games
    .filter((game) => game.implementationPriority === "P0")
    .map((game) => game.id),
);
const releaseIds = release.gameIds ?? [];
const releaseIdSet = new Set(releaseIds);
if (releaseIds.length !== releaseIdSet.size) {
  throw new Error("content/p0-release.json contains duplicate game IDs.");
}
const missing = [...p0Ids].filter((id) => !releaseIdSet.has(id));
const unknown = releaseIds.filter((id) => !p0Ids.has(id));
if (missing.length > 0 || unknown.length > 0) {
  throw new Error(
    `P0 release mismatch. Missing: ${missing.join(", ") || "none"}; unknown: ${
      unknown.join(", ") || "none"
    }.`,
  );
}

const metadataIds = gameMetadataPack.games.map((game) => game.id);
const metadataIdSet = new Set(metadataIds);
const metadataMissing = releaseIds.filter((id) => !metadataIdSet.has(id));
const metadataUnknown = metadataIds.filter((id) => !releaseIdSet.has(id));
if (
  metadataIds.length !== metadataIdSet.size ||
  metadataMissing.length > 0 ||
  metadataUnknown.length > 0
) {
  throw new Error(
    `P0 metadata mismatch. Missing: ${metadataMissing.join(", ") || "none"}; unknown: ${
      metadataUnknown.join(", ") || "none"
    }.`,
  );
}

const gamesById = new Map(catalog.games.map((game) => [game.id, game]));
const metadataById = new Map(
  gameMetadataPack.games.map((game) => [game.id, game]),
);
const laddersById = new Map(
  ladders.ladders.map((ladder) => [ladder.gameId, ladder]),
);
const camelCase = (id) =>
  id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());

const registrations = releaseIds.map((id) => {
  const symbol = `${camelCase(id)}Game`;
  const moduleName = camelCase(id);
  const sourcePath = path.join(
    root,
    "apps/web/src/games",
    `${moduleName}.ts`,
  );
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`${id}: missing implementation ${sourcePath}`);
  }
  const source = fs.readFileSync(sourcePath, "utf8");
  if (!source.includes(`export const ${symbol}`)) {
    throw new Error(`${id}: missing exported implementation ${symbol}`);
  }
  return { id, moduleName, symbol };
});

const manifest = {
  version: `${catalog.version}:${ladders.version}`,
  games: releaseIds
    .map((id) => gamesById.get(id))
    .map((game) => ({
      id: game.id,
      minAgeMonths: game.minAgeMonths,
      maxAgeMonths: game.maxAgeMonths,
    })),
  ladders: releaseIds
    .map((id) => laddersById.get(id))
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

const registryOutput = path.join(
  root,
  "apps/web/src/generated/game-registry.ts",
);
const idsLiteral = JSON.stringify(releaseIds, null, 2);
const loadersLiteral = registrations
  .map(
    ({ id, moduleName, symbol }) =>
      `  ${JSON.stringify(id)}: () => import("../games/${moduleName}").then(({ ${symbol} }) => ${symbol}),`,
  )
  .join("\n");
const registry = `/** Generat din catalog + p0-release; nu edita manual. */

import type { WebGame } from "../games/types";

export const GAME_IDS = ${idsLiteral} as const;
export type GameId = (typeof GAME_IDS)[number];

type GameLoader = () => Promise<WebGame>;

const LOADERS = {
${loadersLiteral}
} satisfies Record<GameId, GameLoader>;

const cache = new Map<GameId, Promise<WebGame>>();

export function isGameId(id: string): id is GameId {
  return Object.hasOwn(LOADERS, id);
}

export async function loadGame(id: string): Promise<WebGame | undefined> {
  if (!isGameId(id)) return undefined;
  const cached = cache.get(id);
  if (cached) return cached;

  const pending = LOADERS[id]()
    .then((game) => {
      if (game.id !== id) {
        throw new Error(\`Loaded game \${game.id} for registry key \${id}.\`);
      }
      return game;
    })
    .catch((error: unknown) => {
      cache.delete(id);
      throw error;
    });
  cache.set(id, pending);
  return pending;
}

export async function loadGames(
  ids: readonly string[],
): Promise<readonly WebGame[]> {
  const games = await Promise.all(ids.map((id) => loadGame(id)));
  return games.filter((game): game is WebGame => game !== undefined);
}

export function loadAllGames(): Promise<readonly WebGame[]> {
  return loadGames(GAME_IDS);
}
`;
fs.writeFileSync(registryOutput, registry);

const metadata = releaseIds.map((id) => metadataById.get(id));
const metadataOutput = path.join(
  root,
  "apps/web/src/generated/game-metadata.ts",
);
const metadataManifest = `/** Generat din content/p0-game-metadata.json; nu edita manual. */

export const GAME_METADATA = ${JSON.stringify(metadata, null, 2)} as const;

export type GameMetadata = (typeof GAME_METADATA)[number];
export type MetadataGameId = GameMetadata["id"];

const BY_ID = new Map(GAME_METADATA.map((game) => [game.id, game]));

export function gameMetadata(id: string): GameMetadata | undefined {
  return BY_ID.get(id as MetadataGameId);
}
`;
fs.writeFileSync(metadataOutput, metadataManifest);

const itemMetadata = itemPack.items.map(
  ({ id, assetKey, label, labelDef, category, defaultColor, recolorable }) => ({
    id,
    assetKey,
    label,
    labelDef,
    category,
    defaultColor,
    recolorable,
  }),
);
const itemManifestOutput = path.join(
  root,
  "apps/web/src/generated/item-manifest.ts",
);
const itemManifest = `/** Generat din content/themes/p0-items.json; nu edita manual. */

export const ITEM_PACK = ${JSON.stringify(
  {
    id: itemPack.id,
    version: itemPack.version,
    renderer: itemPack.renderer,
  },
  null,
  2,
)} as const;

export const ITEM_METADATA = ${JSON.stringify(itemMetadata, null, 2)} as const;

export type ItemMetadata = (typeof ITEM_METADATA)[number];
export type ItemId = ItemMetadata["id"];
export type ItemCategory = ItemMetadata["category"];
`;
fs.writeFileSync(itemManifestOutput, itemManifest);
console.log(
  `Generated compact web manifest, lazy registry, ${metadata.length}-game metadata and ${itemMetadata.length}-item art manifest.`,
);
