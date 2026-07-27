import { registerSW } from "virtual:pwa-register";

let updateReady = false;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let offlineReady = !import.meta.env.PROD;
let offlineReadyPromise: Promise<boolean> = Promise.resolve(offlineReady);

function markOfflineState(state: "preparing" | "ready" | "unavailable"): void {
  document.documentElement.dataset.offlineState = state;
}

async function waitForController(timeoutMs: number): Promise<boolean> {
  if (navigator.serviceWorker.controller) return true;

  return await new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(Boolean(navigator.serviceWorker.controller));
    }, timeoutMs);
    const onChange = () => {
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
  });
}

export function initializeAppUpdates(): void {
  if (!import.meta.env.PROD) {
    markOfflineState("ready");
    return;
  }
  if (!("serviceWorker" in navigator)) {
    offlineReady = false;
    offlineReadyPromise = Promise.resolve(false);
    markOfflineState("unavailable");
    return;
  }

  markOfflineState("preparing");
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
    },
  });

  offlineReadyPromise = navigator.serviceWorker.ready
    .then(async () => {
      const controlled = await waitForController(8_000);
      const release = await caches.match("/release.json");
      offlineReady = controlled && Boolean(release?.ok);
      markOfflineState(offlineReady ? "ready" : "unavailable");
      return offlineReady;
    })
    .catch(() => {
      offlineReady = false;
      markOfflineState("unavailable");
      return false;
    });
}

export function isOfflineReady(): boolean {
  return offlineReady;
}

/**
 * Așteaptă pregătirea completă a build-ului offline, dar nu blochează la infinit
 * primul ecran dacă browserul refuză service worker-ul.
 */
export async function waitForOfflineReady(
  timeoutMs = 8_000,
): Promise<boolean> {
  if (offlineReady) return true;
  return await Promise.race([
    offlineReadyPromise,
    new Promise<false>((resolve) =>
      window.setTimeout(() => resolve(false), timeoutMs),
    ),
  ]);
}

/**
 * Activează build-ul nou numai la o limită sigură de sesiune.
 * Returnează true când reload-ul a fost cerut.
 */
export async function applyPendingUpdate(): Promise<boolean> {
  if (!updateReady || updateServiceWorker === null) return false;
  updateReady = false;
  await updateServiceWorker(true);
  return true;
}
