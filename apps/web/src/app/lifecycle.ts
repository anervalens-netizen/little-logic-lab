import {
  applySettings,
  checkpointProfileSynchronously,
  flushPendingProfileWrites,
} from "./appState";
import { stopMusic } from "../audio/music";
import { stopSpeaking } from "../audio/speech";

function persistBestEffort(): void {
  checkpointProfileSynchronously();
  void flushPendingProfileWrites().catch(() => undefined);
}

/**
 * Leagă limitele browserului de persistența locală și lifecycle-ul audio.
 * Nu anulează nivelul la o simplă minimizare; scena poate fi reluată de browser.
 */
export function installApplicationLifecycle(): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      persistBestEffort();
      stopMusic();
      return;
    }
    applySettings();
  };

  const onPageHide = () => {
    persistBestEffort();
    stopSpeaking();
    stopMusic();
  };

  const onFreeze = () => {
    persistBestEffort();
    stopMusic();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("freeze", onFreeze);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("freeze", onFreeze);
  };
}
