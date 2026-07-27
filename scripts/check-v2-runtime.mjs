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
const music = await readFile(
  path.join(sourceRoot, "audio/music.ts"),
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
const splash = await readFile(
  path.join(sourceRoot, "screens/splash.tsx"),
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
const waitForGo = await readFile(
  path.join(sourceRoot, "games/waitForGo.ts"),
  "utf8",
);
const choice = await readFile(
  path.join(sourceRoot, "games/choiceGame.ts"),
  "utf8",
);
const sort = await readFile(
  path.join(sourceRoot, "games/sortGame.ts"),
  "utf8",
);

requireText(speech, "waitForSpeechIdle", "speech runtime");
requireText(speech, "waitForSpeechBoundary", "speech runtime");
requireText(speech, 'toggleAttribute("inert", blocked)', "speech input gate");
requireText(speech, "speechBlocksInput", "speech input gate");
requireText(speech, "options.blockInput !== false", "speech exception contract");
requireText(speech, "setVoiceDucking", "speech runtime");
requireText(playback, "decodeAudioData", "buffered playback");
requireText(playback, "getVoiceBus", "buffered playback");
requireText(playback, "MAX_DECODED_BUFFERS", "bounded audio cache");
requireText(playback, "MAX_PRELOAD_CONCURRENCY", "bounded audio preload");
requireText(dom, "waitForSpeechIdle", "shared timing");
requireText(engine, "await waitForSpeechIdle()", "praise boundary");
requireText(updates, "findPrecachedResponse", "revisioned Workbox cache");
requireText(updates, "release.commit === htmlIdentity", "offline identity");
requireText(updates, "startupUpdateBoundaryOpen", "safe startup update");
requireText(updates, "waitForController", "offline readiness");
requireText(splash, "closeStartupUpdateBoundary", "safe startup update");
requireText(splash, "ÎNCEARCĂ DIN NOU", "offline fail-closed UI");
requireText(home, '"same-picture"', "adventure home");
requireText(home, '"sort-by-color"', "adventure home");
requireText(home, '"inset-puzzle"', "adventure home");
requireText(traceRoad, "if (!inputReady || settled)", "trace input gate");
requireText(waitForGo, "blockInput: false", "go-no-go exception");
requireText(choice, "cancelWatch !== null", "choice cleanup");
requireText(sort, "interactionLocked", "sort input lifecycle");
requireText(music, "activeNotes", "music lifecycle");
requireText(music, "releaseDiagnostic", "music diagnostics");

if (voices.includes("createOscillator") || voices.includes("createBufferSource")) {
  throw new Error("Vocile sintetice vechi ale obiectelor au reapărut.");
}

console.log(
  `V2 runtime valid: ${sourceFiles.length} fișiere verificate; audio, offline, update, input, cleanup și golden slice respectă gardurile auditului independent.`,
);
