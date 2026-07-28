import { registerSW } from "virtual:pwa-register";
import {
  findCachedResponseByPathname,
  requiredStartupAudioReady,
} from "./contentPacks";

let updateReady = false;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let offlineReady = !import.meta.env.PROD;
let offlineProbePromise: Promise<boolean> | null = null;
let startupUpdateBoundaryOpen = true;

function markOfflineState(state: "preparing" | "ready" | "unavailable"): void {
  document.documentElement.dataset.offlineState = state;
}

function htmlReleaseIdentity(): string | undefined {
  return document.querySelector<HTMLMetaElement>(
    'meta[name="logic-lab-release"]',
  )?.content;
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

async function cachedReleaseMatchesCurrentBuild(): Promise<boolean> {
  const htmlIdentity = htmlReleaseIdentity();
  if (!htmlIdentity) return false;
  const response = await findCachedResponseByPathname("/release.json");
  if (!response?.ok) return false;
  try {
    const release = (await response.json()) as { readonly commit?: string };
    return release.commit === htmlIdentity;
  } catch {
    return false;
  }
}

async function probeOfflineReadiness(): Promise<boolean> {
  if (!import.meta.env.PROD) {
    offlineReady = true;
    markOfflineState("ready");
    return true;
  }
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    offlineReady = false;
    markOfflineState("unavailable");
    return false;
  }

  markOfflineState("preparing");
  try {
    await navigator.serviceWorker.ready;
    const controlled = await waitForController(25_000);
    const releaseMatches =
      controlled && (await cachedReleaseMatchesCurrentBuild());
    const requiredPacksReady =
      releaseMatches && (await requiredStartupAudioReady());
    offlineReady = controlled && releaseMatches && requiredPacksReady;
    markOfflineState(offlineReady ? "ready" : "unavailable");
    return offlineReady;
  } catch {
    offlineReady = false;
    markOfflineState("unavailable");
    return false;
  }
}

function beginOfflineProbe(): Promise<boolean> {
  if (offlineReady) return Promise.resolve(true);
  if (offlineProbePromise !== null) return offlineProbePromise;
  offlineProbePromise = probeOfflineReadiness().finally(() => {
    offlineProbePromise = null;
  });
  return offlineProbePromise;
}

export function initializeAppUpdates(): void {
  if (!import.meta.env.PROD) {
    markOfflineState("ready");
    return;
  }
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    offlineReady = false;
    markOfflineState("unavailable");
    return;
  }

  markOfflineState("preparing");
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
      if (startupUpdateBoundaryOpen) {
        void applyPendingUpdate();
      }
    },
    onOfflineReady() {
      offlineReady = false;
      void beginOfflineProbe();
    },
    onRegisterError() {
      offlineReady = false;
      markOfflineState("unavailable");
    },
  });
  void beginOfflineProbe();
}

export function closeStartupUpdateBoundary(): void {
  startupUpdateBoundaryOpen = false;
}

export function isOfflineReady(): boolean {
  return offlineReady;
}

/**
 * Reîncearcă probe-ul după install lent. Un rezultat negativ nu este memorat
 * permanent; Child Mode rămâne fail-closed până când pachetul local este complet.
 */
export async function waitForOfflineReady(
  timeoutMs = 25_000,
): Promise<boolean> {
  if (offlineReady) return true;
  const probe = beginOfflineProbe();
  return await Promise.race([
    probe,
    new Promise<false>((resolve) =>
      window.setTimeout(() => resolve(false), timeoutMs),
    ),
  ]);
}

/** Activează un build nou numai la Splash sau după limita sigură de sesiune. */
export async function applyPendingUpdate(): Promise<boolean> {
  if (!updateReady || updateServiceWorker === null) return false;
  updateReady = false;
  await updateServiceWorker(true);
  return true;
}
