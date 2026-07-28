/** Inspectează pachetele locale fără request-uri de rețea. */

import {
  AUDIO_PACKS,
  REQUIRED_AUDIO_PACKS,
  type AudioPack,
} from "../audio/audioPacks";

export interface AudioPackStatus {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requiredAtStartup: boolean;
  readonly gameIds: readonly string[];
  readonly cachedAssets: number;
  readonly totalAssets: number;
  readonly totalBytes: number | null;
  readonly ready: boolean;
  readonly missingPaths: readonly string[];
}

interface CachedLocation {
  readonly cacheName: string;
  readonly request: Request;
}

async function cachedLocations(): Promise<Map<string, CachedLocation>> {
  const locations = new Map<string, CachedLocation>();
  if (!("caches" in window)) return locations;

  for (const cacheName of await caches.keys()) {
    const cache = await caches.open(cacheName);
    for (const request of await cache.keys()) {
      const pathname = new URL(request.url).pathname;
      locations.set(pathname, { cacheName, request });
    }
  }
  return locations;
}

export async function findCachedResponseByPathname(
  pathname: string,
): Promise<Response | undefined> {
  if (!("caches" in window)) return undefined;
  const locations = await cachedLocations();
  const location = locations.get(pathname);
  if (!location) return undefined;
  const cache = await caches.open(location.cacheName);
  return (await cache.match(location.request)) ?? undefined;
}

async function byteSizeForPaths(
  paths: readonly string[],
  locations: ReadonlyMap<string, CachedLocation>,
): Promise<number> {
  let total = 0;
  const queue = paths.filter((pathname) => locations.has(pathname));
  const workers = Array.from(
    { length: Math.min(4, queue.length) },
    async (_, workerIndex) => {
      for (let index = workerIndex; index < queue.length; index += 4) {
        const pathname = queue[index];
        if (!pathname) continue;
        const location = locations.get(pathname);
        if (!location) continue;
        const cache = await caches.open(location.cacheName);
        const response = await cache.match(location.request);
        if (!response?.ok) continue;
        const length = Number(response.headers.get("content-length"));
        if (Number.isFinite(length) && length >= 0) {
          total += length;
        } else {
          total += (await response.blob()).size;
        }
      }
    },
  );
  await Promise.all(workers);
  return total;
}

function statusForPack(
  pack: AudioPack,
  installedPaths: ReadonlySet<string>,
  totalBytes: number | null,
): AudioPackStatus {
  const missingPaths = pack.assetPaths.filter(
    (pathname) => !installedPaths.has(pathname),
  );
  return {
    id: pack.id,
    title: pack.title,
    description: pack.description,
    requiredAtStartup: pack.requiredAtStartup,
    gameIds: pack.gameIds,
    cachedAssets: pack.assetPaths.length - missingPaths.length,
    totalAssets: pack.assetPaths.length,
    totalBytes,
    ready: missingPaths.length === 0 && pack.assetPaths.length > 0,
    missingPaths,
  };
}

export async function inspectAudioPacks(
  options: { readonly includeBytes?: boolean } = {},
): Promise<readonly AudioPackStatus[]> {
  const locations = await cachedLocations();
  const installedPaths = new Set(locations.keys());

  return await Promise.all(
    AUDIO_PACKS.map(async (pack) => {
      const totalBytes = options.includeBytes
        ? await byteSizeForPaths(pack.assetPaths, locations)
        : null;
      return statusForPack(pack, installedPaths, totalBytes);
    }),
  );
}

export async function requiredStartupAudioReady(): Promise<boolean> {
  const locations = await cachedLocations();
  const installedPaths = new Set(locations.keys());
  return REQUIRED_AUDIO_PACKS.every((pack) =>
    pack.assetPaths.every((pathname) => installedPaths.has(pathname)),
  );
}

export function formatPackBytes(bytes: number | null): string {
  if (bytes === null) return "nemăsurat";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
