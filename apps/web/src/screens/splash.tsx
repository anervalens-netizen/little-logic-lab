/** Ecranul React de pornire; prima atingere deblochează audio și build-ul offline. */

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { registerScreenCleanup, showScreen } from "../app/router";
import {
  closeStartupUpdateBoundary,
  waitForOfflineReady,
} from "../app/update";
import { repairRequiredStartupAudio } from "../app/contentPacks";
import { drawLumi } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { getAudioContext } from "../audio/audio";
import { speakCueAndWait } from "../audio/speech";
import { showHome } from "./home";
import { sfxTap } from "../audio/sfx";
import { attachAmbient } from "../ui/ambient";

const START_ICON = `<svg viewBox="0 0 48 48"><path d="M17 11 L39 24 L17 37 Z" fill="#4A3F35"/></svg>`;
const GREETING = "Salut! Eu sunt Lumi! Hai să ne jucăm împreună!";

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
  const [starting, setStarting] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [offlineIssue, setOfflineIssue] = useState(false);

  useEffect(() => {
    const host = ambientHost.current;
    if (!host) return;
    attachAmbient(host);
    return () => host.replaceChildren();
  }, []);

  const start = async () => {
    if (started.current) return;
    const shouldRepair = offlineIssue;
    started.current = true;
    setStarting(true);
    setRepairing(shouldRepair);
    setOfflineIssue(false);
    getAudioContext();
    sfxTap();

    const greeting = speakCueAndWait("hello-lumi", GREETING);
    if (shouldRepair) {
      await repairRequiredStartupAudio().catch(() => false);
    }
    const readyOffline = await waitForOfflineReady();
    await greeting;

    if (!readyOffline) {
      started.current = false;
      setStarting(false);
      setRepairing(false);
      setOfflineIssue(true);
      return;
    }
    setRepairing(false);
    closeStartupUpdateBoundary();
    await showHome();
  };

  const subtitle = starting
    ? repairing
      ? "Repar pachetul local pentru folosire fără internet…"
      : "Pregătesc joaca pentru a funcționa și fără internet…"
    : offlineIssue
      ? "Pachetul local este incomplet. Conectează telefonul la internet și încearcă din nou."
      : "Jocuri logice blânde pentru cei mici";

  return (
    <div className="splash-interaction" onPointerDown={() => void start()}>
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
            markup={drawLumi(
              starting ? "think" : offlineIssue ? "sleepy" : "happy",
              190,
            )}
            className={`splash-lumi lumi ${
              starting ? "think" : offlineIssue ? "sleepy" : "happy"
            } lll-float`}
          />
          <h1 id="splash-title" className="splash-title">
            Logic Lab
          </h1>
          <p className="splash-subtitle" role="status" aria-live="polite">
            {subtitle}
          </p>
          <button
            type="button"
            className="btn-big sun splash-start-button pop-in"
            disabled={starting}
            onClick={() => void start()}
          >
            <Artwork markup={START_ICON} className="splash-start-icon" />
            <span>
              {starting
                ? repairing
                  ? "REPAR…"
                  : "PREGĂTESC…"
                : offlineIssue
                  ? "REPARĂ ȘI ÎNCEARCĂ DIN NOU"
                  : "Atinge și joacă-te!"}
            </span>
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
