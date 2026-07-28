import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatPackBytes,
  inspectAudioPacks,
  type AudioPackStatus,
} from "../app/contentPacks";

function useParentDataTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findTarget = () =>
      setTarget(document.querySelector<HTMLElement>("#parent-panel-data"));
    findTarget();
    const root = document.getElementById("screen-root");
    if (!root) return;
    const observer = new MutationObserver(findTarget);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return target;
}

function PackRow({ pack }: { readonly pack: AudioPackStatus }) {
  return (
    <article
      className={`parent-content-pack-row${pack.ready ? " is-ready" : " is-missing"}`}
    >
      <div>
        <div className="parent-content-pack-title">
          <strong>{pack.title}</strong>
          {pack.requiredAtStartup ? (
            <span className="parent-content-pack-required">obligatoriu</span>
          ) : null}
        </div>
        <p>{pack.description}</p>
        <p>
          {pack.cachedAssets}/{pack.totalAssets} fișiere ·{" "}
          {formatPackBytes(pack.totalBytes)}
        </p>
      </div>
      <span className="parent-content-pack-state">
        {pack.ready ? "instalat" : `${pack.missingPaths.length} lipsă`}
      </span>
    </article>
  );
}

function ContentPackPanel() {
  const [packs, setPacks] = useState<readonly AudioPackStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPacks(await inspectAudioPacks({ includeBytes: true }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requiredReady = packs
    .filter((pack) => pack.requiredAtStartup)
    .every((pack) => pack.ready);

  return (
    <section
      className="parent-card parent-content-pack-status"
      aria-labelledby="parent-content-packs"
    >
      <div className="parent-card-heading">
        <div>
          <p className="parent-eyebrow">Disponibil fără internet</p>
          <h2 id="parent-content-packs">Pachete locale</h2>
        </div>
        <span
          className={`parent-privacy-chip${requiredReady ? "" : " is-warning"}`}
        >
          {loading ? "verific…" : requiredReady ? "pregătit" : "incomplet"}
        </span>
      </div>
      <p className="parent-help prominent">
        Verificarea citește numai Cache Storage de pe acest dispozitiv și nu face
        request-uri de rețea.
      </p>
      <div className="parent-content-pack-list">
        {packs.map((pack) => (
          <PackRow key={pack.id} pack={pack} />
        ))}
      </div>
      <button
        type="button"
        className="parent-secondary-button"
        disabled={loading}
        onClick={() => void refresh()}
      >
        {loading ? "Verific…" : "Reverifică pachetele"}
      </button>
    </section>
  );
}

export function ContentPackStatusPortal() {
  const target = useParentDataTarget();
  return target ? createPortal(<ContentPackPanel />, target) : null;
}
