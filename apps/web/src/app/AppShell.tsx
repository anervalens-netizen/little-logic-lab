import { useEffect, useState } from "react";
import { ContentPackStatusPortal } from "../screens/ContentPackStatusPortal";
import { installApplicationLifecycle } from "./lifecycle";

function RuntimeFailure({ message }: { readonly message: string }) {
  return (
    <main className="bootstrap-failure" role="alert">
      <section className="bootstrap-failure-card">
        <h1>Aplicația s-a oprit în siguranță</h1>
        <p>
          Progresul local a fost protejat. Reîncarcă aplicația pentru a continua.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reîncarcă aplicația
        </button>
        <details>
          <summary>Detalii tehnice pentru adult</summary>
          <p>{message}</p>
        </details>
      </section>
    </main>
  );
}

export function AppShell() {
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let lastTouchEnd = 0;
    const preventAccidentalZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) event.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", preventAccidentalZoom, {
      passive: false,
    });
    const uninstallLifecycle = installApplicationLifecycle();
    void import("../screens/splash")
      .then(({ showSplash }) => showSplash())
      .catch((reason: unknown) => {
        setStartupError(reason instanceof Error ? reason.message : String(reason));
      });

    return () => {
      document.removeEventListener("touchend", preventAccidentalZoom);
      uninstallLifecycle();
    };
  }, []);

  if (startupError) return <RuntimeFailure message={startupError} />;

  return (
    <>
      <main
        id="screen-root"
        aria-live="polite"
        aria-label="Minte în joacă"
      />
      <ContentPackStatusPortal />
    </>
  );
}
