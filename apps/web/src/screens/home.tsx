/** Ecranul principal React: pajiștea, Lumi, sesiunea și jocurile deblocate. */

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import { GAME_IDS, loadGames } from "../generated/game-registry";
import { drawLumi } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { openParentGate } from "../ui/gate";
import { attachAmbient } from "../ui/ambient";
import { jelly } from "../ui/feedback";
import { showParentScreen } from "./parent";
import { runSession } from "../app/session";
import { stopSpeaking } from "../audio/speech";
import { getAudioContext } from "../audio/audio";
import { sfxTap } from "../audio/sfx";
import { getProfile } from "../app/appState";
import { unlockedGameIds } from "../app/unlocks";
import type { WebGame } from "../games/types";

const PARENT_ICON = `<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="8" fill="#4A3F35"/><path d="M 8 42 Q 8 28 24 28 Q 40 28 40 42 Z" fill="#4A3F35"/></svg>`;
const PLAY_ICON = `<svg viewBox="0 0 48 48"><path d="M 16 10 L 40 24 L 16 38 Z" fill="#4A3F35"/></svg>`;

let sessionRunning = false;

function Artwork({
  markup,
  className,
}: {
  readonly markup: string;
  readonly className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function startSession(singleGameId?: string): void {
  if (sessionRunning) return;
  sessionRunning = true;
  sfxTap();
  void runSession(
    singleGameId === undefined ? undefined : { singleGameId },
  ).finally(() => {
    sessionRunning = false;
  });
}

function HomeScreen({
  games,
  sessionLocked,
  screen,
}: {
  readonly games: readonly WebGame[];
  readonly sessionLocked: boolean;
  readonly screen: HTMLElement;
}) {
  const ambientHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ambientHost.current;
    if (!host) return;
    attachAmbient(host);
    return () => host.replaceChildren();
  }, []);

  const openParent = () => {
    screen.append(openParentGate(() => void showParentScreen()));
  };

  const animateCard = (event: PointerEvent<HTMLButtonElement>) => {
    jelly(event.currentTarget);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="home-scenery"
        dangerouslySetInnerHTML={{ __html: meadowScene() }}
      />
      <div
        ref={ambientHost}
        aria-hidden="true"
        className="home-ambient-host"
      />

      <div className="home-content">
        <header className="home-topbar">
          <h1 className="home-title">Minte în joacă</h1>
          <button
            type="button"
            className="btn-icon"
            aria-label="Zonă pentru adulți"
            onClick={openParent}
          >
            <Artwork markup={PARENT_ICON} className="home-parent-icon" />
          </button>
        </header>

        <section className="home-hero" aria-label="Începe joaca">
          <Artwork
            markup={drawLumi(
              sessionLocked ? "sleepy" : "idle",
              sessionLocked ? 150 : 132,
            )}
            className={`home-lumi lumi ${sessionLocked ? "sleepy" : "idle"}`}
          />
          {sessionLocked ? (
            <div className="speech-bubble home-rest-message" role="status">
              Joaca s-a încheiat pentru acum. Un adult poate porni o sesiune
              nouă.
            </div>
          ) : (
            <button
              type="button"
              className="btn-big green home-play-button"
              aria-label="Joacă"
              onClick={() => startSession()}
            >
              <Artwork markup={PLAY_ICON} className="home-play-icon" />
              <span>JOACĂ</span>
            </button>
          )}
        </section>

        {!sessionLocked ? (
          <section className="home-library" aria-labelledby="home-library-title">
            <h2 id="home-library-title" className="home-library-title">
              Alege o aventură
            </h2>
            <div
              className="home-game-grid"
              data-game-count={String(games.length)}
            >
              {games.map((game, index) => (
                <button
                  key={game.id}
                  type="button"
                  className="choice-card pop-in home-game-card"
                  aria-label={game.title}
                  style={
                    {
                      background: `${game.bubbleColor}26`,
                      borderColor: game.bubbleColor,
                      "--home-delay": `${index * 40}ms`,
                    } as CSSProperties
                  }
                  onPointerDown={animateCard}
                  onClick={() => startSession(game.id)}
                >
                  <Artwork
                    markup={game.icon()}
                    className="home-game-art"
                  />
                  <span className="home-game-name">{game.title}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

export async function showHome(): Promise<void> {
  stopSpeaking();
  const profile = getProfile();
  const sessionLocked = profile.sessionLocked;
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));
  const games = sessionLocked
    ? []
    : await loadGames(GAME_IDS.filter((gameId) => unlocked.has(gameId)));

  await showScreen(() => {
    const screen = document.createElement("div");
    screen.className = "bg-meadow home-screen";
    screen.dataset.screen = "home";
    screen.dataset.sessionLocked = String(sessionLocked);
    const root = createRoot(screen);
    root.render(
      <HomeScreen
        games={games}
        sessionLocked={sessionLocked}
        screen={screen}
      />,
    );
    registerScreenCleanup(screen, () => root.unmount());
    return screen;
  });

  // Deblochează audio la prima interacțiune și salută.
  getAudioContext();
}
