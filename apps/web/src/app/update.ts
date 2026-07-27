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

export function initializeAppUpdates(): void {
  if (!import.meta.env.PROD) {
    markOfflineState("ready");
    return;
  }
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
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
      const currentReleaseCached = await currentReleaseIsCached();
      offlineReady = controlled && currentReleaseCached;
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
