/** Tranzițiile React dintre jocuri și finalul calm al sesiunii. */

import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import { drawLumi } from "../art/lumi";
import { meadowScene, nightScene } from "../art/scenery";
import { speakAndWait, stopSpeaking } from "../audio/speech";
import { sfxSessionEnd } from "../audio/sfx";

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

function mountReactScreen(
  className: string,
  screenName: string,
  content: ReactNode,
): HTMLElement {
  const screen = document.createElement("div");
  screen.className = className;
  screen.dataset.screen = screenName;
  const root = createRoot(screen);
  root.render(content);
  registerScreenCleanup(screen, () => root.unmount());
  return screen;
}

/** Card de co-play / transfer în lumea reală, după un joc. */
export async function showCoPlayCard(prompt: string): Promise<void> {
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const finish = () => {
    stopSpeaking();
    resolveDone();
  };

  await showScreen(() =>
    mountReactScreen(
      "bg-sunset session-card-screen",
      "co-play",
      <>
        <div
          aria-hidden="true"
          className="session-card-scenery"
          dangerouslySetInnerHTML={{ __html: meadowScene() }}
        />
        <div className="session-card-content">
          <section
            className="session-card-panel session-card-panel--sunset"
            aria-label="Activitate împreună"
          >
            <Artwork
              markup={drawLumi("happy", 148)}
              className="session-card-lumi lumi happy lll-float"
            />
            <div className="speech-bubble session-card-message" role="status">
              {prompt}
            </div>
            <button
              type="button"
              className="btn-big green session-card-button"
              onClick={finish}
            >
              Am făcut-o!
            </button>
          </section>
        </div>
      </>,
    ),
  );
  void speakAndWait(prompt);
  await done;
}

/** Final calm; callback-ul persistă sesiunea după ce ecranul este vizibil. */
export async function showSessionEndCard(onReady: () => void): Promise<void> {
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const finish = () => {
    stopSpeaking();
    resolveDone();
  };

  await showScreen(() =>
    mountReactScreen(
      "bg-night session-card-screen",
      "session-end",
      <>
        <div
          aria-hidden="true"
          className="session-card-scenery"
          dangerouslySetInnerHTML={{ __html: nightScene() }}
        />
        <div className="session-card-content">
          <section
            className="session-card-panel session-card-panel--night"
            aria-labelledby="session-end-title"
          >
            <Artwork
              markup={drawLumi("sleepy", 170)}
              className="session-card-lumi session-card-lumi--sleepy lumi sleepy"
            />
            <div className="speech-bubble session-card-message">
              <h1 id="session-end-title" className="session-card-title">
                Gata pentru azi!
              </h1>
              <p>
                Lumi se odihnește. Ne jucăm iar mai târziu!
              </p>
            </div>
            <button
              type="button"
              className="btn-big blue session-card-button"
              onClick={finish}
            >
              Înapoi acasă
            </button>
          </section>
        </div>
      </>,
    ),
  );
  sfxSessionEnd();
  void speakAndWait(
    "Gata pentru azi! Ai lucrat cu răbdare. Lumi se odihnește acum.",
  );
  onReady();
  await done;
}
