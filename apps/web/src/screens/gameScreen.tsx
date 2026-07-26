/** Shell React: controale semantice, Lumi, balon și mount-ul scenei Pixi. */

import {
  createRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { drawLumi, type LumiMood } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { attachAmbient } from "../ui/ambient";
import { speak } from "../audio/speech";
import { registerScreenCleanup } from "../app/router";
import { destroyPixiApplication } from "../runtime/pixiApplication";

export interface GameShell {
  readonly screen: HTMLElement;
  readonly mount: HTMLElement;
  readonly setProgress: (done: number, total: number) => void;
  readonly showBubble: (text: string) => void;
  readonly hideBubble: () => void;
  readonly setLumiMood: (mood: LumiMood) => void;
  readonly setScene: (scene: "meadow" | "plain") => void;
}

const HOME_ICON = `<svg viewBox="0 0 48 48"><path d="M8 24 L24 10 L40 24" fill="none" stroke="#4A3F35" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="24" width="20" height="16" rx="3" fill="#4A3F35"/></svg>`;

interface GameShellController {
  readonly mount: HTMLElement;
  readonly setProgress: (done: number, total: number) => void;
  readonly showBubble: (text: string) => void;
  readonly hideBubble: () => void;
  readonly setLumiMood: (mood: LumiMood) => void;
  readonly setScene: (scene: "meadow" | "plain") => void;
}

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

const GameShellView = forwardRef<
  GameShellController,
  {
    readonly onHome: () => void;
    readonly showProgress: boolean;
  }
>(function GameShellView({ onHome, showProgress }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ambientHost = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [bubble, setBubble] = useState<string | null>(null);
  const [mood, setMood] = useState<LumiMood>("idle");
  const [scene, setScene] = useState<"meadow" | "plain">("meadow");
  const [replaying, setReplaying] = useState(false);
  const lastText = useRef("");
  const bubbleTimer = useRef<number | null>(null);
  const replayTimer = useRef<number | null>(null);

  const clearBubbleTimer = () => {
    if (bubbleTimer.current === null) return;
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = null;
  };

  useEffect(() => {
    const host = ambientHost.current;
    if (host) attachAmbient(host);
    return () => {
      clearBubbleTimer();
      if (replayTimer.current !== null) clearTimeout(replayTimer.current);
      host?.replaceChildren();
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      mount: mountRef.current!,
      setProgress(done, total) {
        setProgress({ done, total });
      },
      showBubble(text) {
        lastText.current = text;
        clearBubbleTimer();
        setBubble(text);
        bubbleTimer.current = window.setTimeout(() => {
          setBubble(null);
          bubbleTimer.current = null;
        }, 4500);
      },
      hideBubble() {
        clearBubbleTimer();
        setBubble(null);
      },
      setLumiMood(nextMood) {
        setMood(nextMood);
      },
      setScene,
    }),
    [],
  );

  const replayInstruction = () => {
    if (!lastText.current) return;
    speak(lastText.current);
    if (replayTimer.current !== null) clearTimeout(replayTimer.current);
    setReplaying(true);
    replayTimer.current = window.setTimeout(() => {
      setReplaying(false);
      replayTimer.current = null;
    }, 900);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="game-scenery"
        style={{ opacity: scene === "meadow" ? 1 : 0 }}
        dangerouslySetInnerHTML={{ __html: meadowScene() }}
      />
      <div
        ref={ambientHost}
        aria-hidden="true"
        className="game-ambient-host"
      />

      <header className="top-bar game-topbar">
        <button
          type="button"
          className="btn-icon"
          aria-label="Înapoi acasă"
          onClick={onHome}
        >
          <Artwork markup={HOME_ICON} className="game-home-icon" />
        </button>
        <div
          className={`session-dots${showProgress ? "" : " is-hidden"}`}
          aria-label={
            showProgress && progress.total > 0
              ? `${progress.done} din ${progress.total} jocuri încheiate`
              : undefined
          }
        >
          {Array.from({ length: progress.total }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`dot${index < progress.done ? " done" : ""}`}
            />
          ))}
        </div>
        <button
          type="button"
          className={`game-lumi-button${replaying ? " is-replaying" : ""}`}
          aria-label="Ascultă din nou"
          onClick={replayInstruction}
        >
          <Artwork
            markup={drawLumi(mood, 84)}
            className={`game-lumi-art lumi ${mood}${
              replaying ? " happy" : ""
            }`}
          />
        </button>
      </header>

      <div className="game-bubble-zone" aria-live="polite">
        {bubble === null ? null : (
          <div className="speech-bubble" role="status">
            {bubble}
          </div>
        )}
      </div>

      <div ref={mountRef} className="play-area game-play-area" />
    </>
  );
});

export function buildGameShell(opts: {
  onHome: () => void;
  showProgress?: boolean;
}): GameShell {
  const screen = document.createElement("div");
  screen.className = "bg-meadow game-screen";
  const controllerRef = createRef<GameShellController>();
  const root = createRoot(screen);
  flushSync(() => {
    root.render(
      <GameShellView
        ref={controllerRef}
        onHome={opts.onHome}
        showProgress={opts.showProgress !== false}
      />,
    );
  });
  const controller = controllerRef.current;
  if (!controller) throw new Error("Game shell failed to mount");
  registerScreenCleanup(screen, () => {
    destroyPixiApplication(controller.mount);
    root.unmount();
  });

  return {
    screen,
    mount: controller.mount,
    setProgress(done, total) {
      controller.setProgress(done, total);
    },
    showBubble(text) {
      controller.showBubble(text);
    },
    hideBubble() {
      flushSync(() => controller.hideBubble());
    },
    setLumiMood(mood) {
      controller.setLumiMood(mood);
    },
    setScene(scene) {
      controller.setScene(scene);
    },
  };
}
