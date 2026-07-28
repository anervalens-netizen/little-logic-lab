import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(
    path.join(root, "apps/web/src/audio/ro-RO-v1.json"),
    "utf8",
  ),
);
const definitions = JSON.parse(
  await readFile(path.join(root, "content/audio-packs.json"), "utf8"),
);
const metadata = JSON.parse(
  await readFile(path.join(root, "content/p0-game-metadata.json"), "utf8"),
);

const familyCueIds = manifest.families.flatMap((family) =>
  family.items.flatMap((item) =>
    family.templates.map(
      (template) => `${family.id}-${item.id}-${template.id}`,
    ),
  ),
);
const allCueIds = [
  ...manifest.prompts.map((prompt) => prompt.id),
  ...familyCueIds,
];
const knownCueIds = new Set(allCueIds);
const knownGameIds = new Set(metadata.games.map((game) => game.id));
const packIds = new Set();
const assigned = new Map();
let remainingPackCount = 0;

for (const [packIndex, pack] of definitions.packs.entries()) {
  if (!pack.id || packIds.has(pack.id)) {
    throw new Error(`Audio pack ${packIndex}: id lipsă sau duplicat.`);
  }
  packIds.add(pack.id);
  if (!pack.title || !pack.description) {
    throw new Error(`Audio pack ${pack.id}: title/description obligatorii.`);
  }
  if (pack.includeRemaining === true) {
    remainingPackCount += 1;
    if (packIndex !== definitions.packs.length - 1) {
      throw new Error(`Audio pack ${pack.id}: includeRemaining trebuie să fie ultimul.`);
    }
  }
  for (const gameId of pack.gameIds ?? []) {
    if (!knownGameIds.has(gameId)) {
      throw new Error(`Audio pack ${pack.id}: joc necunoscut ${gameId}.`);
    }
  }
  for (const cueId of pack.includeIds ?? []) {
    if (!knownCueIds.has(cueId)) {
      throw new Error(`Audio pack ${pack.id}: cue necunoscut ${cueId}.`);
    }
  }
  for (const prefix of pack.includePrefixes ?? []) {
    if (!prefix || !allCueIds.some((cueId) => cueId.startsWith(prefix))) {
      throw new Error(`Audio pack ${pack.id}: prefix fără rezultate ${prefix}.`);
    }
  }

  const selected = new Set(pack.includeIds ?? []);
  for (const prefix of pack.includePrefixes ?? []) {
    for (const cueId of allCueIds) {
      if (cueId.startsWith(prefix)) selected.add(cueId);
    }
  }
  if (pack.includeRemaining === true) {
    for (const cueId of allCueIds) {
      if (!assigned.has(cueId)) selected.add(cueId);
    }
  }

  for (const cueId of selected) {
    const previous = assigned.get(cueId);
    if (previous) {
      throw new Error(
        `Cue ${cueId} este atribuit atât pachetului ${previous}, cât și ${pack.id}.`,
      );
    }
    assigned.set(cueId, pack.id);
  }

  if (pack.requiredAtStartup === true && selected.size === 0) {
    throw new Error(`Audio pack ${pack.id}: pachet startup gol.`);
  }
}

if (remainingPackCount !== 1) {
  throw new Error("Trebuie să existe exact un pachet includeRemaining.");
}

const unassigned = allCueIds.filter((cueId) => !assigned.has(cueId));
if (unassigned.length > 0) {
  throw new Error(`Cue-uri neatribuite: ${unassigned.slice(0, 20).join(", ")}`);
}

const startupPacks = definitions.packs.filter(
  (pack) => pack.requiredAtStartup === true,
);
if (startupPacks.length < 2) {
  throw new Error("Sunt necesare cel puțin core-shell și golden-journey la startup.");
}

const counts = Object.fromEntries(
  definitions.packs.map((pack) => [
    pack.id,
    [...assigned.values()].filter((packId) => packId === pack.id).length,
  ]),
);
console.log(
  `Audio packs valide: ${allCueIds.length} cue-uri, ${definitions.packs.length} pachete, distribuție ${JSON.stringify(counts)}.`,
);
