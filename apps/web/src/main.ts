/** Punctul de intrare: stiluri, setări, update PWA și splash. */

import "./styles.css";
import { applySettings } from "./app/appState";
import { showSplash } from "./screens/splash";
import { initializeAppUpdates } from "./app/update";

applySettings();
initializeAppUpdates();

// Blochează gesturile de zoom accidental pe dublu-atingere (copiii lovesc ecranul des).
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) event.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false },
);

void showSplash();
