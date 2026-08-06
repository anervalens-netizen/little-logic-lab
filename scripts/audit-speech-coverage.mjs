import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandAudioPrompts } from "./audio-manifest.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(root, "apps/web/src");
const manifest = JSON.parse(
  await readFile(path.join(sourceRoot, "audio/ro-RO-v1.json"), "utf8"),
);
const expandedPrompts = expandAudioPrompts(manifest);
const availableTexts = new Set(expandedPrompts.map((prompt) => prompt.text));
const availableCueIds = new Set(expandedPrompts.map((prompt) => prompt.id));

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(target)));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

function addLocation(map, key, location) {
  const locations = map.get(key) ?? [];
  locations.push(location);
  map.set(key, locations);
}

const missingTexts = new Map();
const missingCueIds = new Map();
let dynamicTextCalls = 0;
let dynamicCueCalls = 0;
const textLiteralPattern =
  /(?:ctx\.)?(?:speak|speakAndWait)\(\s*("(?:\\.|[^"\\])*")/g;
const anyTextCall = /(?:ctx\.)?(?:speak|speakAndWait)\s*\(/g;
const cueLiteralPattern =
  /(?:ctx\.)?(?:speakCue|speakCueAndWait)\(\s*("(?:\\.|[^"\\])*")/g;
const anyCueCall = /(?:ctx\.)?(?:speakCue|speakCueAndWait)\s*\(/g;
const cuePropertyPattern =
  /(?:instructionCueId|roundSpeechCueId|hintCueId|helpCueId|speechCueId|speakOnPlaceCueId)\s*:\s*("(?:\\.|[^"\\])*")/g;

for (const filename of await collectFiles(sourceRoot)) {
  const content = await readFile(filename, "utf8");
  const relative = path.relative(root, filename);
  const literalTextStarts = new Set();
  const literalCueStarts = new Set();

  for (const match of content.matchAll(textLiteralPattern)) {
    literalTextStarts.add(match.index);
    let text;
    try {
      text = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (availableTexts.has(text)) continue;
    const line = content.slice(0, match.index).split("\n").length;
    addLocation(missingTexts, text, `${relative}:${line}`);
  }

  for (const match of content.matchAll(cueLiteralPattern)) {
    literalCueStarts.add(match.index);
    let cueId;
    try {
      cueId = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (availableCueIds.has(cueId)) continue;
    const line = content.slice(0, match.index).split("\n").length;
    addLocation(missingCueIds, cueId, `${relative}:${line}`);
  }

  for (const match of content.matchAll(cuePropertyPattern)) {
    let cueId;
    try {
      cueId = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (availableCueIds.has(cueId)) continue;
    const line = content.slice(0, match.index).split("\n").length;
    addLocation(missingCueIds, cueId, `${relative}:${line}`);
  }

  for (const match of content.matchAll(anyTextCall)) {
    const isLiteral = [...literalTextStarts].some(
      (index) => index >= match.index && index - match.index < 28,
    );
    if (!isLiteral) dynamicTextCalls += 1;
  }
  for (const match of content.matchAll(anyCueCall)) {
    const isLiteral = [...literalCueStarts].some(
      (index) => index >= match.index && index - match.index < 32,
    );
    if (!isLiteral) dynamicCueCalls += 1;
  }
}

if (missingTexts.size > 0) {
  console.log("Replici fixe fără clip local:");
  for (const [text, locations] of [...missingTexts].sort(([a], [b]) =>
    a.localeCompare(b, "ro"),
  )) {
    console.log(`- ${JSON.stringify(text)} — ${locations.join(", ")}`);
  }
}

if (missingCueIds.size > 0) {
  console.log("ID-uri audio necunoscute:");
  for (const [cueId, locations] of [...missingCueIds].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    console.log(`- ${JSON.stringify(cueId)} — ${locations.join(", ")}`);
  }
}

console.log(
  `Acoperire audio: ${availableTexts.size} texte/ID-uri disponibile, ${missingTexts.size} texte fixe lipsă, ${missingCueIds.size} ID-uri necunoscute, ${dynamicTextCalls} apeluri text dinamice și ${dynamicCueCalls} apeluri cue dinamice de revizuit.`,
);

if (
  process.argv.includes("--strict") &&
  (missingTexts.size > 0 ||
    missingCueIds.size > 0 ||
    dynamicTextCalls > 0 ||
    dynamicCueCalls > 0)
) {
  process.exitCode = 1;
}
