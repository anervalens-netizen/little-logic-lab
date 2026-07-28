import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { masteryStatus, type MasteryStatus } from "@core";
import {
  flushPendingProfileWrites,
  getProfile,
  getProfileRepairSummary,
  getProfileStorageHealth,
  resetProfile,
  unlockSession,
  updateSettings,
} from "../app/appState";
import type { StoredProfile } from "../app/storage";
import { exportProfileJson } from "../app/storage";
import { isGameAgeEligible } from "../app/content";
import { unlockedGameIds } from "../app/unlocks";
import { registerScreenCleanup, showScreen } from "../app/router";
import { GAME_IDS } from "../generated/game-registry";
import {
  GAME_METADATA,
  type GameMetadata,
} from "../generated/game-metadata";
import { speak } from "../audio/speech";
import { sfxTap } from "../audio/sfx";
import { showHome } from "./home";

const BACK_ICON = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L14 24 L30 38" fill="none" stroke="#4A3F35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const STATUS_LABELS: Record<MasteryStatus, string> = {
  insufficient_evidence: "în explorare",
  emerging: "începe să se lege",
  developing: "devine stabil",
  strong: "pare bine fixat",
};

const STATUS_EXPLANATIONS: Record<MasteryStatus, string> = {
  insufficient_evidence: "Sunt încă prea puține activități pentru o concluzie.",
  emerging: "Reușește uneori și are încă nevoie de sprijin.",
  developing: "Reușita apare tot mai constant în nivelurile exersate.",
  strong: "Folosește abilitatea constant în activitățile practicate.",
};

const DOMAIN_LABELS: Record<string, string> = {
  visual_attention: "Atenție vizuală",
  classification: "Clasificare",
  working_memory: "Memorie de lucru",
  inhibition_flexibility: "Autocontrol și flexibilitate",
  sequencing_patterns: "Ordine și secvențe",
  spatial_planning: "Planificare spațială",
  numeracy: "Numerație timpurie",
  language_social: "Limbaj și emoții",
  fine_motor_creativity: "Coordonare vizual-motorie",
  hybrid_transfer: "Transfer în lumea reală",
};

type Settings = StoredProfile["settings"];
type ParentTab = "overview" | "games" | "settings" | "data";

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

function ParentScreen() {
  const [renderVersion, setRenderVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<ParentTab>(
    getProfile().sessionLocked ? "settings" : "overview",
  );
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [launchingGameId, setLaunchingGameId] = useState<string | null>(null);

  // renderVersion este incrementat după orice mutație locală.
  void renderVersion;
  const profile = getProfile();
  const settings = profile.settings;
  const unlocked = unlockedGameIds(profile, new Set(GAME_IDS));
  const storageHealth = getProfileStorageHealth();
  const repairs = getProfileRepairSummary();

  const progressGames = useMemo(() => {
    const seen = new Set<string>();
    return GAME_METADATA.filter((game) => {
      if (seen.has(game.skillId)) return false;
      seen.add(game.skillId);
      return true;
    });
  }, []);

  const progressItems = progressGames
    .map((game) => {
      const mastery = profile.masteryBySkill[game.skillId];
      const status = masteryStatus({
        alpha: mastery?.alpha ?? 2,
        beta: mastery?.beta ?? 2,
        evidenceCount: mastery?.evidenceCount ?? 0,
        lastPracticedAtLocal: mastery?.lastPracticedAtLocal ?? null,
      });
      return {
        game,
        status,
        evidenceCount: mastery?.evidenceCount ?? 0,
      };
    })
    .sort(
      (left, right) =>
        right.evidenceCount - left.evidenceCount ||
        left.game.title.localeCompare(right.game.title, "ro"),
    );
  const practicedSkills = progressItems.filter((item) => item.evidenceCount > 0);
  const visibleSkills = showAllSkills
    ? progressItems
    : practicedSkills.slice(0, 6);
  const catalogGames = GAME_METADATA.filter((game) =>
    isGameAgeEligible(game.id, profile.ageMonths),
  );
  const totalMinutes = profile.sessions.reduce(
    (sum, session) => sum + session.minutes,
    0,
  );

  const refresh = () => setRenderVersion((version) => version + 1);
  const changeSettings = (patch: Partial<Settings>) => {
    updateSettings(patch);
    refresh();
  };

  const unlockAndReturnHome = async () => {
    sfxTap();
    unlockSession();
    await flushPendingProfileWrites().catch(() => undefined);
    await showHome();
  };

  const launchGame = async (game: GameMetadata) => {
    if (!unlocked.has(game.id) || launchingGameId !== null) return;
    setLaunchingGameId(game.id);
    sfxTap();
    if (getProfile().sessionLocked) unlockSession();
    await flushPendingProfileWrites().catch(() => undefined);
    const { runSession } = await import("../app/session");
    await runSession({ singleGameId: game.id, singleLevelOnly: true });
  };

  const exportData = async () => {
    await flushPendingProfileWrites().catch(() => undefined);
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
  };

  const storageTitle =
    storageHealth.status === "failed"
      ? "Progresul nu poate fi salvat"
      : storageHealth.status === "fallback"
        ? "Progres salvat în modul de rezervă"
        : storageHealth.status === "saving"
          ? "Salvez progresul…"
          : "Stocare locală pregătită";

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
                ["games", "Jocuri"],
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
                onClick={() => {
                  sfxTap();
                  setActiveTab(tab);
                }}
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
                  <h2 id="parent-progress">Tendințe observate</h2>
                </div>
                <span className="parent-privacy-chip">doar pe dispozitiv</span>
              </div>
              {visibleSkills.length === 0 ? (
                <div className="parent-empty-state">
                  <strong>Progresul apare după primele jocuri.</strong>
                  <p>Concluziile rămân prudente și se bazează pe activități repetate.</p>
                </div>
              ) : (
                <div className="parent-progress-list">
                  {visibleSkills.map(({ game, evidenceCount, status }) => (
                    <article className="parent-skill-card" key={game.skillId}>
                      <div>
                        <strong>{game.learningGoal}</strong>
                        <p>{STATUS_EXPLANATIONS[status]}</p>
                        <p>
                          {evidenceCount}{" "}
                          {evidenceCount === 1 ? "activitate" : "activități"}
                        </p>
                      </div>
                      <span className="parent-skill-state">
                        {STATUS_LABELS[status]}
                      </span>
                    </article>
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
              <p className="parent-eyebrow">Ultimele zile</p>
              <h2 id="parent-activity">Activitate recentă</h2>
              {profile.sessions.length === 0 ? (
                <div className="parent-empty-state compact">
                  <strong>Nicio sesiune încheiată încă.</strong>
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
                          {session.gamesPlayed} activități · ~{session.minutes} minute
                        </span>
                      </p>
                    ))}
                </div>
              )}
            </section>
          </div>

          <div
            id="parent-panel-games"
            className="parent-tab-panel"
            aria-labelledby="parent-tab-games"
            hidden={activeTab !== "games"}
          >
            <section className="parent-card" aria-labelledby="parent-games-title">
              <p className="parent-eyebrow">Catalog controlat de adult</p>
              <h2 id="parent-games-title">Jocuri disponibile</h2>
              <p className="parent-help prominent">
                Copilul vede aventura ghidată. De aici poți testa un singur nivel
                dintr-un joc deja deblocat.
              </p>
              <div className="parent-game-catalog">
                {catalogGames.map((game) => {
                  const isUnlocked = unlocked.has(game.id);
                  const progress = profile.progressByGame[game.id];
                  return (
                    <article
                      key={game.id}
                      className={`parent-game-catalog-item${
                        isUnlocked ? "" : " is-locked"
                      }`}
                    >
                      <div className="parent-game-catalog-copy">
                        <strong>{game.title}</strong>
                        <p>{game.learningGoal}</p>
                        <p>
                          {DOMAIN_LABELS[game.domain] ?? game.domain} ·{" "}
                          {progress?.timesPlayed ?? 0} încercări
                        </p>
                      </div>
                      {isUnlocked ? (
                        <button
                          type="button"
                          className="parent-game-launch"
                          disabled={launchingGameId !== null}
                          onClick={() => void launchGame(game)}
                        >
                          {launchingGameId === game.id
                            ? "Pornesc…"
                            : "Testează un nivel"}
                        </button>
                      ) : (
                        <span className="parent-game-status">
                          se deblochează gradual
                        </span>
                      )}
                    </article>
                  );
                })}
              </div>
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
                onChange={(sessionMinutes) => changeSettings({ sessionMinutes })}
              />
              <ToggleRow
                label="Carduri de făcut împreună după jocuri"
                value={settings.coPlayPrompts}
                onChange={(coPlayPrompts) => changeSettings({ coPlayPrompts })}
              />
              {profile.sessionLocked ? (
                <div className="parent-session-unlock" role="status">
                  <p>
                    Sesiunea copilului s-a încheiat. O sesiune nouă poate fi
                    pornită numai de aici.
                  </p>
                  <button
                    type="button"
                    className="btn-big green parent-action-button"
                    onClick={() => void unlockAndReturnHome()}
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
              <p className="parent-help">
                Vocea rulează din fișiere locale și nu trimite nimic în cloud.
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

            <section className="parent-card" aria-labelledby="parent-accessibility">
              <p className="parent-eyebrow">Adaptări</p>
              <h2 id="parent-accessibility">Accesibilitate vizuală și motorie</h2>
              <ToggleRow
                label="Contrast ridicat"
                value={settings.highContrast}
                onChange={(highContrast) => changeSettings({ highContrast })}
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
                Tot progresul rămâne pe acest dispozitiv. Fără cont și fără
                urmărire.
              </p>
              <div
                className={`parent-storage-health${
                  storageHealth.status === "failed" ||
                  storageHealth.status === "fallback"
                    ? " is-warning"
                    : ""
                }`}
                role="status"
              >
                <strong>{storageTitle}</strong>
                <p>
                  {storageHealth.lastSavedAtLocal
                    ? `Ultima confirmare: ${new Date(
                        storageHealth.lastSavedAtLocal,
                      ).toLocaleString("ro-RO")}`
                    : "Prima salvare va fi confirmată după o modificare sau un joc."}
                </p>
              </div>

              {repairs.length > 0 ? (
                <div className="parent-storage-health is-warning" role="status">
                  <strong>Date locale reparate automat</strong>
                  <p>
                    Au fost corectate {repairs.length} secțiuni sau valori invalide,
                    păstrând datele sănătoase.
                  </p>
                  <details>
                    <summary>Vezi detaliile tehnice</summary>
                    <ul>
                      {repairs.slice(0, 12).map((repair, index) => (
                        <li key={`${repair}-${index}`}>{repair}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              ) : null}

              <div className="parent-data-actions">
                <button
                  type="button"
                  className="btn-big blue parent-action-button"
                  onClick={() => void exportData()}
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
                Minte în joacă exersează abilități concrete prin jocuri scurte și
                blânde. Nu este un test și nu promite creșterea IQ-ului. Sesiunile
                nu înlocuiesc somnul, mișcarea sau joaca liberă.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export async function showParentScreen(): Promise<void> {
  await showScreen(() => {
    const screen = document.createElement("div");
    screen.className = "bg-meadow";
    screen.dataset.screen = "parent";
    const root = createRoot(screen);
    root.render(<ParentScreen />);
    registerScreenCleanup(screen, () => root.unmount());
    return screen;
  });
}
