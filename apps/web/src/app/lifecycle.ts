import {
  applySettings,
  flushPendingProfileWrites,
} from "./appState";
import { stopMusic } from "../audio/music";
import { stopSpeaking } from "../audio/speech";

function persistBestEffort(): void {
  // Fiecare mutație a profilului scrie deja sincron un emergency snapshot în
  // queueProfileSave(), înainte de IndexedDB. Re-snapshot-ul necondiționat aici
  // putea copia o stare veche din memorie peste un IndexedDB mai nou la reload.
  // La limitele lifecycle doar lăsăm coada deja protejată să se confirme.
  void flushPendingProfileWrites().catch(() => undefined);
}

/**
 * Leagă limitele browserului de persistența locală și lifecycle-ul audio.
 * Nivelul nu este anulat la minimizare, dar vocea și muzica sunt oprite pentru
 * ca revenirea să nu păstreze un speech gate sau un nod audio suspendat.
 */
export function installApplicationLifecycle(): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      persistBestEffort();
      stopSpeaking();
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
    stopSpeaking();
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
