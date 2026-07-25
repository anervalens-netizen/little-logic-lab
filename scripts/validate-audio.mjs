import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const manifestUrl = new URL(
  "../apps/web/src/audio/ro-RO-v1.json",
  import.meta.url,
);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const audioDirectory = new URL(
  `../apps/web/public/audio/${manifest.version}/`,
  import.meta.url,
);
const expectedFiles = new Set();
const ids = new Set();
const texts = new Set();

for (const prompt of manifest.prompts) {
  if (!prompt.id || !prompt.text) throw new Error("Audio prompt incomplet");
  if (ids.has(prompt.id)) throw new Error(`Audio id duplicat: ${prompt.id}`);
  if (texts.has(prompt.text)) throw new Error(`Text audio duplicat: ${prompt.text}`);
  ids.add(prompt.id);
  texts.add(prompt.text);
  const filename = `${prompt.id}.mp3`;
  expectedFiles.add(filename);
  const details = await stat(new URL(filename, audioDirectory));
  if (details.size < 1_000) {
    throw new Error(`Clip audio invalid: ${filename} (${details.size} bytes)`);
  }
}

const actualFiles = new Set(
  (await readdir(audioDirectory)).filter((filename) => filename.endsWith(".mp3")),
);
const missing = [...expectedFiles].filter((filename) => !actualFiles.has(filename));
const extra = [...actualFiles].filter((filename) => !expectedFiles.has(filename));
if (missing.length > 0 || extra.length > 0) {
  throw new Error(
    `Manifest audio nealiniat. lipsă=${missing.join(",")} extra=${extra.join(",")}`,
  );
}

console.log(
  `Audio valid: ${manifest.prompts.length} clipuri, ${manifest.version}, ${fileURLToPath(audioDirectory)}`,
);
