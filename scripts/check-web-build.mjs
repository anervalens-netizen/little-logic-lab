import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dist = path.join(root, "apps/web/dist");
const assets = path.join(dist, "assets");
const html = readFileSync(path.join(dist, "index.html"), "utf8");
const serviceWorker = readFileSync(path.join(dist, "sw.js"), "utf8");
const release = JSON.parse(
  readFileSync(path.join(root, "content/p0-release.json"), "utf8"),
);
const assetFiles = readdirSync(assets);

const initialNames = new Set(
  [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map(
    (match) => match[1],
  ),
);
const splash = assetFiles.find((name) => /^splash-.+\.js$/.test(name));
if (!splash) throw new Error("Missing immediately loaded splash chunk.");
initialNames.add(splash);

const initialGzipBytes = [...initialNames].reduce(
  (sum, name) =>
    sum + gzipSync(readFileSync(path.join(assets, name))).byteLength,
  0,
);
const shellBudgetBytes = 100 * 1024;
if (initialGzipBytes >= shellBudgetBytes) {
  throw new Error(
    `Initial JS is ${(initialGzipBytes / 1024).toFixed(2)} KiB gzip; budget is below 100 KiB.`,
  );
}

const camelCase = (id) =>
  id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
for (const gameId of release.gameIds) {
  const prefix = `${camelCase(gameId)}-`;
  const chunk = assetFiles.find(
    (name) => name.startsWith(prefix) && name.endsWith(".js"),
  );
  if (!chunk) throw new Error(`${gameId}: missing lazy game chunk.`);
  if (!serviceWorker.includes(`assets/${chunk}`)) {
    throw new Error(`${gameId}: lazy chunk is absent from PWA precache.`);
  }
}

console.log(
  `Web build valid: ${(initialGzipBytes / 1024).toFixed(2)} KiB initial JS gzip, ${release.gameIds.length} lazy P0 chunks precached.`,
);
