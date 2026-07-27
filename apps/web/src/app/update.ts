import { registerSW } from "virtual:pwa-register";

let updateReady = false;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let offlineReady = !import.meta.env.PROD;
let offlineProbe: Promise<boolean> | null = null;

function markOfflineState(state: "preparing" | "ready" | "unavailable"): void {
  document.documentElement.dataset.offlineState = state;
}

async function waitForController(timeoutMs: number): Promise<boolean> {
  if (navigator.serviceWorker.controller) return true;

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    let timeout = 0;
    const finish = (controlled: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(controlled);
    };
    const onChange = () => finish(Boolean(navigator.serviceWorker.controller));
    timeout = window.setTimeout(
      () => finish(Boolean(navigator.serviceWorker.controller)),
      timeoutMs,
    );
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
  });
}

async function currentReleaseIsCached(): Promise<boolean> {
  const htmlIdentity = document.querySelector<HTMLMetaElement>(
    'meta[name="logic-lab-release"]',
  )?.content;
  if (!htmlIdentity) return false;

  const request = new Request(new URL("/release.json", window.location.href));
  const cached = await caches.match(request);
  if (!cached?.ok) return false;

  try {
    const release = (await cached.clone().json()) as { commit?: unknown };
    return release.commit === htmlIdentity;
  } catch {
    return false;
  }
}

function startOfflineProbe(controllerTimeoutMs: number): Promise<boolean> {
  if (offlineReady) return Promise.resolve(true);
  if (offlineProbe) return offlineProbe;

  markOfflineState("preparing");
  const probe = navigator.serviceWorker.ready
    .then(async () => {
      const controlled = await waitForController(controllerTimeoutMs);
      const currentReleaseCached = await currentReleaseIsCached();
      offlineReady = controlled && currentReleaseCached;
      markOfflineState(offlineReady ? "ready" : "unavailable");
      return offlineReady;
    })
    .catch(() => {
      offlineReady = false;
      markOfflineState("unavailable");
      return false;
    })
    .finally(() => {
      if (!offlineReady && offlineProbe === probe) offlineProbe = null;
    });
  offlineProbe = probe;
  return probe;
}

export function initializeAppUpdates(): void {
  if (!import.meta.env.PROD) {
    offlineReady = true;
    markOfflineState("ready");
    return;
  }
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    offlineReady = false;
    offlineProbe = null;
    markOfflineState("unavailable");
    return;
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
    },
  });
  void startOfflineProbe(25_000);
}

export function isOfflineReady(): boolean {
  return offlineReady;
}

/**
 * Așteaptă instalarea completă și identitatea release-ului curent. Un eșec sau
 * timeout poate fi reîncercat; nu păstrăm permanent un rezultat negativ.
 */
export async function waitForOfflineReady(
  timeoutMs = 30_000,
): Promise<boolean> {
  if (offlineReady) return true;
  if (!import.meta.env.PROD) return true;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;

  const probe = startOfflineProbe(timeoutMs);
  return await Promise.race([
    probe,
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
