/** Punctul de intrare: stiluri, setări, service worker, splash. */

import "./styles.css";
import { applySettings } from "./app/appState";
import { showSplash } from "./screens/splash";

applySettings();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Încălzește cache-ul cu toate resursele paginii curente (offline din prima vizită).
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => (entry as PerformanceResourceTiming).name)
          .filter((name) => name.startsWith(window.location.origin));
        urls.push(
          `${window.location.origin}/fonts/baloo2-500.woff2`,
          `${window.location.origin}/fonts/baloo2-700.woff2`,
          `${window.location.origin}/fonts/baloo2-800.woff2`,
          `${window.location.origin}/manifest.webmanifest`,
        );
        registration.active?.postMessage({ type: "warm", urls: [...new Set(urls)] });
      })
      .catch(() => {
        // Fără SW aplicația funcționează la fel; doar offline-ul la prima vizită e afectat.
      });
  });
}

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
