/** Ecranul principal: pajiștea, Lumi, butonul mare JOACĂ și bule cu jocuri. */

import { el, svgEl } from "../ui/dom";
import { showScreen } from "../app/router";
import { allGames } from "../games/registry";
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

const PARENT_ICON = `<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="8" fill="#4A3F35"/><path d="M 8 42 Q 8 28 24 28 Q 40 28 40 42 Z" fill="#4A3F35"/></svg>`;
const PLAY_ICON = `<svg viewBox="0 0 48 48"><path d="M 16 10 L 40 24 L 16 38 Z" fill="#4A3F35"/></svg>`;

let sessionRunning = false;

export async function showHome(): Promise<void> {
  stopSpeaking();

  await showScreen(() => {
    const screen = el("div", { className: "bg-meadow" });
    screen.setAttribute("data-screen", "home");

    const sceneHolder = el("div", {});
    sceneHolder.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
    const scene = svgEl(meadowScene());
    scene.style.cssText = "position:absolute;inset:0;";
    sceneHolder.append(scene);
    screen.append(sceneHolder);
    attachAmbient(screen);

    const content = el("div", {});
    content.style.cssText =
      "position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:14px 18px calc(18px + env(safe-area-inset-bottom));gap:8px;overflow:hidden;";

    // Bara de sus: titlu + poartă părinte.
    const topBar = el("div", {});
    topBar.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;";
    const title = el("div", {});
    title.style.cssText = "font-size:clamp(26px,4.4vw,40px);font-weight:800;color:#4A3F35;text-shadow:0 2px 0 rgba(255,255,255,0.6);";
    title.textContent = "Minte în joacă";

    const parentBtn = el("button", { className: "btn-icon", "aria-label": "Zonă pentru adulți" });
    parentBtn.append(svgEl(PARENT_ICON));
    parentBtn.addEventListener("click", () => {
      screen.append(openParentGate(() => void showParentScreen()));
    });
    topBar.append(title, parentBtn);

    // Zona erou: Lumi + butonul JOACĂ.
    const hero = el("div", {});
    hero.style.cssText =
      "display:flex;align-items:center;justify-content:center;gap:clamp(14px,4vw,44px);flex:0 1 auto;min-height:0;padding:2px 0;";

    const lumiWrap = el("div", { className: "lumi idle" });
    lumiWrap.append(svgEl(drawLumi("idle", 120)));
    lumiWrap.style.cssText = "flex-shrink:0;width:clamp(88px,17vmin,150px);";

    const playBtn = el("button", { className: "btn-big green", "aria-label": "Joacă" });
    playBtn.style.cssText = "gap:16px;";
    const playIcon = svgEl(PLAY_ICON);
    playIcon.style.cssText = "width:44px;height:44px;background:rgba(255,255,255,0.35);border-radius:50%;padding:8px;";
    playBtn.append(playIcon, "JOACĂ");
    playBtn.addEventListener("click", () => {
      if (sessionRunning) return;
      sessionRunning = true;
      sfxTap();
      void runSession().finally(() => {
        sessionRunning = false;
      });
    });

    hero.append(lumiWrap, playBtn);

    // Bulele cu jocuri.
    const bubblesTitle = el("div", {});
    bubblesTitle.style.cssText = "text-align:center;font-weight:700;color:#7A6C5D;font-size:clamp(15px,2.4vw,20px);";
    bubblesTitle.textContent = "sau alege un joc:";

    const bubbles = el("div", {});
    bubbles.style.cssText =
      "flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill, minmax(clamp(92px,17vmin,140px), 1fr));gap:clamp(10px,2vmin,18px);padding:6px 4px 10px;touch-action:pan-y;-webkit-overflow-scrolling:touch;";

    const games = allGames();
    const unlocked = unlockedGameIds(
      getProfile(),
      new Set(games.map((game) => game.id)),
    );

    for (const game of games.filter((candidate) => unlocked.has(candidate.id))) {
      const bubble = el("button", { className: "choice-card pop-in", "aria-label": game.title });
      bubble.style.cssText = `aspect-ratio:1;background:${game.bubbleColor}26;border-color:${game.bubbleColor};animation-delay:${games.indexOf(game) * 40}ms;display:flex;flex-direction:column;gap:2px;padding:10px;`;
      const art = svgEl(game.icon());
      art.style.cssText = "width:78%;height:78%;flex:1;min-height:0;";
      const name = el("div", {});
      name.style.cssText = "font-size:clamp(11px,1.9vmin,15px);font-weight:700;line-height:1.05;text-align:center;color:#4A3F35;";
      name.textContent = game.title;
      bubble.append(art, name);
      bubble.addEventListener("pointerdown", () => jelly(bubble));
      bubble.addEventListener("click", () => {
        if (sessionRunning) return;
        sessionRunning = true;
        sfxTap();
        void runSession({ singleGameId: game.id }).finally(() => {
          sessionRunning = false;
        });
      });
      bubbles.append(bubble);
    }

    content.append(topBar, hero, bubblesTitle, bubbles);
    screen.append(content);
    return screen;
  });

  // Deblochează audio la prima interacțiune și salută.
  getAudioContext();
}
