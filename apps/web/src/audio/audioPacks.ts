/** Pachete audio locale, derivate determinist din manifest și reguli de produs. */

import speechManifest from "./ro-RO-v1.json";
import packDefinitionsJson from "../../../../content/audio-packs.json";

interface AudioPackDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requiredAtStartup: boolean;
  readonly gameIds: readonly string[];
  readonly includeIds: readonly string[];
  readonly includePrefixes: readonly string[];
  readonly includeRemaining?: boolean;
}

interface AudioPackDefinitions {
  readonly version: string;
  readonly packs: readonly AudioPackDefinition[];
}

export interface AudioPack {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requiredAtStartup: boolean;
  readonly gameIds: readonly string[];
  readonly cueIds: readonly string[];
  readonly assetPaths: readonly string[];
}

const definitions = packDefinitionsJson as AudioPackDefinitions;

const familyCueIds = speechManifest.families.flatMap((family) =>
  family.items.flatMap((item) =>
    family.templates.map(
      (template) => `${family.id}-${item.id}-${template.id}`,
    ),
  ),
);
const allCueIds = [
  ...speechManifest.prompts.map((prompt) => prompt.id),
  ...familyCueIds,
];
const knownCueIds = new Set(allCueIds);
const assignedCueIds = new Set<string>();

function cueIdsForDefinition(definition: AudioPackDefinition): string[] {
  const selected = new Set<string>();
  for (const cueId of definition.includeIds) {
    if (knownCueIds.has(cueId)) selected.add(cueId);
  }
  for (const prefix of definition.includePrefixes) {
    for (const cueId of allCueIds) {
      if (cueId.startsWith(prefix)) selected.add(cueId);
    }
  }
  if (definition.includeRemaining === true) {
    for (const cueId of allCueIds) {
      if (!assignedCueIds.has(cueId)) selected.add(cueId);
    }
  }

  const unique = [...selected].filter((cueId) => !assignedCueIds.has(cueId));
  unique.forEach((cueId) => assignedCueIds.add(cueId));
  return unique.sort((left, right) => left.localeCompare(right));
}

export const AUDIO_PACK_VERSION = definitions.version;

export const AUDIO_PACKS: readonly AudioPack[] = definitions.packs.map(
  (definition) => {
    const cueIds = cueIdsForDefinition(definition);
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      requiredAtStartup: definition.requiredAtStartup,
      gameIds: [...definition.gameIds],
      cueIds,
      assetPaths: cueIds.map(
        (cueId) => `/audio/${speechManifest.version}/${cueId}.mp3`,
      ),
    };
  },
);

export const REQUIRED_AUDIO_PACKS = AUDIO_PACKS.filter(
  (pack) => pack.requiredAtStartup,
);

export function requiredAudioAssetPaths(): readonly string[] {
  return REQUIRED_AUDIO_PACKS.flatMap((pack) => pack.assetPaths);
}

export function audioPackForGame(gameId: string): AudioPack | undefined {
  return AUDIO_PACKS.find((pack) => pack.gameIds.includes(gameId));
}

export function audioPackById(packId: string): AudioPack | undefined {
  return AUDIO_PACKS.find((pack) => pack.id === packId);
}
