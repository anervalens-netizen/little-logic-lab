import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const catalogPath = path.join(root, "content", "game-catalog.json");
const presetsPath = path.join(root, "content", "archetype-presets.json");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
const laddersPath = path.join(root, "content", "level-ladders.json");
const laddersDoc = JSON.parse(fs.readFileSync(laddersPath, "utf8"));
const curriculumPath = path.join(root, "content", "curriculum-map.json");
const curriculumDoc = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
const itemPackPath = path.join(root, "content", "themes", "p0-items.json");
const itemPack = JSON.parse(fs.readFileSync(itemPackPath, "utf8"));

const errors = [];
const ids = new Set();
const validBands = new Set(["A30_36", "B36_48", "C48_60", "D60_72"]);
const validPriorities = new Set(["P0", "P1", "P2", "P3"]);
const validItemCategories = new Set(["animal", "vehicle", "food", "object", "nature"]);

for (const game of catalog.games ?? []) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id ?? "")) {
    errors.push(`Invalid game id: ${game.id}`);
  }
  if (ids.has(game.id)) errors.push(`Duplicate game id: ${game.id}`);
  ids.add(game.id);

  if (!game.title?.ro || !game.title?.en) errors.push(`${game.id}: missing localized title`);
  if (!validBands.has(game.entryBand)) errors.push(`${game.id}: invalid entryBand`);
  if (!validPriorities.has(game.implementationPriority)) errors.push(`${game.id}: invalid priority`);
  if (!Number.isInteger(game.minAgeMonths) || game.minAgeMonths < 24 || game.minAgeMonths > 72) {
    errors.push(`${game.id}: invalid minAgeMonths`);
  }
  if (game.maxAgeMonths < game.minAgeMonths) errors.push(`${game.id}: max age below min age`);
  if (!Array.isArray(game.difficultyAxes) || game.difficultyAxes.length < 2) {
    errors.push(`${game.id}: needs at least two difficulty axes`);
  }
  if (game.requiresReading !== false) errors.push(`${game.id}: child flow may not require reading`);
  if (game.requiresMicrophone !== false) errors.push(`${game.id}: microphone is prohibited`);
  if (game.requiresCamera !== false) errors.push(`${game.id}: camera is prohibited`);
  if (game.requiresNetwork !== false) errors.push(`${game.id}: child gameplay must be offline`);
  if (game.mode === "open_ended" && game.scored !== false) {
    errors.push(`${game.id}: open-ended activity must not be scored`);
  }
  if (!presets.bands?.[game.entryBand]) errors.push(`${game.id}: missing band preset`);
  for (const axis of game.difficultyAxes ?? []) {
    const band = presets.bands?.[game.entryBand];
    if (!band || !Object.hasOwn(band, axis)) {
      errors.push(`${game.id}: axis ${axis} missing from ${game.entryBand} preset`);
    }
  }
}

const templateDir = path.join(root, "content", "level-templates");
let p0ItemPackReferences = 0;
for (const file of fs.readdirSync(templateDir).filter((name) => name.endsWith(".json"))) {
  const template = JSON.parse(fs.readFileSync(path.join(templateDir, file), "utf8"));
  if (!ids.has(template.gameId)) errors.push(`${file}: unknown gameId ${template.gameId}`);
  if (template.contentPack === "sample-items") errors.push(`${file}: obsolete sample-items content pack`);
  if (template.contentPack === itemPack.id) p0ItemPackReferences += 1;
  if (!template.successRule?.kind) errors.push(`${file}: missing success rule`);
  if (template.frustrationPolicy?.endOnDistress !== true) {
    errors.push(`${file}: endOnDistress must be true`);
  }
}

if (itemPack.id !== "p0-items") errors.push("P0 item pack must use id p0-items.");
if (itemPack.renderer !== "procedural-svg") errors.push("P0 item pack must use the procedural-svg renderer.");
if (p0ItemPackReferences === 0) errors.push("No level template references the P0 item pack.");

const itemIds = new Set();
const assetKeys = new Set();
for (const item of itemPack.items ?? []) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id ?? "")) {
    errors.push(`P0 item pack: invalid item id ${item.id}`);
  }
  if (itemIds.has(item.id)) errors.push(`P0 item pack: duplicate item id ${item.id}`);
  itemIds.add(item.id);

  if (assetKeys.has(item.assetKey)) errors.push(`P0 item pack: duplicate asset key ${item.assetKey}`);
  assetKeys.add(item.assetKey);
  if (item.assetKey !== `procedural/items/${item.id}`) {
    errors.push(`P0 item pack: invalid asset key for ${item.id}`);
  }
  if (item.assetKey?.startsWith("placeholder/")) {
    errors.push(`P0 item pack: placeholder asset forbidden for ${item.id}`);
  }
  if (!item.label || !item.labelDef) errors.push(`P0 item pack: missing Romanian label for ${item.id}`);
  if (!validItemCategories.has(item.category)) {
    errors.push(`P0 item pack: invalid category for ${item.id}`);
  }
  if (!/^#[0-9A-F]{6}$/.test(item.defaultColor ?? "")) {
    errors.push(`P0 item pack: invalid default color for ${item.id}`);
  }
  if (typeof item.recolorable !== "boolean") {
    errors.push(`P0 item pack: missing recolorable flag for ${item.id}`);
  }
  if (!item.attributes?.color) errors.push(`P0 item pack: missing semantic color for ${item.id}`);
}
if (itemIds.size < 36) {
  errors.push(`P0 item pack must contain at least 36 production illustrations, found ${itemIds.size}.`);
}

if (catalog.games.length < 60) errors.push("Catalog should contain at least 60 game families.");

const gameById = new Map(catalog.games.map((game) => [game.id, game]));
const ladderIds = new Set();
let progressionAnchorCount = 0;

for (const ladder of laddersDoc.ladders ?? []) {
  if (ladderIds.has(ladder.gameId)) errors.push(`Duplicate ladder: ${ladder.gameId}`);
  ladderIds.add(ladder.gameId);
  const game = gameById.get(ladder.gameId);
  if (!game) {
    errors.push(`Unknown ladder gameId: ${ladder.gameId}`);
    continue;
  }
  if (!Array.isArray(ladder.stages) || ladder.stages.length === 0) {
    errors.push(`${ladder.gameId}: ladder has no stages`);
    continue;
  }
  progressionAnchorCount += ladder.stages.length;

  const first = ladder.stages[0];
  if (first.change !== null) errors.push(`${ladder.gameId}: first stage change must be null`);
  for (const axis of game.difficultyAxes) {
    if (!Object.hasOwn(first.difficulty ?? {}, axis)) {
      errors.push(`${ladder.gameId}: first stage missing axis ${axis}`);
    }
  }

  for (let index = 1; index < ladder.stages.length; index += 1) {
    const previous = ladder.stages[index - 1];
    const current = ladder.stages[index];
    const changedAxes = game.difficultyAxes.filter(
      (axis) => JSON.stringify(previous.difficulty[axis]) !== JSON.stringify(current.difficulty[axis]),
    );
    if (changedAxes.length !== 1) {
      errors.push(`${ladder.gameId}:${current.id}: expected one changed axis, got ${changedAxes.length}`);
    }
    if (current.change?.axis !== changedAxes[0]) {
      errors.push(`${ladder.gameId}:${current.id}: change metadata does not match difficulty vector`);
    }
  }
}

if (ladderIds.size !== catalog.games.length) {
  errors.push(`Expected ${catalog.games.length} ladders, found ${ladderIds.size}`);
}
if (progressionAnchorCount < 500) {
  errors.push(`Expected at least 500 progression anchors, found ${progressionAnchorCount}`);
}

if ((curriculumDoc.bands ?? []).length !== catalog.ageBands.length) {
  errors.push(`Curriculum map must contain ${catalog.ageBands.length} age bands.`);
}
for (const band of curriculumDoc.bands ?? []) {
  if (!validBands.has(band.id)) errors.push(`Curriculum map has invalid band ${band.id}`);
  for (const gameId of band.availableGameIds ?? []) {
    if (!ids.has(gameId)) errors.push(`Curriculum ${band.id}: unknown game ${gameId}`);
  }
  if (!Array.isArray(band.recommendedGameIds) || band.recommendedGameIds.length === 0) {
    errors.push(`Curriculum ${band.id}: no recommended games`);
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const byPriority = Object.groupBy(catalog.games, (game) => game.implementationPriority);
const byDomain = Object.groupBy(catalog.games, (game) => game.domain);
console.log(`Validated ${catalog.games.length} game families, ${ids.size} unique IDs and ${progressionAnchorCount} progression anchors.`);
console.log(`Validated ${itemIds.size} canonical procedural illustrations and ${p0ItemPackReferences} template references.`);
console.log("Priorities:", Object.fromEntries(Object.entries(byPriority).map(([key, value]) => [key, value.length])));
console.log("Domains:", Object.fromEntries(Object.entries(byDomain).map(([key, value]) => [key, value.length])));
