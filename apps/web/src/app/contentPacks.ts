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
  /** Include atât căile absente, cât și răspunsurile cache-uite invalide. */
  readonly missingPaths: readonly string[];
}

interface CachedLocation {
  readonly cacheName: string;
  readonly request: Request;
}

interface CacheIndex {
  readonly locationsByPath: ReadonlyMap<string, readonly CachedLocation[]>;
  readonly cacheByName: ReadonlyMap<string, Cache>;
}

interface CacheInspection {
  readonly usablePaths: ReadonlySet<string>;
  readonly bytesByPath: ReadonlyMap<string, number>;
}

const MAX_CACHE_INSPECTION_CONCURRENCY = 4;

async function buildCacheIndex(): Promise<CacheIndex> {
  const locationsByPath = new Map<string, CachedLocation[]>();
  const cacheByName = new Map<string, Cache>();
  if (!("caches" in window)) return { locationsByPath, cacheByName };

  for (const cacheName of await caches.keys()) {
    const cache = await caches.open(cacheName);
    cacheByName.set(cacheName, cache);
    for (const request of await cache.keys()) {
      const pathname = new URL(request.url).pathname;
      const locations = locationsByPath.get(pathname) ?? [];
      locations.push({ cacheName, request });
      locationsByPath.set(pathname, locations);
    }
  }
  return { locationsByPath, cacheByName };
}

function responseLooksUsable(response: Response | undefined): response is Response {
  if (!response?.ok) return false;
  const contentLength = response.headers.get("content-length");
  if (contentLength === null) return true;
  const parsed = Number(contentLength);
  return !Number.isFinite(parsed) || parsed > 0;
}

async function inspectCachedPaths(
  paths: readonly string[],
  index: CacheIndex,
  includeBytes: boolean,
): Promise<CacheInspection> {
  const queue = [...new Set(paths)];
  const usablePaths = new Set<string>();
  const bytesByPath = new Map<string, number>();
  let nextIndex = 0;
  const workerCount = Math.min(MAX_CACHE_INSPECTION_CONCURRENCY, queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < queue.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const pathname = queue[currentIndex];
        if (!pathname) continue;

        const locations = index.locationsByPath.get(pathname) ?? [];
        for (const location of locations) {
          const cache = index.cacheByName.get(location.cacheName);
          if (!cache) continue;
          const response = await cache.match(location.request);
          if (!responseLooksUsable(response)) continue;

          let bytes: number | null = null;
          if (includeBytes) {
            const contentLength = Number(response.headers.get("content-length"));
            bytes =
              Number.isFinite(contentLength) && contentLength > 0
                ? contentLength
                : (await response.clone().blob()).size;
            if (bytes <= 0) continue;
          }

          usablePaths.add(pathname);
          if (bytes !== null) bytesByPath.set(pathname, bytes);
          break;
        }
      }
    }),
  );

  return { usablePaths, bytesByPath };
}

export async function findCachedResponseByPathname(
  pathname: string,
): Promise<Response | undefined> {
  const index = await buildCacheIndex();
  for (const location of index.locationsByPath.get(pathname) ?? []) {
    const cache = index.cacheByName.get(location.cacheName);
    if (!cache) continue;
    const response = await cache.match(location.request);
    if (responseLooksUsable(response)) return response;
  }
  return undefined;
}

function statusForPack(
  pack: AudioPack,
  inspection: CacheInspection,
  includeBytes: boolean,
): AudioPackStatus {
  const missingPaths = pack.assetPaths.filter(
    (pathname) => !inspection.usablePaths.has(pathname),
  );
  const totalBytes = includeBytes
    ? pack.assetPaths.reduce(
        (total, pathname) => total + (inspection.bytesByPath.get(pathname) ?? 0),
        0,
      )
    : null;

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
  const includeBytes = options.includeBytes === true;
  const index = await buildCacheIndex();
  const inspection = await inspectCachedPaths(
    AUDIO_PACKS.flatMap((pack) => pack.assetPaths),
    index,
    includeBytes,
  );
  return AUDIO_PACKS.map((pack) =>
    statusForPack(pack, inspection, includeBytes),
  );
}

export async function requiredStartupAudioReady(): Promise<boolean> {
  const requiredPaths = REQUIRED_AUDIO_PACKS.flatMap((pack) => pack.assetPaths);
  if (requiredPaths.length === 0) return false;
  const index = await buildCacheIndex();
  const inspection = await inspectCachedPaths(requiredPaths, index, false);
  return requiredPaths.every((pathname) => inspection.usablePaths.has(pathname));
}

export function formatPackBytes(bytes: number | null): string {
  if (bytes === null) return "nemăsurat";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(bytes / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
