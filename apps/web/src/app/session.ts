/**
 * Orchestrarea sesiunii: plan adaptiv (din core), limită de minute,
 * card de co-play după fiecare joc, final calm.
 */

import { buildSessionPlan, defaultSessionGameCount, type GameCandidate } from "@core";
import { getProfile, masteryMeanFor, recordSession } from "./appState";
import {
  GAME_IDS,
  loadGame,
  loadGames,
} from "../generated/game-registry";
import { runGame, cancelCurrentGame, resetCancelFlag, cancelFlagPending } from "../games/engine";
import { buildGameShell } from "../screens/gameScreen";
import { showScreen } from "./router";
import { el, svgEl, wait } from "../ui/dom";
import { speak, stopSpeaking } from "../audio/speech";
import { sfxSessionEnd } from "../audio/sfx";
import { drawLumi } from "../art/lumi";
import { nightScene } from "../art/scenery";
import { showHome } from "../screens/home";
import { applyPendingUpdate } from "./update";
import { isGameAgeEligible } from "./content";
import { unlockedGameIds } from "./unlocks";

const SESSION_SECONDS_WARN = 0; // nu afișăm cronometru copilului

async function buildCandidates(): Promise<GameCandidate[]> {
  const profile = getProfile();
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));
  const games = await loadGames(
    GAME_IDS.filter((gameId) => unlocked.has(gameId)),
  );
  return games
    .filter(
      (game) =>
        game.scored &&
        unlocked.has(game.id) &&
        isGameAgeEligible(game.id, profile.ageMonths),
    )
    .map((game) => {
      const progress = profile.progressByGame[game.id];
      const mean = masteryMeanFor(game.skillId);
      return {
        gameId: game.id,
        skillId: game.skillId,
        mode: "digital" as const,
        masteryMean: mean,
        evidenceCount: profile.masteryBySkill[game.skillId]?.evidenceCount ?? 0,
        timesPlayed: progress?.timesPlayed ?? 0,
        dueScore: 1 - mean,
        ageEligible: true,
      };
    });
}

/** Card de co-play / transfer în lumea reală, după un joc. */
async function showCoPlayCard(prompt: string): Promise<void> {
  const screen = el("div", { className: "bg-sunset" });
  screen.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:24px;";

  const lumiArt = svgEl(drawLumi("happy", 120));
  lumiArt.classList.add("lll-float");
  const card = el("div", { className: "speech-bubble" });
  card.style.fontSize = "clamp(24px,4.6vw,36px)";
  card.append(prompt);

  const btn = el("button", { className: "btn-big green" }, "Am făcut-o!");
  screen.append(lumiArt, card, btn);

  let resolveFn: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });
  btn.addEventListener("click", () => resolveFn());

  await showScreen(() => screen);
  speak(prompt);
  await done;
}

/** Ecranul de final de sesiune: Lumi doarme, calm, fără stimulente. */
async function showSessionEnd(
  sessionId: string,
  startedAtMs: number,
  gamesPlayed: number,
): Promise<void> {
  const screen = el("div", { className: "bg-night" });
  screen.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:24px;";

  const sceneHolder = el("div", {});
  sceneHolder.style.cssText = "position:absolute;inset:0;pointer-events:none;";
  const scene = svgEl(nightScene());
  scene.style.cssText = "position:absolute;inset:0;";
  sceneHolder.append(scene);

  const lumiWrap = el("div", { className: "lumi sleepy" });
  lumiWrap.append(svgEl(drawLumi("sleepy", 150)));
  lumiWrap.style.zIndex = "2";

  const text = el("div", { className: "speech-bubble" }, "Gata pentru azi! Lumi se odihnește. Ne jucăm iar mai târziu!");
  text.style.zIndex = "2";

  const btn = el("button", { className: "btn-big blue" }, "Înapoi acasă");
  btn.style.zIndex = "2";

  screen.append(sceneHolder, lumiWrap, text, btn);

  let resolveFn: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });
  btn.addEventListener("click", () => resolveFn());

  await showScreen(() => screen);
  sfxSessionEnd();
  speak("Gata pentru azi! Ai fost minunat. Lumi se odihnește acum.");
  const elapsedMinutes = Math.max(
    0.1,
    Math.round(((Date.now() - startedAtMs) / 60_000) * 10) / 10,
  );
  recordSession(sessionId, elapsedMinutes, gamesPlayed);
  await done;
}

export interface SessionOptions {
  /** Dacă e setat, se joacă doar acest joc (ales de pe ecranul principal). */
  readonly singleGameId?: string;
}

export async function runSession(options: SessionOptions = {}): Promise<void> {
  resetCancelFlag();
  const profile = getProfile();
  const sessionId = crypto.randomUUID();
  const limitMs = profile.settings.sessionMinutes * 60_000;
  const start = Date.now();

  let plan: readonly { gameId: string }[];
  if (options.singleGameId !== undefined) {
    plan = [{ gameId: options.singleGameId }];
  } else {
    const built = buildSessionPlan(await buildCandidates(), {
      seed: `session:${new Date().toISOString().slice(0, 10)}`,
      maxGames: defaultSessionGameCount(profile.ageMonths),
      includeHybrid: false,
    });
    plan = built.entries;
  }

  let gamesPlayed = 0;
  let levelSalt = 0;

  for (const entry of plan) {
    if (Date.now() - start >= limitMs + SESSION_SECONDS_WARN) break;
    const game = await loadGame(entry.gameId);
    if (!game) continue;

    let playAnotherLevel = true;
    let firstLevelOfGame = true;

    while (playAnotherLevel && Date.now() - start < limitMs) {
      let quit = false;
      const shell = buildGameShell({
        onHome: () => {
          quit = true;
          cancelCurrentGame();
        },
        showProgress: options.singleGameId === undefined,
      });
      shell.setProgress(gamesPlayed, plan.length);

      await showScreen(() => shell.screen);

      // Instrucțiune + demonstrație vizuală (fără citit).
      shell.showBubble(game.instruction);
      shell.setLumiMood("think");
      speak(game.instruction);
      await wait(1400);

      const { result, cancelled } = await runGame(
        game,
        shell.mount,
        shell.screen,
        sessionId,
        `${levelSalt}`,
      );
      levelSalt += 1;

      if (cancelled || quit) {
        stopSpeaking();
        await showHome();
        return;
      }

      if (result.completed) {
        gamesPlayed += 1;
        shell.setLumiMood("happy");
        shell.setProgress(gamesPlayed, plan.length);
      }

      // După primul nivel terminat frumos, trecem la jocul următor;
      // în modul „un singur joc", continuăm niveluri până la limita de timp.
      playAnotherLevel = options.singleGameId !== undefined && result.completed;
      firstLevelOfGame = false;

      if (!playAnotherLevel && profile.settings.coPlayPrompts && result.completed) {
        await showCoPlayCard(game.coPlayPrompt);
      }
      if (firstLevelOfGame) break;
      if (cancelFlagPending()) {
        stopSpeaking();
        await showHome();
        return;
      }
    }
  }

  stopSpeaking();
  await showSessionEnd(sessionId, start, gamesPlayed);
  if (!(await applyPendingUpdate())) {
    await showHome();
  }
}
