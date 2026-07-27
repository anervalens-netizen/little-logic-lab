/** Ecranul principal React: pajiștea, Lumi, sesiunea și jocurile deblocate. */

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import { waitForOfflineReady } from "../app/update";
import { GAME_IDS, loadGames } from "../generated/game-registry";
import { drawLumi } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { openParentGate } from "../ui/gate";
import { attachAmbient } from "../ui/ambient";
import { jelly } from "../ui/feedback";
import { preloadSpeech, stopSpeaking } from "../audio/speech";
import { getAudioContext } from "../audio/audio";
import { sfxTap } from "../audio/sfx";
import { getProfile } from "../app/appState";
import { unlockedGameIds } from "../app/unlocks";
import type { WebGame } from "../games/types";

const PARENT_ICON = `<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="8" fill="#4A3F35"/><path d="M 8 42 Q 8 28 24 28 Q 40 28 40 42 Z" fill="#4A3F35"/></svg>`;
const PLAY_ICON = `<svg viewBox="0 0 48 48"><path d="M 16 10 L 40 24 L 16 38 Z" fill="#4A3F35"/></svg>`;
const ADVENTURE_IDS = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
] as const;

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

async function startSession(singleGameId?: string): Promise<void> {
  if (sessionRunning) return;
  sessionRunning = true;
  sfxTap();
  try {
    await waitForOfflineReady();
    const { runSession } = await import("../app/session");
    await runSession(
      singleGameId === undefined ? undefined : { singleGameId },
    );
  } finally {
    sessionRunning = false;
  }
}

function GameButton({
  game,
  index,
  className = "",
  onAnimate,
}: {
  readonly game: WebGame;
  readonly index: number;
  readonly className?: string;
  readonly onAnimate: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={`choice-card pop-in home-game-card ${className}`.trim()}
      aria-label={game.title}
      style={
        {
          background: `${game.bubbleColor}26`,
          borderColor: game.bubbleColor,
          "--home-delay": `${index * 55}ms`,
          "--adventure-accent": game.bubbleColor,
        } as CSSProperties
      }
      onPointerDown={onAnimate}
      onClick={() => void startSession(game.id)}
    >
      <Artwork markup={game.icon()} className="home-game-art" />
      <span className="home-game-name">{game.title}</span>
    </button>
  );
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
  const adventureGames = ADVENTURE_IDS.map((id) =>
    games.find((game) => game.id === id),
  ).filter((game): game is WebGame => game !== undefined);
  const adventureReady = adventureGames.length === ADVENTURE_IDS.length;
  const adventureIdSet = new Set(ADVENTURE_IDS);
  const otherGames = adventureReady
    ? games.filter((game) => !adventureIdSet.has(game.id as (typeof ADVENTURE_IDS)[number]))
    : games;

  useEffect(() => {
    const host = ambientHost.current;
    if (!host) return;
    attachAmbient(host);
    return () => host.replaceChildren();
  }, []);

  useEffect(() => {
    void preloadSpeech(games.map((game) => game.instruction));
  }, [games]);

  const openParent = () => {
    screen.append(
      openParentGate(() => {
        void import("./parent").then(({ showParentScreen }) =>
          showParentScreen(),
        );
      }),
    );
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
              onClick={() => void startSession()}
            >
              <Artwork markup={PLAY_ICON} className="home-play-icon" />
              <span>JOACĂ</span>
            </button>
          )}
        </section>

        {!sessionLocked && adventureReady ? (
          <section
            className="home-adventure"
            aria-labelledby="home-adventure-title"
          >
            <div className="home-section-heading">
              <h2 id="home-adventure-title" className="home-library-title">
                Aventura lui Lumi
              </h2>
              <span className="home-adventure-badge">3 opriri</span>
            </div>
            <div className="home-adventure-map">
              <div className="home-adventure-path" aria-hidden="true" />
              {adventureGames.map((game, index) => (
                <div
                  key={game.id}
                  className={`home-adventure-stop home-adventure-stop--${index + 1}`}
                >
                  <span className="home-adventure-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <GameButton
                    game={game}
                    index={index}
                    className="home-adventure-card"
                    onAnimate={animateCard}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!sessionLocked && otherGames.length > 0 ? (
          <section className="home-library" aria-labelledby="home-library-title">
            <h2 id="home-library-title" className="home-library-title">
              {adventureReady ? "Mai multe jocuri" : "Alege o aventură"}
            </h2>
            <div
              className="home-game-grid"
              data-game-count={String(otherGames.length)}
            >
              {otherGames.map((game, index) => (
                <GameButton
                  key={game.id}
                  game={game}
                  index={index}
                  onAnimate={animateCard}
                />
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

  // Contextul rămâne suspendat până la atingere; decodarea locală poate începe.
  getAudioContext();
}
