/** Punctul de intrare React: shell semantic, setări și lifecycle global. */

import "./styles.css";
import "./v2.css";
import "./workshop.css";
import "./content-packs.css";
import "./bootstrap-failure.css";
import { createRoot } from "react-dom/client";
import { applySettings, initializeProfile } from "./app/appState";
import { initializeAppUpdates } from "./app/update";
import { AppShell } from "./app/AppShell";

function BootstrapFailure({ message }: { readonly message: string }) {
  return (
    <main className="bootstrap-failure" role="alert">
      <section className="bootstrap-failure-card">
        <h1>Aplicația nu a putut porni</h1>
        <p>
          Datele rămân pe acest dispozitiv. Închide și redeschide aplicația sau
          încearcă din nou.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Încearcă din nou
        </button>
        <details>
          <summary>Detalii tehnice pentru adult</summary>
          <p>{message}</p>
        </details>
      </section>
    </main>
  );
}

const host = document.getElementById("app");
if (!host) throw new Error("Missing #app root");
const root = createRoot(host);

async function bootstrap(): Promise<void> {
  document.documentElement.dataset.bootstrapState = "preparing";
  await initializeProfile();
  applySettings();
  initializeAppUpdates();
  root.render(<AppShell />);
  document.documentElement.dataset.bootstrapState = "ready";
}

void bootstrap().catch((reason: unknown) => {
  document.documentElement.dataset.bootstrapState = "failed";
  const message = reason instanceof Error ? reason.message : String(reason);
  root.render(<BootstrapFailure message={message} />);
});
