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

function forbidText(content, forbidden, label) {
  if (content.includes(forbidden)) {
    throw new Error(`${label}: nu poate conține ${JSON.stringify(forbidden)}`);
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

const readSource = (relative) => readFile(path.join(sourceRoot, relative), "utf8");
const speech = await readSource("audio/speech.ts");
const playback = await readSource("audio/playback.ts");
const voices = await readSource("audio/voices.ts");
const music = await readSource("audio/music.ts");
const dom = await readSource("ui/dom.ts");
const engine = await readSource("games/engine.ts");
const roundEvidence = await readSource("games/roundEvidence.ts");
const updates = await readSource("app/update.ts");
const contentPacks = await readSource("app/contentPacks.ts");
const lifecycle = await readSource("app/lifecycle.ts");
const splash = await readSource("screens/splash.tsx");
const home = await readSource("screens/home.tsx");
const parent = await readSource("screens/parent.tsx");
const session = await readSource("app/session.ts");
const unlocks = await readSource("app/unlocks.ts");
const appState = await readSource("app/appState.ts");
const durableProfile = await readSource("app/durableProfile.ts");
const profileSanitizer = await readSource("app/profileSanitizer.ts");
const metadata = await readSource("generated/game-metadata.ts");
const traceRoad = await readSource("games/traceRoad.ts");
const waitForGo = await readSource("games/waitForGo.ts");
const choice = await readSource("games/choiceGame.ts");
const sort = await readSource("games/sortGame.ts");
const samePicture = await readSource("games/samePicture.ts");
const sortByColor = await readSource("games/sortByColor.ts");
const insetPuzzle = await readSource("games/insetPuzzle.ts");
const main = await readSource("main.tsx");
const scheduler = await readFile(
  path.join(root, "packages/core/src/scheduler.ts"),
  "utf8",
);
const difficulty = await readFile(
  path.join(root, "packages/core/src/difficulty.ts"),
  "utf8",
);
const metadataSource = await readFile(
  path.join(root, "content/p0-game-metadata.json"),
  "utf8",
);
const audioPackSource = await readFile(
  path.join(root, "content/audio-packs.json"),
  "utf8",
);
const audioPackValidator = await readFile(
  path.join(root, "scripts/validate-audio-packs.mjs"),
  "utf8",
);
const speechAudit = await readFile(
  path.join(root, "scripts/audit-speech-coverage.mjs"),
  "utf8",
);
const webBuildCheck = await readFile(
  path.join(root, "scripts/check-web-build.mjs"),
  "utf8",
);
const allGamesSmoke = await readFile(
  path.join(root, "tests/web/all-games-smoke.spec.ts"),
  "utf8",
);
const packageJson = await readFile(path.join(root, "package.json"), "utf8");

requireText(speech, "waitForSpeechIdle", "speech runtime");
requireText(speech, "waitForSpeechBoundary", "speech runtime");
requireText(speech, "speakCueAndWait", "stable speech cues");
requireText(speech, "preloadSpeechCues", "stable speech preload");
requireText(speech, 'toggleAttribute("inert", blocked)', "speech input gate");
requireText(speech, "options.blockInput !== false", "speech exception contract");
requireText(speech, "setVoiceDucking", "speech ducking");
requireText(playback, "decodeAudioData", "buffered playback");
requireText(playback, "getVoiceBus", "voice bus");
requireText(playback, "MAX_DECODED_BUFFERS", "bounded audio cache");
requireText(playback, "MAX_PRELOAD_CONCURRENCY", "bounded audio preload");
requireText(playback, "findCurrentCachedAssetResponse", "current-release playback cache");
requireText(dom, "waitForSpeechIdle", "shared timing");
requireText(engine, "await waitForSpeechIdle()", "praise boundary");
requireText(engine, "flushPendingProfileWrites", "level persistence boundary");
requireText(engine, "observeRoundEvidence", "local response evidence");
requireText(engine, "persistProgress", "preview persistence boundary");
requireText(engine, "gameCleanupState", "isolated game cleanup diagnostics");
requireText(roundEvidence, "MutationObserver", "response evidence readiness");
requireText(roundEvidence, "responseMs", "response evidence payload");
requireText(updates, "findCachedResponsesByPathname", "coexisting Workbox caches");
requireText(updates, "requiredStartupAudioReady", "offline pack readiness");
requireText(updates, "release.commit === htmlIdentity", "offline identity");
requireText(updates, "startupUpdateBoundaryOpen", "safe update boundary");
requireText(contentPacks, "responseLooksUsable", "cache validation");
requireText(contentPacks, "currentReleaseCacheNames", "current release cache scope");
requireText(contentPacks, "buildCurrentAssetIndex", "current asset index");
requireText(contentPacks, "isObsoleteRepairCache", "repair cache version isolation");
requireText(contentPacks, "repairRequiredStartupAudio", "offline repair");
requireText(lifecycle, "stopSpeaking", "background speech cleanup");
requireText(splash, "repairRequiredStartupAudio", "repair UI action");
requireText(splash, 'speakCueAndWait("hello-lumi"', "stable Splash cue");
requireText(home, "CONTINUĂ AVENTURA", "single child journey action");
requireText(home, "journeyStopArtwork", "journey artwork");
requireText(home, "profile.attempts.filter", "stable journey progress");
requireText(home, "preferredGameId: activeGame?.id", "promised journey start");
forbidText(home, "loadGames", "lightweight child home");
forbidText(home, "GameButton", "single child journey action");
requireText(parent, "GAME_METADATA", "metadata Parent Mode");
requireText(parent, '"games", "Jocuri"', "adult game catalog");
requireText(parent, "singleLevelOnly: true", "bounded adult preview");
requireText(parent, "previewMode: true", "non-persistent adult preview");
forbidText(parent, "loadAllGames", "lightweight Parent Mode");
requireText(session, "GAME_METADATA", "metadata session planning");
requireText(session, "recentSupportLoad", "support-aware scheduler input");
requireText(session, "recentResponseLoad", "response-aware scheduler input");
requireText(session, "preloadSpeechCues", "stable cue preload");
requireText(session, "demonstrationDelay(320)", "single visual introduction");
requireText(session, "sessionId}`", "unique session seed");
requireText(session, "previewMode", "preview session contract");
requireText(session, "persistProgress: options.previewMode !== true", "preview engine boundary");
forbidText(session, "speakAndWait(game.instruction", "duplicate session narration");
forbidText(session, "speakCueAndWait(game.instruction", "duplicate session cue narration");
requireText(unlocks, "GOLDEN_JOURNEY_IDS", "golden journey unlocks");
requireText(unlocks, "profile.attempts.filter", "stable unlock history");
requireText(unlocks, "isGoldenJourneyReady", "supportive unlock policy");
requireText(durableProfile, "flushProfileWrites", "durable local persistence");
requireText(durableProfile, "writeEmergencyProfileSnapshot", "emergency write");
requireText(durableProfile, "IDB_OPEN_TIMEOUT_MS", "bounded IndexedDB open");
requireText(durableProfile, "IDB_WRITE_TIMEOUT_MS", "bounded IndexedDB write");
requireText(profileSanitizer, "sanitizeProfile", "deep profile recovery");
requireText(profileSanitizer, "sanitizeAttempt", "attempt recovery");
requireText(appState, "readEmergencyProfileSnapshot", "emergency recovery");
requireText(appState, "PROFILE_BOOTSTRAP_TIMEOUT_MS", "bounded profile bootstrap");
requireText(appState, "responseMs", "persisted response evidence");
requireText(scheduler, "usedDomains", "session domain diversity");
requireText(scheduler, "recentAbandonRate", "scheduler abandon evidence");
requireText(scheduler, "recentResponseLoad", "scheduler response evidence");
requireText(difficulty, "slowResponseCount", "latency guard");
requireText(traceRoad, "if (!inputReady || settled)", "trace input gate");
requireText(waitForGo, "blockInput: false", "go-no-go exception");
requireText(choice, "operationGeneration", "choice async lifecycle");
requireText(choice, "joinTargetOnSuccess", "pair joining feedback");
requireText(sort, "interactionLocked", "sort input lifecycle");
requireText(samePicture, "roundSpeechCueId", "stable pair cue");
requireText(sortByColor, 'instructionCueId: "sort-instruction"', "stable sort cue");
requireText(sortByColor, "speakOnPlaceCueId", "stable color cue");
requireText(insetPuzzle, 'instructionCueId: "inset-instruction"', "stable puzzle cue");
requireText(insetPuzzle, "SHAPES_WITH_AUDIO", "spoken early puzzle set");
requireText(insetPuzzle, "speechCueId", "stable shape cue");
requireText(main, "RootErrorBoundary", "root recovery");
requireText(main, "bootstrapState", "bootstrap diagnostics");
requireText(metadata, '"same-picture"', "game metadata same-picture");
requireText(metadata, '"sort-by-color"', "game metadata sort-by-color");
requireText(metadata, '"inset-puzzle"', "game metadata inset-puzzle");
requireText(metadataSource, '"version": "1.1.0"', "metadata version");
requireText(audioPackSource, '"golden-journey"', "golden audio pack");
requireText(audioPackValidator, "includeRemaining", "audio pack validation");
requireText(speechAudit, "missingCueIds", "stable cue audit");
requireText(webBuildCheck, "required audio is absent", "built required audio gate");
requireText(allGamesSmoke, "all P0 games reach ready", "full catalog smoke");
requireText(packageJson, '"validate:audio-packs"', "audio pack command");
requireText(packageJson, "check-stability-hardening.mjs", "stability guard command");
requireText(packageJson, '"test:web:all-games"', "full catalog command");
requireText(music, "activeNotes", "music lifecycle");
requireText(music, "releaseDiagnostic", "music diagnostics");

if (voices.includes("createOscillator") || voices.includes("createBufferSource")) {
  throw new Error("Vocile sintetice vechi ale obiectelor au reapărut.");
}

console.log(
  `V2 base runtime valid: ${sourceFiles.length} fișiere verificate; current-release offline assets, preview isolation, cleanup, persistence, scheduler și golden cues sunt păstrate.`,
);
