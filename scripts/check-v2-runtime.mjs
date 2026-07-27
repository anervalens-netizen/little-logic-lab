import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(root, "apps/web/src");

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(target)));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

function requireText(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: lipsește ${JSON.stringify(expected)}`);
  }
}

const sourceFiles = await collectFiles(sourceRoot);
const sourceEntries = await Promise.all(
  sourceFiles.map(async (filename) => [filename, await readFile(filename, "utf8")]),
);

for (const [filename, content] of sourceEntries) {
  if (/new\s+Audio\s*\(/.test(content)) {
    throw new Error(
      `${path.relative(root, filename)}: redarea child-facing nu poate reveni la new Audio()`,
    );
  }
}

const speech = await readFile(
  path.join(sourceRoot, "audio/speech.ts"),
  "utf8",
);
const playback = await readFile(
  path.join(sourceRoot, "audio/playback.ts"),
  "utf8",
);
const voices = await readFile(
  path.join(sourceRoot, "audio/voices.ts"),
  "utf8",
);
const dom = await readFile(path.join(sourceRoot, "ui/dom.ts"), "utf8");
const engine = await readFile(
  path.join(sourceRoot, "games/engine.ts"),
  "utf8",
);
const updates = await readFile(
  path.join(sourceRoot, "app/update.ts"),
  "utf8",
);
const home = await readFile(
  path.join(sourceRoot, "screens/home.tsx"),
  "utf8",
);
const traceRoad = await readFile(
  path.join(sourceRoot, "games/traceRoad.ts"),
  "utf8",
);

requireText(speech, "waitForSpeechIdle", "speech runtime");
requireText(speech, "waitForSpeechBoundary", "speech runtime");
requireText(speech, 'toggleAttribute("inert", blocked)', "speech input gate");
requireText(speech, "setVoiceDucking", "speech runtime");
requireText(playback, "decodeAudioData", "buffered playback");
requireText(playback, "getVoiceBus", "buffered playback");
requireText(dom, "waitForSpeechIdle", "shared timing");
requireText(engine, "await waitForSpeechIdle()", "praise boundary");
requireText(updates, "currentReleaseIsCached", "offline readiness");
requireText(updates, "release.commit === htmlIdentity", "offline identity");
requireText(updates, "waitForController", "offline readiness");
requireText(home, '"same-picture"', "adventure home");
requireText(home, '"sort-by-color"', "adventure home");
requireText(home, '"inset-puzzle"', "adventure home");
requireText(traceRoad, "if (!inputReady || settled)", "trace input gate");

if (voices.includes("createOscillator") || voices.includes("createBufferSource")) {
  throw new Error("Vocile sintetice vechi ale obiectelor au reapărut.");
}

console.log(
  `V2 runtime valid: ${sourceFiles.length} fișiere verificate, audio bufferizat, release offline curent, input gate și aventura P0 prezente.`,
);
