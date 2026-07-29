import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(root, "apps/web/src");
const readSource = (relative) => readFile(path.join(sourceRoot, relative), "utf8");

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

const playback = await readSource("audio/playback.ts");
const contentPacks = await readSource("app/contentPacks.ts");
const durableProfile = await readSource("app/durableProfile.ts");
const emergencyProfile = await readSource("app/emergencyProfile.ts");
const appState = await readSource("app/appState.ts");
const lifecycle = await readSource("app/lifecycle.ts");
const router = await readSource("app/router.ts");
const session = await readSource("app/session.ts");
const splash = await readSource("screens/splash.tsx");
const samePicture = await readSource("games/samePicture.ts");
const sortByColor = await readSource("games/sortByColor.ts");
const insetPuzzle = await readSource("games/insetPuzzle.ts");
const main = await readSource("main.tsx");
const appShell = await readSource("app/AppShell.tsx");
const productPolicy = await readFile(
  path.join(root, "scripts/check-product-policy.mjs"),
  "utf8",
);
const speechAudit = await readFile(
  path.join(root, "scripts/audit-speech-coverage.mjs"),
  "utf8",
);

requireText(playback, "AUDIO_FETCH_TIMEOUT_MS", "audio fetch timeout");
requireText(playback, "AUDIO_DECODE_TIMEOUT_MS", "audio decode timeout");
requireText(playback, "PLAYBACK_END_GRACE_MS", "audio playback watchdog");
requireText(playback, "new AbortController()", "abortable local audio fetch");
requireText(playback, "bytes.byteLength === 0", "empty audio rejection");
requireText(playback, "source.stop()", "playback watchdog stop");
requireText(contentPacks, "MAX_CACHE_INSPECTION_CONCURRENCY", "bounded cache inspection");
requireText(contentPacks, "MAX_CACHE_REPAIR_CONCURRENCY", "bounded cache repair");
requireText(contentPacks, "isObsoleteRepairCache", "repair cache version isolation");
requireText(contentPacks, "findCachedResponsesByPathname", "coexisting release caches");
requireText(contentPacks, "repairRequiredStartupAudio", "offline repair API");
requireText(contentPacks, 'credentials: "same-origin"', "same-origin repair fetch");
requireText(contentPacks, "bytesByPath.get(pathname)", "required body verification");
requireText(durableProfile, "writeEmergencyProfileSnapshot", "pre-IDB emergency write");
requireText(durableProfile, "emergencyToken", "emergency generation propagation");
requireText(durableProfile, "clearEmergencyProfileSnapshot(emergencyToken)", "matching emergency cleanup");
requireText(durableProfile, "IDB_OPEN_TIMEOUT_MS", "bounded IndexedDB open");
requireText(durableProfile, "IDB_WRITE_TIMEOUT_MS", "bounded IndexedDB write");
requireText(emergencyProfile, "EMERGENCY_PROFILE_KEY", "emergency profile storage");
requireText(emergencyProfile, "envelopeVersion", "emergency envelope version");
requireText(emergencyProfile, "expectedToken", "generation-safe emergency cleanup");
requireText(emergencyProfile, "envelope.token !== expectedToken", "stale confirmation guard");
requireText(appState, "readEmergencyProfileSnapshot", "emergency boot recovery");
requireText(appState, "checkpointProfileSynchronously", "sync lifecycle checkpoint");
requireText(appState, "PROFILE_BOOTSTRAP_TIMEOUT_MS", "bounded profile bootstrap");
requireText(lifecycle, 'addEventListener("pagehide"', "pagehide persistence");
requireText(lifecycle, 'addEventListener("freeze"', "freeze persistence");
requireText(lifecycle, "stopSpeaking", "background speech cleanup");
requireText(router, "releaseScreen", "isolated screen cleanup");
requireText(router, "finally", "cleanup finalization");
requireText(router, "screenCleanupState", "cleanup diagnostics");
requireText(session, "preloadSpeechCues", "stable cue preload");
requireText(session, "demonstrationDelay(320)", "single visual introduction");
requireText(session, "sessionId}`", "unique session seed");
forbidText(session, "speakAndWait(game.instruction", "duplicate session narration");
forbidText(session, "speakCueAndWait(game.instruction", "duplicate session cue narration");
requireText(splash, "repairRequiredStartupAudio", "Splash repair action");
requireText(splash, "repairing", "Splash repair state");
requireText(splash, 'speakCueAndWait("hello-lumi"', "stable Splash cue");
requireText(samePicture, "roundSpeechCueId", "stable pair cue");
requireText(sortByColor, 'instructionCueId: "sort-instruction"', "stable sort cue");
requireText(sortByColor, "speakOnPlaceCueId", "stable color cue");
requireText(insetPuzzle, 'instructionCueId: "inset-instruction"', "stable puzzle cue");
requireText(insetPuzzle, "SHAPES_WITH_AUDIO", "spoken early puzzle set");
requireText(insetPuzzle, "speechCueId", "stable shape cue");
requireText(main, "RootErrorBoundary", "root React recovery");
requireText(main, "bootstrapState", "bootstrap diagnostics");
requireText(appShell, "startupError", "dynamic import recovery");
requireText(productPolicy, "allowedLocalFetches", "approved local fetch map");
requireText(productPolicy, "approved same-origin asset path", "fetch policy failure");
requireText(speechAudit, "missingCueIds", "stable cue audit");
requireText(speechAudit, "cuePropertyPattern", "cue property audit");

console.log(
  "Stability hardening valid: versioned offline repair, bounded audio/IndexedDB, generation-safe emergency persistence, cleanup isolation, bootstrap recovery and stable golden cues are guarded.",
);
