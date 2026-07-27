/** Punctul de intrare React: shell semantic, setări și lifecycle global. */

import "./styles.css";
import "./v2.css";
import { createRoot } from "react-dom/client";
import { applySettings, initializeProfile } from "./app/appState";
import { initializeAppUpdates } from "./app/update";
import { AppShell } from "./app/AppShell";

async function bootstrap(): Promise<void> {
  await initializeProfile();
  applySettings();
  initializeAppUpdates();

  const host = document.getElementById("app");
  if (!host) throw new Error("Missing #app root");
  createRoot(host).render(<AppShell />);
}

void bootstrap();
