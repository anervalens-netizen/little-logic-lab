/** Shell-ul ecranului de joc: bară sus, Lumi cu balon, zonă de joacă. */

import { el, svgEl } from "../ui/dom";
import { drawLumi, type LumiMood } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { attachAmbient } from "../ui/ambient";
import { speak } from "../audio/speech";

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
export function buildGameShell(opts: {
  onHome: () => void;
  showProgress?: boolean;
}): GameShell {
  const screen = el("div", { className: "bg-meadow" });

  const sceneHolder = el("div", {});
  sceneHolder.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
  const sceneArt = svgEl(meadowScene());
  sceneArt.style.cssText = "position:absolute;inset:0;";
  sceneHolder.append(sceneArt);
  screen.append(sceneHolder);
  attachAmbient(screen);

  const topBar = el("div", { className: "top-bar" });
  const homeBtn = el("button", { className: "btn-icon", "aria-label": "Înapoi acasă" });
  homeBtn.append(svgEl(HOME_ICON));
  homeBtn.addEventListener("click", opts.onHome);

  const dots = el("div", { className: "session-dots" });
  if (opts.showProgress === false) dots.style.visibility = "hidden";

  const lumiWrap = el("button", { className: "lumi idle", "aria-label": "Ascultă din nou" });
  lumiWrap.style.cssText = "pointer-events:auto;background:none;";
  const lumiArt = svgEl(drawLumi("idle", 84));
  lumiWrap.append(lumiArt);

  topBar.append(homeBtn, dots, lumiWrap);
  screen.append(topBar);

  const bubbleZone = el("div", {});
  bubbleZone.style.cssText = "display:flex;justify-content:center;padding:2px 16px 4px;min-height:20px;z-index:10;";
  screen.append(bubbleZone);

  const mount = el("div", { className: "play-area" });
  mount.style.zIndex = "5";
  screen.append(mount);

  let bubble: HTMLElement | null = null;
  let lastText = "";
  let bubbleTimer: number | null = null;

  const api: GameShell = {
    screen,
    mount,
    setProgress(done, total) {
      dots.replaceChildren();
      for (let i = 0; i < total; i += 1) {
        dots.append(el("span", { className: `dot${i < done ? " done" : ""}` }));
      }
    },
    showBubble(text) {
      lastText = text;
      bubble?.remove();
      if (bubbleTimer !== null) clearTimeout(bubbleTimer);
      bubble = el("div", { className: "speech-bubble" }, text);
      bubbleZone.append(bubble);
      // Balonul se retrage singur ca să nu acopere jocul; Lumi repetă la atingere.
      bubbleTimer = window.setTimeout(() => {
        bubble?.remove();
        bubble = null;
      }, 4500);
    },
    hideBubble() {
      bubble?.remove();
      bubble = null;
    },
    setLumiMood(mood) {
      lumiWrap.className = `lumi ${mood}`;
      lumiWrap.replaceChildren(svgEl(drawLumi(mood, 84)));
    },
    setScene(scene) {
      sceneHolder.style.opacity = scene === "meadow" ? "1" : "0";
    },
  };

  lumiWrap.addEventListener("click", () => {
    if (lastText) speak(lastText);
    lumiWrap.classList.remove("happy");
    void lumiWrap.offsetWidth;
    lumiWrap.classList.add("happy");
    setTimeout(() => lumiWrap.classList.remove("happy"), 900);
  });

  return api;
}
