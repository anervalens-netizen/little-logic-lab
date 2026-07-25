/**
 * Ecranul părintelui (în spatele porții):
 * progres pe abilități, setări de sesiune și audio, date locale.
 */

import { masteryStatus, type MasteryStatus } from "@core";
import { el, svgEl } from "../ui/dom";
import { showScreen } from "../app/router";
import {
  getProfile,
  updateSettings,
  resetProfile,
  masteryMeanFor,
} from "../app/appState";
import { exportProfileJson } from "../app/storage";
import { allGames } from "../games/registry";
import { speak } from "../audio/speech";
import { sfxTap } from "../audio/sfx";
import { showHome } from "./home";

const BACK_ICON = `<svg viewBox="0 0 48 48"><path d="M 30 10 L 14 24 L 30 38" fill="none" stroke="#4A3F35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const STATUS_LABELS: Record<MasteryStatus, string> = {
  insufficient_evidence: "prea puține date",
  emerging: "începe să prindă",
  developing: "în dezvoltare",
  strong: "stăpânește bine",
};

function toggleRow(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const row = el("div", { className: "setting-row" });
  const name = el("span", {}, label);
  const toggle = el("button", { className: `toggle${value ? " on" : ""}`, role: "switch", "aria-checked": String(value), "aria-label": label });
  toggle.addEventListener("click", () => {
    const next = !toggle.classList.contains("on");
    toggle.classList.toggle("on", next);
    toggle.setAttribute("aria-checked", String(next));
    sfxTap();
    onChange(next);
  });
  row.append(name, toggle);
  return row;
}

function segmentedRow(
  label: string,
  options: readonly { value: number; label: string }[],
  current: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = el("div", { className: "setting-row" });
  row.style.flexWrap = "wrap";
  const name = el("span", {}, label);
  const group = el("div", {});
  group.style.cssText = "display:flex;gap:8px;";
  const buttons: HTMLButtonElement[] = [];
  for (const option of options) {
    const btn = el("button", {
      className: "btn-big",
      style: `font-size:18px;min-height:52px;padding:8px 20px;${option.value === current ? "" : "opacity:0.45;"}`,
    }, option.label) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      sfxTap();
      for (const b of buttons) b.style.opacity = "0.45";
      btn.style.opacity = "1";
      onChange(option.value);
    });
    buttons.push(btn);
    group.append(btn);
  }
  row.append(name, group);
  return row;
}

export async function showParentScreen(): Promise<void> {
  await showScreen(() => {
    const profile = getProfile();

    const screen = el("div", { className: "bg-meadow" });
    const topBar = el("div", { className: "top-bar" });
    const backBtn = el("button", { className: "btn-icon", "aria-label": "Înapoi" });
    backBtn.append(svgEl(BACK_ICON));
    backBtn.addEventListener("click", () => {
      void showHome();
    });
    const title = el("h1", { style: "font-size:26px;font-weight:800;" }, "Zonă pentru adulți");
    topBar.append(backBtn, title, el("span", { style: "width:72px;" }));

    const panel = el("div", { className: "parent-panel" });

    // --- Progres pe abilități ---
    const progressCard = el("div", { className: "parent-card" });
    progressCard.append(el("h2", {}, "Progres pe abilități"));
    const seen = new Set<string>();
    for (const game of allGames()) {
      if (seen.has(game.skillId)) continue;
      seen.add(game.skillId);
      const mastery = getProfile().masteryBySkill[game.skillId];
      const mean = masteryMeanFor(game.skillId);
      const status = masteryStatus({
        alpha: mastery?.alpha ?? 2,
        beta: mastery?.beta ?? 2,
        evidenceCount: mastery?.evidenceCount ?? 0,
        lastPracticedAtLocal: mastery?.lastPracticedAtLocal ?? null,
      });
      const row = el("div", { className: "progress-row" });
      const label = el("span", { style: "width:44%;font-weight:700;font-size:15px;" }, game.title);
      const bar = el("div", { className: "progress-bar" });
      const fill = el("div", { className: "progress-fill" });
      fill.style.width = `${Math.round(mean * 100)}%`;
      bar.append(fill);
      const statusText = el("span", { style: "font-size:13px;color:#7A6C5D;width:26%;" }, STATUS_LABELS[status]);
      row.append(label, bar, statusText);
      progressCard.append(row);
    }

    // --- Sesiuni recente ---
    const sessionsCard = el("div", { className: "parent-card" });
    sessionsCard.append(el("h2", {}, "Activitate recentă"));
    const sessions = profile.sessions.slice(-7).reverse();
    if (sessions.length === 0) {
      sessionsCard.append(el("p", { style: "color:#7A6C5D;" }, "Nicio sesiune încheiată încă."));
    } else {
      for (const s of sessions) {
        sessionsCard.append(
          el("p", { style: "padding:3px 0;font-size:15px;" },
            `${new Date(s.atLocal).toLocaleString("ro-RO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} — ${s.gamesPlayed} jocuri, ~${s.minutes} minute`),
        );
      }
    }
    const totalAttempts = profile.attempts.length;
    sessionsCard.append(el("p", { style: "margin-top:8px;font-size:14px;color:#7A6C5D;" }, `Total încercări înregistrate local: ${totalAttempts}. Datele nu părăsesc dispozitivul.`));

    // --- Setări sesiune ---
    const sessionCard = el("div", { className: "parent-card" });
    sessionCard.append(el("h2", {}, "Sesiune"));
    sessionCard.append(
      segmentedRow(
        "Durata sesiunii (minute)",
        [
          { value: 3, label: "3" },
          { value: 5, label: "5" },
          { value: 7, label: "7" },
        ],
        profile.settings.sessionMinutes,
        (v) => updateSettings({ sessionMinutes: v as 3 | 5 | 7 }),
      ),
      toggleRow("Carduri „de făcut împreună” după jocuri", profile.settings.coPlayPrompts, (v) =>
        updateSettings({ coPlayPrompts: v }),
      ),
    );

    // --- Setări audio & mișcare ---
    const audioCard = el("div", { className: "parent-card" });
    audioCard.append(el("h2", {}, "Sunet și mișcare"));
    audioCard.append(
      toggleRow("Sunet", profile.settings.audioEnabled, (v) => updateSettings({ audioEnabled: v })),
      toggleRow("Voce (instrucțiuni rostite)", profile.settings.voiceEnabled, (v) => {
        updateSettings({ voiceEnabled: v });
        if (v) speak("Vocea este pornită! Salut!");
      }),
      toggleRow("Muzică de fundal discretă", profile.settings.musicEnabled, (v) =>
        updateSettings({ musicEnabled: v }),
      ),
      toggleRow("Mișcare redusă (fără animații)", profile.settings.reducedMotion, (v) =>
        updateSettings({ reducedMotion: v }),
      ),
    );

    // --- Date locale ---
    const dataCard = el("div", { className: "parent-card" });
    dataCard.append(el("h2", {}, "Date locale"));
    dataCard.append(
      el("p", { style: "color:#7A6C5D;font-size:14px;margin-bottom:12px;" },
        "Tot progresul rămâne pe acest dispozitiv. Fără cont, fără cloud, fără urmărire."),
    );
    const exportBtn = el("button", { className: "btn-big blue", style: "font-size:18px;min-height:56px;padding:10px 24px;margin-right:10px;" }, "Exportă progresul (JSON)");
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([exportProfileJson(getProfile())], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = el("a", { href: url, download: `minte-in-joaca-progres-${new Date().toISOString().slice(0, 10)}.json` });
      a.click();
      URL.revokeObjectURL(url);
    });
    const deleteBtn = el("button", { className: "btn-big coral", style: "font-size:18px;min-height:56px;padding:10px 24px;" }, "Șterge progresul");
    deleteBtn.addEventListener("click", () => {
      if (window.confirm("Sigur ștergi tot progresul local? Acțiunea nu poate fi anulată.")) {
        resetProfile();
        window.location.reload();
      }
    });
    dataCard.append(exportBtn, deleteBtn);

    // --- Despre ---
    const aboutCard = el("div", { className: "parent-card" });
    aboutCard.append(el("h2", {}, "Despre"));
    aboutCard.append(
      el("p", { style: "font-size:14px;color:#7A6C5D;line-height:1.5;" },
        "Minte în joacă exersează abilități concrete (potrivire, sortare, memorie, inhibiție, ordonare, numărație timpurie) prin jocuri scurte și blânde. Nu este un test și nu promite „creșterea IQ-ului”. Recomandat: sesiuni scurte, împreună cu un adult, fără să înlocuiască somnul, mișcarea și joaca liberă."),
    );

    panel.append(progressCard, sessionsCard, sessionCard, audioCard, dataCard, aboutCard);
    screen.append(topBar, panel);
    return screen;
  });
}
