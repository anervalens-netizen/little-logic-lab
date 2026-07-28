/** Inspectează și repară pachetele locale folosind numai asset-uri same-origin. */

import {
  AUDIO_PACKS,
  AUDIO_PACK_VERSION,
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
const MAX_CACHE_REPAIR_CONCURRENCY = 3;
const REPAIR_CACHE_PREFIX = "logic-lab-audio-repair-";
const REPAIR_CACHE_NAME = `${REPAIR_CACHE_PREFIX}${AUDIO_PACK_VERSION}`;

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

function requiredAssetPaths(): readonly string[] {
  return [...new Set(REQUIRED_AUDIO_PACKS.flatMap((pack) => pack.assetPaths))];
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
  const paths = requiredAssetPaths();
  if (paths.length === 0) return false;
  const index = await buildCacheIndex();
  const inspection = await inspectCachedPaths(paths, index, false);
  return paths.every((pathname) => inspection.usablePaths.has(pathname));
}

async function removeObsoleteRepairCaches(): Promise<void> {
  for (const cacheName of await caches.keys()) {
    if (
      cacheName.startsWith(REPAIR_CACHE_PREFIX) &&
      cacheName !== REPAIR_CACHE_NAME
    ) {
      await caches.delete(cacheName);
    }
  }
}

/**
 * Repară numai asset-urile obligatorii lipsă. Parametrul de query evită ca ruta
 * precache defectă să intercepteze din nou aceeași cheie; răspunsul este salvat
 * sub pathname-ul canonic într-un cache local versionat.
 */
export async function repairRequiredStartupAudio(): Promise<boolean> {
  if (!("caches" in window) || navigator.onLine === false) return false;
  const paths = requiredAssetPaths();
  if (paths.length === 0) return false;

  const beforeIndex = await buildCacheIndex();
  const before = await inspectCachedPaths(paths, beforeIndex, false);
  const missing = paths.filter((pathname) => !before.usablePaths.has(pathname));
  if (missing.length === 0) return true;

  await removeObsoleteRepairCaches();
  const repairCache = await caches.open(REPAIR_CACHE_NAME);
  let nextIndex = 0;
  let failed = false;
  const workerCount = Math.min(MAX_CACHE_REPAIR_CONCURRENCY, missing.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < missing.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const pathname = missing[currentIndex];
        if (!pathname) continue;
        try {
          const url = new URL(pathname, window.location.origin);
          url.searchParams.set("__logic_lab_repair", AUDIO_PACK_VERSION);
          const response = await fetch(url, {
            cache: "reload",
            credentials: "same-origin",
          });
          if (!responseLooksUsable(response)) {
            failed = true;
            continue;
          }
          const size = (await response.clone().blob()).size;
          if (size <= 0) {
            failed = true;
            continue;
          }
          await repairCache.put(pathname, response.clone());
        } catch {
          failed = true;
        }
      }
    }),
  );

  if (failed && !(await requiredStartupAudioReady())) return false;
  return await requiredStartupAudioReady();
}

export function formatPackBytes(bytes: number | null): string {
  if (bytes === null) return "nemăsurat";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(bytes / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
