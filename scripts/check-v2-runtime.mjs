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
const audioPacks = await readSource("audio/audioPacks.ts");
const playback = await readSource("audio/playback.ts");
const voices = await readSource("audio/voices.ts");
const music = await readSource("audio/music.ts");
const dom = await readSource("ui/dom.ts");
const engine = await readSource("games/engine.ts");
const roundEvidence = await readSource("games/roundEvidence.ts");
const updates = await readSource("app/update.ts");
const contentPacks = await readSource("app/contentPacks.ts");
const emergencyProfile = await readSource("app/emergencyProfile.ts");
const lifecycle = await readSource("app/lifecycle.ts");
const appShell = await readSource("app/AppShell.tsx");
const splash = await readSource("screens/splash.tsx");
const home = await readSource("screens/home.tsx");
const parent = await readSource("screens/parent.tsx");
const packPortal = await readSource("screens/ContentPackStatusPortal.tsx");
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
const generator = await readFile(
  path.join(root, "scripts/generate-web-content.mjs"),
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
const productPolicy = await readFile(
  path.join(root, "scripts/check-product-policy.mjs"),
  "utf8",
);
const packageJson = await readFile(path.join(root, "package.json"), "utf8");
const workshopCss = await readFile(
  path.join(sourceRoot, "workshop.css"),
  "utf8",
);
const contentPackCss = await readFile(
  path.join(sourceRoot, "content-packs.css"),
  "utf8",
);
const bootstrapFailureCss = await readFile(
  path.join(sourceRoot, "bootstrap-failure.css"),
  "utf8",
);

requireText(speech, "waitForSpeechIdle", "speech runtime");
requireText(speech, "waitForSpeechBoundary", "speech runtime");
requireText(speech, "speakCueAndWait", "stable speech cues");
requireText(speech, "preloadSpeechCues", "stable speech preload");
requireText(speech, 'toggleAttribute("inert", blocked)', "speech input gate");
requireText(speech, "speechBlocksInput", "speech input gate");
requireText(speech, "options.blockInput !== false", "speech exception contract");
requireText(speech, "setVoiceDucking", "speech runtime");
requireText(playback, "decodeAudioData", "buffered playback");
requireText(playback, "getVoiceBus", "buffered playback");
requireText(playback, "MAX_DECODED_BUFFERS", "bounded audio cache");
requireText(playback, "MAX_PRELOAD_CONCURRENCY", "bounded audio preload");
requireText(audioPacks, "REQUIRED_AUDIO_PACKS", "required audio packs");
requireText(audioPacks, "includeRemaining", "complete audio pack assignment");
requireText(contentPacks, "responseLooksUsable", "cache response validation");
requireText(contentPacks, "MAX_CACHE_INSPECTION_CONCURRENCY", "bounded cache scan");
requireText(contentPacks, "MAX_CACHE_REPAIR_CONCURRENCY", "bounded cache repair");
requireText(contentPacks, "repairRequiredStartupAudio", "startup pack repair");
requireText(contentPacks, 'credentials: "same-origin"', "same-origin pack repair");
requireText(contentPacks, "requiredStartupAudioReady", "startup pack gate");
requireText(updates, "findCachedResponseByPathname", "revisioned Workbox cache");
requireText(updates, "requiredStartupAudioReady", "offline pack readiness");
requireText(updates, "release.commit === htmlIdentity", "offline identity");
requireText(updates, "startupUpdateBoundaryOpen", "safe startup update");
requireText(updates, "waitForController", "offline readiness");
requireText(dom, "waitForSpeechIdle", "shared timing");
requireText(engine, "await waitForSpeechIdle()", "praise boundary");
requireText(engine, "flushPendingProfileWrites", "level persistence boundary");
requireText(engine, 'gameTheme = WORKSHOP_GAMES.has', "golden workshop theme");
requireText(engine, "observeRoundEvidence", "local response evidence");
requireText(roundEvidence, "MutationObserver", "response evidence readiness");
requireText(roundEvidence, "responseMs", "response evidence payload");
requireText(session, "GAME_METADATA", "metadata session planning");
requireText(session, "recentSupportLoad", "support-aware scheduler input");
requireText(session, "recentResponseLoad", "response-aware scheduler input");
requireText(session, "preferredGameId", "promised journey stop");
requireText(session, "singleLevelOnly", "bounded adult game test");
requireText(session, "preloadSpeechCues", "stable instruction cue preload");
requireText(session, "sessionId}`", "unique replayable session seed");
requireText(session, "demonstrationDelay(320)", "single visual introduction");
forbidText(session, "speakAndWait(game.instruction", "duplicate session narration");
forbidText(session, "speakCueAndWait(game.instruction", "duplicate session cue narration");
requireText(splash, "closeStartupUpdateBoundary", "safe startup update");
requireText(splash, "repairRequiredStartupAudio", "offline repair action");
requireText(splash, 'speakCueAndWait("hello-lumi"', "stable splash cue");
requireText(splash, "REPARĂ ȘI ÎNCEARCĂ DIN NOU", "offline repair UI");
requireText(home, "CONTINUĂ AVENTURA", "single child journey action");
requireText(home, "journeyStopArtwork", "premium journey artwork");
requireText(home, "profile.attempts.filter", "stable journey progress");
requireText(home, "preferredGameId: activeGame?.id", "promised journey start");
forbidText(home, "loadGames", "lightweight child home");
forbidText(home, "GameButton", "single child journey action");
requireText(parent, "GAME_METADATA", "metadata Parent Mode");
requireText(parent, '"games", "Jocuri"', "adult-only game catalog");
requireText(parent, "singleLevelOnly: true", "bounded parent test");
forbidText(parent, "loadAllGames", "lightweight Parent Mode");
requireText(packPortal, "inspectAudioPacks", "Parent Mode pack status");
requireText(packPortal, "Cache Storage", "local-only pack explanation");
requireText(appShell, "ContentPackStatusPortal", "pack status portal mount");
requireText(appShell, "installApplicationLifecycle", "global lifecycle mount");
requireText(appShell, "startupError", "dynamic import recovery");
requireText(lifecycle, 'addEventListener("pagehide"', "pagehide checkpoint");
requireText(lifecycle, 'addEventListener("freeze"', "freeze checkpoint");
requireText(lifecycle, "checkpointProfileSynchronously", "sync profile checkpoint");
requireText(emergencyProfile, "EMERGENCY_PROFILE_KEY", "emergency profile snapshot");
requireText(durableProfile, "writeEmergencyProfileSnapshot", "pre-IDB checkpoint");
requireText(durableProfile, "clearEmergencyProfileSnapshot", "confirmed checkpoint cleanup");
requireText(durableProfile, "flushProfileWrites", "durable local persistence");
requireText(durableProfile, 'status: "fallback"', "storage fallback health");
requireText(appState, "readEmergencyProfileSnapshot", "emergency recovery");
requireText(appState, "checkpointProfileSynchronously", "page lifecycle checkpoint");
requireText(profileSanitizer, "sanitizeProfile", "deep profile recovery");
requireText(profileSanitizer, "sanitizeAttempt", "attempt recovery");
requireText(appState, "getProfileRepairSummary", "observable profile recovery");
requireText(appState, "responseMs", "persisted response evidence");
requireText(metadata, 'id: "same-picture"', "game metadata");
requireText(metadata, 'id: "sort-by-color"', "game metadata");
requireText(metadata, 'id: "inset-puzzle"', "game metadata");
requireText(metadataSource, '"version": "1.1.0"', "metadata source version");
requireText(audioPackSource, '"golden-journey"', "golden audio pack");
requireText(generator, "p0-game-metadata.json", "metadata generation");
requireText(audioPackValidator, "includeRemaining", "audio pack validation");
requireText(speechAudit, "missingCueIds", "stable cue audit");
requireText(speechAudit, "cuePropertyPattern", "cue property audit");
requireText(productPolicy, "allowedLocalFetches", "guarded local fetch policy");
requireText(productPolicy, "approved same-origin asset path", "same-origin policy failure");
requireText(packageJson, '"validate:audio-packs"', "audio pack command");
requireText(unlocks, "GOLDEN_JOURNEY_IDS", "non-blocking golden journey");
requireText(unlocks, "profile.attempts.filter", "stable unlock history");
requireText(unlocks, "isGoldenJourneyReady", "supportive unlock policy");
requireText(scheduler, "usedDomains", "session domain diversity");
requireText(scheduler, "recentAbandonRate", "scheduler abandon evidence");
requireText(scheduler, "recentResponseLoad", "scheduler response evidence");
requireText(difficulty, "slowResponseCount", "cautious latency guard");
requireText(traceRoad, "if (!inputReady || settled)", "trace input gate");
requireText(waitForGo, "blockInput: false", "go-no-go exception");
requireText(choice, "operationGeneration", "choice async lifecycle");
requireText(choice, "joinTargetOnSuccess", "pair joining feedback");
requireText(sort, "interactionLocked", "sort input lifecycle");
requireText(samePicture, "roundSpeechCueId", "stable pair cue");
requireText(samePicture, "VEHICLES.flatMap", "vehicle matching variants");
requireText(sortByColor, 'instructionCueId: "sort-instruction"', "stable sort cue");
requireText(sortByColor, "speakOnPlaceCueId", "stable color cue");
requireText(insetPuzzle, 'instructionCueId: "inset-instruction"', "stable puzzle cue");
requireText(insetPuzzle, "speechCueId", "stable shape cue");
requireText(insetPuzzle, 'shape === "hexagon"', "missing hexagon cue fallback");
requireText(main, "RootErrorBoundary", "React root recovery");
requireText(main, "bootstrapState", "bootstrap diagnostics");
requireText(main, 'import "./workshop.css"', "workshop visual layer");
requireText(main, 'import "./content-packs.css"', "pack status styles");
requireText(main, 'import "./bootstrap-failure.css"', "bootstrap recovery styles");
requireText(workshopCss, 'data-game-theme="toy-workshop"', "workshop CSS theme");
requireText(contentPackCss, ".parent-content-pack-row", "pack status CSS");
requireText(bootstrapFailureCss, ".bootstrap-failure", "bootstrap recovery CSS");
requireText(music, "activeNotes", "music lifecycle");
requireText(music, "releaseDiagnostic", "music diagnostics");

if (voices.includes("createOscillator") || voices.includes("createBufferSource")) {
  throw new Error("Vocile sintetice vechi ale obiectelor au reapărut.");
}

console.log(
  `V2 premium runtime valid: ${sourceFiles.length} fișiere verificate; repair offline, cue-uri stabile, persistență de urgență, lifecycle, journey, evidence și recovery sunt prezente.`,
);
