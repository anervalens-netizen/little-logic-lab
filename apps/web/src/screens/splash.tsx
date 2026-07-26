/** Ecranul React de pornire; prima atingere deblochează audio. */

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import { drawLumi } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { getAudioContext } from "../audio/audio";
import { speak } from "../audio/speech";
import { showHome } from "./home";
import { sfxWin } from "../audio/sfx";
import { attachAmbient } from "../ui/ambient";

const START_ICON = `<svg viewBox="0 0 48 48"><path d="M17 11 L39 24 L17 37 Z" fill="#4A3F35"/></svg>`;

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

function SplashScreen() {
  const started = useRef(false);
  const ambientHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ambientHost.current;
    if (!host) return;
    attachAmbient(host);
    return () => host.replaceChildren();
  }, []);

  const start = () => {
    if (started.current) return;
    started.current = true;
    getAudioContext();
    sfxWin();
    speak("Salut! Eu sunt Lumi! Hai să ne jucăm împreună!");
    void showHome();
  };

  return (
    <div className="splash-interaction" onPointerDown={start}>
      <div
        aria-hidden="true"
        className="splash-scenery"
        dangerouslySetInnerHTML={{ __html: meadowScene() }}
      />
      <div
        ref={ambientHost}
        aria-hidden="true"
        className="splash-ambient-host"
      />

      <div className="splash-content">
        <section className="splash-brand-card" aria-labelledby="splash-title">
          <div className="splash-lumi-halo" aria-hidden="true" />
          <Artwork
            markup={drawLumi("happy", 190)}
            className="splash-lumi lumi happy lll-float"
          />
          <h1 id="splash-title" className="splash-title">
            Minte în joacă
          </h1>
          <p className="splash-subtitle">
            Jocuri logice blânde pentru cei mici
          </p>
          <button
            type="button"
            className="btn-big sun splash-start-button pop-in"
            onClick={start}
          >
            <Artwork markup={START_ICON} className="splash-start-icon" />
            <span>Atinge și joacă-te!</span>
          </button>
        </section>
      </div>
    </div>
  );
}

export async function showSplash(): Promise<void> {
  await showScreen(() => {
    const screen = document.createElement("div");
    screen.className = "bg-meadow splash-screen";
    screen.dataset.screen = "splash";
    const root = createRoot(screen);
    root.render(<SplashScreen />);
    registerScreenCleanup(screen, () => root.unmount());
    return screen;
  });
}
