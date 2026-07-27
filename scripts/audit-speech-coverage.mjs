import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandAudioPrompts } from "./audio-manifest.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(root, "apps/web/src");
const manifest = JSON.parse(
  await readFile(path.join(sourceRoot, "audio/ro-RO-v1.json"), "utf8"),
);
const availableTexts = new Set(
  expandAudioPrompts(manifest).map((prompt) => prompt.text),
);

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(target)));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

const missing = new Map();
let dynamicCalls = 0;
const literalPattern =
  /(?:ctx\.)?(?:speak|speakAndWait)\(\s*("(?:\\.|[^"\\])*")/g;
const anySpeechCall = /(?:ctx\.)?(?:speak|speakAndWait)\s*\(/g;

for (const filename of await collectFiles(sourceRoot)) {
  const content = await readFile(filename, "utf8");
  const literalStarts = new Set();
  for (const match of content.matchAll(literalPattern)) {
    literalStarts.add(match.index);
    let text;
    try {
      text = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (availableTexts.has(text)) continue;
    const locations = missing.get(text) ?? [];
    const line = content.slice(0, match.index).split("\n").length;
    locations.push(`${path.relative(root, filename)}:${line}`);
    missing.set(text, locations);
  }
  for (const match of content.matchAll(anySpeechCall)) {
    const isLiteral = [...literalStarts].some(
      (index) => index >= match.index && index - match.index < 24,
    );
    if (!isLiteral) dynamicCalls += 1;
  }
}

if (missing.size > 0) {
  console.log("Replici fixe fără clip local:");
  for (const [text, locations] of [...missing].sort(([a], [b]) =>
    a.localeCompare(b, "ro"),
  )) {
    console.log(`- ${JSON.stringify(text)} — ${locations.join(", ")}`);
  }
}

console.log(
  `Acoperire audio: ${availableTexts.size} texte disponibile, ${missing.size} replici fixe lipsă, ${dynamicCalls} apeluri dinamice de revizuit.`,
);

if (process.argv.includes("--strict") && (missing.size > 0 || dynamicCalls > 0)) {
  process.exitCode = 1;
}
