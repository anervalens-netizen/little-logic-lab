import { useMemo, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { masteryStatus, type MasteryStatus } from "@core";
import {
  getProfile,
  updateSettings,
  resetProfile,
  masteryMeanFor,
  unlockSession,
} from "../app/appState";
import type { StoredProfile } from "../app/storage";
import { exportProfileJson } from "../app/storage";
import { registerScreenCleanup, showScreen } from "../app/router";
import { loadAllGames } from "../generated/game-registry";
import type { WebGame } from "../games/types";
import { speak } from "../audio/speech";
import { sfxTap } from "../audio/sfx";
import { showHome } from "./home";

const BACK_ICON = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M 30 10 L 14 24 L 30 38" fill="none" stroke="#4A3F35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const STATUS_LABELS: Record<MasteryStatus, string> = {
  insufficient_evidence: "prea puține date",
  emerging: "începe să prindă",
  developing: "în dezvoltare",
  strong: "stăpânește bine",
};

type Settings = StoredProfile["settings"];

function ToggleRow({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <button
        className={`toggle${value ? " on" : ""}`}
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => {
          sfxTap();
          onChange(!value);
        }}
      />
    </div>
  );
}

function SessionMinutes({
  value,
  onChange,
}: {
  readonly value: Settings["sessionMinutes"];
  readonly onChange: (value: Settings["sessionMinutes"]) => void;
}) {
  return (
    <div className="setting-row" style={{ flexWrap: "wrap" }}>
      <span>Durata sesiunii (minute)</span>
      <div style={{ display: "flex", gap: 8 }}>
        {([3, 5, 7] as const).map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="btn-big"
            aria-pressed={value === minutes}
            style={{
              fontSize: 18,
              minHeight: 52,
              padding: "8px 20px",
              opacity: value === minutes ? 1 : 0.45,
            }}
            onClick={() => {
              sfxTap();
              onChange(minutes);
            }}
          >
            {minutes}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParentScreen({ games }: { readonly games: readonly WebGame[] }) {
  const profile = getProfile();
  const [settings, setSettings] = useState(profile.settings);
  const [sessionLocked, setSessionLocked] = useState(profile.sessionLocked);
  const [deleting, setDeleting] = useState(false);
  const progressGames = useMemo(() => {
    const seen = new Set<string>();
    return games.filter((game) => {
      if (seen.has(game.skillId)) return false;
      seen.add(game.skillId);
      return true;
    });
  }, [games]);

  const changeSettings = (patch: Partial<Settings>) => {
    updateSettings(patch);
    setSettings({ ...getProfile().settings });
  };

  const compactButton: CSSProperties = {
    fontSize: 18,
    minHeight: 56,
    padding: "10px 24px",
  };

  return (
    <>
      <div className="top-bar">
        <button
          type="button"
          className="btn-icon"
          aria-label="Înapoi"
          onClick={() => void showHome()}
          dangerouslySetInnerHTML={{ __html: BACK_ICON }}
        />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Zonă pentru adulți</h1>
        <span style={{ width: 72 }} aria-hidden="true" />
      </div>

      <div className="parent-panel">
        <section className="parent-card" aria-labelledby="parent-progress">
          <h2 id="parent-progress">Progres pe abilități</h2>
          {progressGames.map((game) => {
            const mastery = profile.masteryBySkill[game.skillId];
            const mean = masteryMeanFor(game.skillId);
            const status = masteryStatus({
              alpha: mastery?.alpha ?? 2,
              beta: mastery?.beta ?? 2,
              evidenceCount: mastery?.evidenceCount ?? 0,
              lastPracticedAtLocal: mastery?.lastPracticedAtLocal ?? null,
            });
            return (
              <div className="progress-row" key={game.skillId}>
                <span style={{ width: "44%", fontWeight: 700, fontSize: 15 }}>
                  {game.title}
                </span>
                <div
                  className="progress-bar"
                  role="meter"
                  aria-label={`Progres ${game.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(mean * 100)}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(mean * 100)}%` }}
                  />
                </div>
                <span
                  style={{ fontSize: 13, color: "#7A6C5D", width: "26%" }}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
            );
          })}
        </section>

        <section className="parent-card" aria-labelledby="parent-activity">
          <h2 id="parent-activity">Activitate recentă</h2>
          {profile.sessions.length === 0 ? (
            <p style={{ color: "#7A6C5D" }}>Nicio sesiune încheiată încă.</p>
          ) : (
            profile.sessions
              .slice(-7)
              .reverse()
              .map((session) => (
                <p
                  key={session.sessionId}
                  style={{ padding: "3px 0", fontSize: 15 }}
                >
                  {new Date(session.atLocal).toLocaleString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" — "}
                  {session.gamesPlayed} jocuri, ~{session.minutes} minute
                </p>
              ))
          )}
          <p
            style={{ marginTop: 8, fontSize: 14, color: "#7A6C5D" }}
          >
            Total încercări înregistrate local: {profile.attempts.length}. Datele
            nu părăsesc dispozitivul.
          </p>
        </section>

        <section className="parent-card" aria-labelledby="parent-session">
          <h2 id="parent-session">Sesiune</h2>
          <SessionMinutes
            value={settings.sessionMinutes}
            onChange={(sessionMinutes) => changeSettings({ sessionMinutes })}
          />
          <ToggleRow
            label="Carduri „de făcut împreună” după jocuri"
            value={settings.coPlayPrompts}
            onChange={(coPlayPrompts) => changeSettings({ coPlayPrompts })}
          />
          {sessionLocked ? (
            <div
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 20,
                background: "rgba(127, 200, 107, 0.16)",
              }}
            >
              <p style={{ marginBottom: 12, color: "#4A3F35" }}>
                Sesiunea copilului s-a încheiat. O sesiune nouă poate fi
                pornită numai de aici.
              </p>
              <button
                type="button"
                className="btn-big green"
                style={compactButton}
                onClick={() => {
                  sfxTap();
                  unlockSession();
                  setSessionLocked(false);
                  void showHome();
                }}
              >
                Permite o sesiune nouă
              </button>
            </div>
          ) : null}
        </section>

        <section className="parent-card" aria-labelledby="parent-audio">
          <h2 id="parent-audio">Sunet și mișcare</h2>
          <ToggleRow
            label="Sunet"
            value={settings.audioEnabled}
            onChange={(audioEnabled) => changeSettings({ audioEnabled })}
          />
          <ToggleRow
            label="Voce (instrucțiuni rostite)"
            value={settings.voiceEnabled}
            onChange={(voiceEnabled) => {
              changeSettings({ voiceEnabled });
              if (voiceEnabled) speak("Vocea este pornită! Salut!");
            }}
          />
          <p style={{ color: "#7A6C5D", fontSize: 14, margin: "2px 0 10px" }}>
            Vocea este sintetică, în limba română, și rulează din fișiere
            salvate în aplicație; nu trimite text sau audio în cloud.
          </p>
          <ToggleRow
            label="Muzică de fundal discretă"
            value={settings.musicEnabled}
            onChange={(musicEnabled) => changeSettings({ musicEnabled })}
          />
          <ToggleRow
            label="Mișcare redusă (fără animații)"
            value={settings.reducedMotion}
            onChange={(reducedMotion) => changeSettings({ reducedMotion })}
          />
        </section>

        <section className="parent-card" aria-labelledby="parent-data">
          <h2 id="parent-data">Date locale</h2>
          <p
            style={{ color: "#7A6C5D", fontSize: 14, marginBottom: 12 }}
          >
            Tot progresul rămâne pe acest dispozitiv. Fără cont, fără cloud,
            fără urmărire.
          </p>
          <button
            type="button"
            className="btn-big blue"
            style={{ ...compactButton, marginRight: 10 }}
            onClick={() => {
              const blob = new Blob([exportProfileJson(getProfile())], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `minte-in-joaca-progres-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportă progresul (JSON)
          </button>
          <button
            type="button"
            className="btn-big coral"
            style={compactButton}
            disabled={deleting}
            onClick={async () => {
              if (
                !window.confirm(
                  "Sigur ștergi tot progresul local? Acțiunea nu poate fi anulată.",
                )
              ) {
                return;
              }
              setDeleting(true);
              await resetProfile();
              window.location.reload();
            }}
          >
            {deleting ? "Se șterge…" : "Șterge progresul"}
          </button>
        </section>

        <section className="parent-card" aria-labelledby="parent-about">
          <h2 id="parent-about">Despre</h2>
          <p
            style={{
              fontSize: 14,
              color: "#7A6C5D",
              lineHeight: 1.5,
            }}
          >
            Minte în joacă exersează abilități concrete prin jocuri scurte și
            blânde. Nu este un test și nu promite „creșterea IQ-ului”.
            Recomandat: sesiuni scurte, împreună cu un adult, fără să înlocuiască
            somnul, mișcarea și joaca liberă.
          </p>
        </section>
      </div>
    </>
  );
}

export async function showParentScreen(): Promise<void> {
  const games = await loadAllGames();
  await showScreen(() => {
    const screen = document.createElement("div");
    screen.className = "bg-meadow";
    screen.dataset.screen = "parent";
    const root = createRoot(screen);
    root.render(<ParentScreen games={games} />);
    registerScreenCleanup(screen, () => root.unmount());
    return screen;
  });
}
