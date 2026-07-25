import { registerSW } from "virtual:pwa-register";

let updateReady = false;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function initializeAppUpdates(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
    },
  });
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
