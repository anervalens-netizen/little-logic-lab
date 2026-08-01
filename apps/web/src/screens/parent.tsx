import { useMemo, useState } from "react";
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
type ParentTab = "overview" | "settings" | "data";

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
    <div className="setting-row parent-duration-row">
      <span>Durata sesiunii (minute)</span>
      <div className="parent-duration-options">
        {([3, 5, 7] as const).map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="parent-duration-button"
            aria-pressed={value === minutes}
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
  const [activeTab, setActiveTab] = useState<ParentTab>(
    profile.sessionLocked ? "settings" : "overview",
  );
  const [showAllSkills, setShowAllSkills] = useState(false);
  const progressGames = useMemo(() => {
    const seen = new Set<string>();
    return games.filter((game) => {
      if (seen.has(game.skillId)) return false;
      seen.add(game.skillId);
      return true;
    });
  }, [games]);
  const progressItems = useMemo(
    () =>
      progressGames
        .map((game) => {
          const mastery = profile.masteryBySkill[game.skillId];
          const mean = masteryMeanFor(game.skillId);
          return {
            game,
            mean,
            evidenceCount: mastery?.evidenceCount ?? 0,
            status: masteryStatus({
              alpha: mastery?.alpha ?? 2,
              beta: mastery?.beta ?? 2,
              evidenceCount: mastery?.evidenceCount ?? 0,
              lastPracticedAtLocal: mastery?.lastPracticedAtLocal ?? null,
            }),
          };
        })
        .sort(
          (left, right) =>
            right.evidenceCount - left.evidenceCount ||
            right.mean - left.mean ||
            left.game.title.localeCompare(right.game.title, "ro"),
        ),
    [profile.masteryBySkill, progressGames],
  );
  const practicedSkills = progressItems.filter(
    ({ evidenceCount }) => evidenceCount > 0,
  );
  const visibleSkills = showAllSkills
    ? progressItems
    : practicedSkills.slice(0, 6);
  const totalMinutes = profile.sessions.reduce(
    (sum, session) => sum + session.minutes,
    0,
  );

  const changeSettings = (patch: Partial<Settings>) => {
    updateSettings(patch);
    setSettings({ ...getProfile().settings });
  };

  const selectTab = (tab: ParentTab) => {
    sfxTap();
    setActiveTab(tab);
  };

  return (
    <>
      <header className="top-bar parent-topbar">
        <button
          type="button"
          className="btn-icon"
          aria-label="Înapoi"
          onClick={() => void showHome()}
          dangerouslySetInnerHTML={{ __html: BACK_ICON }}
        />
        <h1 className="parent-title">Zonă pentru adulți</h1>
        <span className="parent-topbar-spacer" aria-hidden="true" />
      </header>

      <div className="parent-panel">
        <div className="parent-container">
          <nav className="parent-tabs" aria-label="Secțiuni zonă pentru adulți">
            {(
              [
                ["overview", "Rezumat"],
                ["settings", "Setări"],
                ["data", "Date"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                id={`parent-tab-${tab}`}
                type="button"
                className={`parent-tab${activeTab === tab ? " active" : ""}`}
                aria-controls={`parent-panel-${tab}`}
                aria-pressed={activeTab === tab}
                onClick={() => selectTab(tab)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div
            id="parent-panel-overview"
            className="parent-tab-panel"
            aria-labelledby="parent-tab-overview"
            hidden={activeTab !== "overview"}
          >
            <section className="parent-summary-grid" aria-label="Pe scurt">
              <article className="parent-summary-card">
                <strong>{profile.sessions.length}</strong>
                <span>sesiuni încheiate</span>
              </article>
              <article className="parent-summary-card">
                <strong>{profile.attempts.length}</strong>
                <span>activități încercate</span>
              </article>
              <article className="parent-summary-card">
                <strong>{practicedSkills.length}</strong>
                <span>abilități exersate</span>
              </article>
              <article className="parent-summary-card">
                <strong>{Math.round(totalMinutes)}</strong>
                <span>minute de joacă</span>
              </article>
            </section>

            <section className="parent-card" aria-labelledby="parent-progress">
              <div className="parent-card-heading">
                <div>
                  <p className="parent-eyebrow">Evoluție locală</p>
                  <h2 id="parent-progress">Progres pe abilități</h2>
                </div>
                <span className="parent-privacy-chip">doar pe dispozitiv</span>
              </div>

              {visibleSkills.length === 0 ? (
                <div className="parent-empty-state">
                  <strong>Progresul apare după primele jocuri.</strong>
                  <p>
                    Afișăm tendințe calitative numai după ce există suficiente
                    activități, fără note sau comparații.
                  </p>
                </div>
              ) : (
                <div className="parent-progress-list">
                  {visibleSkills.map(({ game, mean, status }) => (
                    <div className="progress-row" key={game.skillId}>
                      <span className="progress-label">{game.title}</span>
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
                      <span className="progress-status">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!showAllSkills && progressItems.length > visibleSkills.length ? (
                <button
                  type="button"
                  className="parent-secondary-button"
                  onClick={() => setShowAllSkills(true)}
                >
                  Vezi toate cele {progressItems.length} abilități
                </button>
              ) : null}
              {showAllSkills ? (
                <button
                  type="button"
                  className="parent-secondary-button"
                  onClick={() => setShowAllSkills(false)}
                >
                  Arată doar progresul activ
                </button>
              ) : null}
            </section>

            <section className="parent-card" aria-labelledby="parent-activity">
              <div className="parent-card-heading">
                <div>
                  <p className="parent-eyebrow">Ultimele zile</p>
                  <h2 id="parent-activity">Activitate recentă</h2>
                </div>
              </div>
              {profile.sessions.length === 0 ? (
                <div className="parent-empty-state compact">
                  <strong>Nicio sesiune încheiată încă.</strong>
                  <p>Primele activități vor apărea aici după o sesiune.</p>
                </div>
              ) : (
                <div className="parent-activity-list">
                  {profile.sessions
                    .slice(-7)
                    .reverse()
                    .map((session) => (
                      <p key={session.sessionId}>
                        <strong>
                          {new Date(session.atLocal).toLocaleString("ro-RO", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </strong>
                        <span>
                          {session.gamesPlayed} jocuri · ~{session.minutes} minute
                        </span>
                      </p>
                    ))}
                </div>
              )}
            </section>
          </div>

          <div
            id="parent-panel-settings"
            className="parent-tab-panel parent-settings-grid"
            aria-labelledby="parent-tab-settings"
            hidden={activeTab !== "settings"}
          >
            <section className="parent-card" aria-labelledby="parent-session">
              <p className="parent-eyebrow">Ritm calm</p>
              <h2 id="parent-session">Sesiune</h2>
              <SessionMinutes
                value={settings.sessionMinutes}
                onChange={(sessionMinutes) =>
                  changeSettings({ sessionMinutes })
                }
              />
              <ToggleRow
                label="Carduri „de făcut împreună” după jocuri"
                value={settings.coPlayPrompts}
                onChange={(coPlayPrompts) =>
                  changeSettings({ coPlayPrompts })
                }
              />
              {sessionLocked ? (
                <div className="parent-session-unlock" role="status">
                  <p>
                    Sesiunea copilului s-a încheiat. O sesiune nouă poate fi
                    pornită numai de aici.
                  </p>
                  <button
                    type="button"
                    className="btn-big green parent-action-button"
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
              <p className="parent-eyebrow">Confort senzorial</p>
              <h2 id="parent-audio">Sunet și mișcare</h2>
              <ToggleRow
                label="Sunet"
                value={settings.audioEnabled}
                onChange={(audioEnabled) =>
                  changeSettings({ audioEnabled })
                }
              />
              <ToggleRow
                label="Voce (instrucțiuni rostite)"
                value={settings.voiceEnabled}
                onChange={(voiceEnabled) => {
                  changeSettings({ voiceEnabled });
                  if (voiceEnabled) speak("Vocea este pornită! Salut!");
                }}
              />
              <p className="parent-help">
                Vocea românească rulează din fișiere salvate în aplicație; nu
                trimite text sau audio în cloud.
              </p>
              <ToggleRow
                label="Muzică de fundal discretă"
                value={settings.musicEnabled}
                onChange={(musicEnabled) =>
                  changeSettings({ musicEnabled })
                }
              />
              <ToggleRow
                label="Mișcare redusă (fără animații)"
                value={settings.reducedMotion}
                onChange={(reducedMotion) =>
                  changeSettings({ reducedMotion })
                }
              />
            </section>

            <section
              className="parent-card"
              aria-labelledby="parent-accessibility"
            >
              <p className="parent-eyebrow">Adaptări</p>
              <h2 id="parent-accessibility">
                Accesibilitate vizuală și motorie
              </h2>
              <ToggleRow
                label="Contrast ridicat"
                value={settings.highContrast}
                onChange={(highContrast) =>
                  changeSettings({ highContrast })
                }
              />
              <ToggleRow
                label="Ținte tactile extra-mari"
                value={settings.targetSize === "extra_large"}
                onChange={(extraLarge) =>
                  changeSettings({
                    targetSize: extraLarge ? "extra_large" : "large",
                  })
                }
              />
              <ToggleRow
                label="Demonstrații mai lente"
                value={settings.demonstrationSpeed === "slow"}
                onChange={(slow) =>
                  changeSettings({
                    demonstrationSpeed: slow ? "slow" : "normal",
                  })
                }
              />
              <p className="parent-help">
                Aceste opțiuni măresc zonele de atingere și timpul
                explicațiilor, fără să schimbe dificultatea logică.
              </p>
            </section>
          </div>

          <div
            id="parent-panel-data"
            className="parent-tab-panel parent-data-grid"
            aria-labelledby="parent-tab-data"
            hidden={activeTab !== "data"}
          >
            <section className="parent-card" aria-labelledby="parent-data">
              <p className="parent-eyebrow">Controlul familiei</p>
              <h2 id="parent-data">Date locale</h2>
              <p className="parent-help prominent">
                Tot progresul rămâne pe acest dispozitiv. Fără cont, fără
                cloud, fără urmărire.
              </p>
              <div className="parent-data-actions">
                <button
                  type="button"
                  className="btn-big blue parent-action-button"
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
                  className="btn-big coral parent-action-button"
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
              </div>
            </section>

            <section className="parent-card" aria-labelledby="parent-about">
              <p className="parent-eyebrow">Principii</p>
              <h2 id="parent-about">Despre</h2>
              <p className="parent-about-copy">
                Logic Lab exersează abilități concrete prin jocuri scurte
                și blânde. Nu este un test și nu promite „creșterea IQ-ului”.
                Recomandat: sesiuni scurte, împreună cu un adult, fără să
                înlocuiască somnul, mișcarea și joaca liberă.
              </p>
            </section>
          </div>
        </div>
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
