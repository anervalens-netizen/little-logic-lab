/** Ecranul de pornire: logo + Lumi; prima atingere deblochează audio. */

import { el, svgEl } from "../ui/dom";
import { showScreen } from "../app/router";
import { drawLumi } from "../art/lumi";
import { meadowScene } from "../art/scenery";
import { getAudioContext } from "../audio/audio";
import { speak } from "../audio/speech";
import { showHome } from "./home";
import { sfxWin } from "../audio/sfx";

export async function showSplash(): Promise<void> {
  let advanced = false;

  await showScreen(() => {
    const screen = el("div", { className: "bg-meadow" });
    screen.style.cssText =
      "display:flex;align-items:center;justify-content:center;cursor:pointer;";

    const sceneHolder = el("div", {});
    sceneHolder.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
    const scene = svgEl(meadowScene());
    scene.style.cssText = "position:absolute;inset:0;";
    sceneHolder.append(scene);
    screen.append(sceneHolder);

    const center = el("div", {});
    center.style.cssText =
      "position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:18px;padding:20px;text-align:center;";

    const lumiWrap = el("div", { className: "lumi happy" });
    lumiWrap.append(svgEl(drawLumi("happy", 170)));

    const title = el("div", {});
    title.style.cssText =
      "font-size:clamp(40px,9vw,84px);font-weight:800;color:#4A3F35;text-shadow:0 4px 0 rgba(255,255,255,0.65);letter-spacing:0.01em;";
    title.textContent = "Minte în joacă";

    const subtitle = el("div", {});
    subtitle.style.cssText = "font-size:clamp(18px,3.4vw,28px);font-weight:700;color:#7A6C5D;";
    subtitle.textContent = "Jocuri logice blânde pentru cei mici";

    const hint = el("div", { className: "btn-big sun pop-in" });
    hint.style.cssText = "margin-top:14px;pointer-events:none;";
    hint.textContent = "Atinge și joacă-te!";

    center.append(lumiWrap, title, subtitle, hint);
    screen.append(center);

    screen.addEventListener("pointerdown", () => {
      if (advanced) return;
      advanced = true;
      getAudioContext();
      sfxWin();
      speak("Salut! Eu sunt Lumi! Hai să ne jucăm împreună!");
      void showHome();
    });

    return screen;
  });
}
