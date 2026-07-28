/** Home copil: o singură acțiune dominantă și progres vizual prin aventura Lumi. */

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import { waitForOfflineReady } from "../app/update";
import { GAME_IDS } from "../generated/game-registry";
import {
  GAME_METADATA,
  gameMetadata,
  type GameMetadata,
} from "../generated/game-metadata";
import { drawLumi } from "../art/lumi";
import {
  journeyBackdrop,
  journeyStopArtwork,
  type JourneyStopState,
} from "../art/journey";
import { openParentGate } from "../ui/gate";
import { attachAmbient } from "../ui/ambient";
import { preloadSpeech, stopSpeaking } from "../audio/speech";
import { getAudioContext } from "../audio/audio";
import { sfxTap } from "../audio/sfx";
import { getProfile } from "../app/appState";
import { unlockedGameIds } from "../app/unlocks";
import type { StoredProfile } from "../app/storage";

const PARENT_ICON = `<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="8" fill="#4A3F35"/><path d="M 8 42 Q 8 28 24 28 Q 40 28 40 42 Z" fill="#4A3F35"/></svg>`;
const PLAY_ICON = `<svg viewBox="0 0 48 48"><path d="M 16 10 L 40 24 L 16 38 Z" fill="#4A3F35"/></svg>`;
const JOURNEY_IDS = [
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

async function startSession(): Promise<void> {
  if (sessionRunning) return;
  sessionRunning = true;
  sfxTap();
  try {
    const ready = await waitForOfflineReady();
    if (!ready) return;
    const { runSession } = await import("../app/session");
    await runSession();
  } finally {
    sessionRunning = false;
  }
}

function successfulAttempts(profile: StoredProfile, gameId: string): number {
  return (profile.progressByGame[gameId]?.recentOutcomes ?? []).filter(
    (attempt) =>
      attempt.completed &&
      attempt.correctEventually &&
      !attempt.abandoned,
  ).length;
}

function activeJourneyIndex(profile: StoredProfile): number {
  const firstLearning = JOURNEY_IDS.findIndex(
    (gameId) => successfulAttempts(profile, gameId) < 2,
  );
  if (firstLearning >= 0) return firstLearning;

  let selected = 0;
  let fewestPlays = Number.POSITIVE_INFINITY;
  JOURNEY_IDS.forEach((gameId, index) => {
    const plays = profile.progressByGame[gameId]?.timesPlayed ?? 0;
    if (plays < fewestPlays) {
      selected = index;
      fewestPlays = plays;
    }
  });
  return selected;
}

function journeyState(
  profile: StoredProfile,
  index: number,
  activeIndex: number,
): JourneyStopState {
  if (index === activeIndex) return "current";
  return successfulAttempts(profile, JOURNEY_IDS[index] ?? "") >= 2
    ? "completed"
    : "upcoming";
}

const STATUS_TEXT: Record<JourneyStopState, string> = {
  completed: "explorat",
  current: "următoarea oprire",
  upcoming: "urmează",
};

function JourneyStop({
  game,
  state,
  index,
}: {
  readonly game: GameMetadata;
  readonly state: JourneyStopState;
  readonly index: number;
}) {
  return (
    <article
      className={`home-adventure-stop home-adventure-stop--${index + 1} is-${state}`}
      data-state={state}
      aria-label={`${game.title}: ${STATUS_TEXT[state]}`}
    >
      <span className="home-adventure-number" aria-hidden="true">
        {state === "completed" ? "✓" : index + 1}
      </span>
      <Artwork
        markup={journeyStopArtwork(game.id, state)}
        className="home-journey-art"
      />
      <span className="home-journey-label">{game.title}</span>
    </article>
  );
}

function HomeScreen({
  profile,
  screen,
}: {
  readonly profile: StoredProfile;
  readonly screen: HTMLElement;
}) {
  const ambientHost = useRef<HTMLDivElement>(null);
  const sessionLocked = profile.sessionLocked;
  const activeIndex = activeJourneyIndex(profile);
  const journeyGames = JOURNEY_IDS.map((id) => gameMetadata(id)).filter(
    (game): game is GameMetadata => game !== undefined,
  );
  const activeGame = journeyGames[activeIndex] ?? journeyGames[0];

  useEffect(() => {
    const host = ambientHost.current;
    if (!host) return;
    attachAmbient(host);
    return () => host.replaceChildren();
  }, []);

  useEffect(() => {
    if (sessionLocked || !activeGame) return;
    void preloadSpeech([activeGame.instruction]);
  }, [activeGame, sessionLocked]);

  const openParent = () => {
    screen.append(
      openParentGate(() => {
        void import("./parent").then(({ showParentScreen }) =>
          showParentScreen(),
        );
      }),
    );
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="home-scenery home-journey-scenery"
        dangerouslySetInnerHTML={{ __html: journeyBackdrop() }}
      />
      <div
        ref={ambientHost}
        aria-hidden="true"
        className="home-ambient-host"
      />

      <div className="home-content home-content--journey">
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

        <section
          className="home-adventure home-adventure--primary"
          aria-labelledby="home-adventure-title"
        >
          <div className="home-adventure-intro">
            <Artwork
              markup={drawLumi(sessionLocked ? "sleepy" : "idle", 150)}
              className={`home-lumi lumi ${sessionLocked ? "sleepy" : "idle"}`}
            />
            <div className="home-adventure-copy">
              <p className="home-adventure-kicker">Aventura lui Lumi</p>
              <h2 id="home-adventure-title">
                {sessionLocked
                  ? "Pauză de joacă"
                  : activeGame?.title ?? "Următoarea oprire"}
              </h2>
              <p role={sessionLocked ? "status" : undefined}>
                {sessionLocked
                  ? "Un adult poate porni o sesiune nouă din zona pentru adulți."
                  : "Lumi a pregătit următoarea activitate."}
              </p>
            </div>
          </div>

          <div className="home-adventure-map" aria-label="Traseul aventurii">
            <div className="home-adventure-path" aria-hidden="true" />
            {journeyGames.map((game, index) => (
              <JourneyStop
                key={game.id}
                game={game}
                index={index}
                state={journeyState(profile, index, activeIndex)}
              />
            ))}
          </div>

          {!sessionLocked ? (
            <button
              type="button"
              className="btn-big green home-play-button home-continue-button"
              aria-label="Continuă aventura"
              onClick={() => void startSession()}
            >
              <Artwork markup={PLAY_ICON} className="home-play-icon" />
              <span>CONTINUĂ AVENTURA</span>
            </button>
          ) : null}
        </section>
      </div>
    </>
  );
}

export async function showHome(): Promise<void> {
  stopSpeaking();
  const profile = getProfile();
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));

  await showScreen(() => {
    const screen = document.createElement("div");
    screen.className = "bg-meadow home-screen home-screen--journey";
    screen.dataset.screen = "home";
    screen.dataset.sessionLocked = String(profile.sessionLocked);
    screen.dataset.unlockedCount = String(unlocked.size);
    screen.dataset.journeyStop = String(activeJourneyIndex(profile) + 1);
    const root = createRoot(screen);
    root.render(<HomeScreen profile={profile} screen={screen} />);
    registerScreenCleanup(screen, () => root.unmount());
    return screen;
  });

  // Nu importăm implementări de joc în Home. Contextul audio este doar pregătit.
  getAudioContext();
}

export const HOME_GAME_METADATA = GAME_METADATA;
