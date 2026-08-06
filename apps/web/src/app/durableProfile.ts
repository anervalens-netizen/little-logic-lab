import type { StoredProfile } from "./storage";
import {
  clearEmergencyProfileSnapshot,
  writeEmergencyProfileSnapshot,
} from "./emergencyProfile";

const DATABASE_NAME = "minte-in-joaca";
const PROFILE_STORE = "profiles";
const CURRENT_PROFILE_KEY = "current";
const FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v4";
const IDB_OPEN_TIMEOUT_MS = 6_000;
const IDB_WRITE_TIMEOUT_MS = 8_000;

export type ProfileStorageStatus =
  | "idle"
  | "saving"
  | "healthy"
  | "fallback"
  | "failed";

export interface ProfileStorageHealth {
  readonly status: ProfileStorageStatus;
  readonly lastSavedAtLocal: string | null;
  readonly lastError: string | null;
}

let writeQueue: Promise<void> = Promise.resolve();
let health: ProfileStorageHealth = {
  status: "idle",
  lastSavedAtLocal: null,
  lastError: null,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME);
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("IndexedDB open timed out"));
    }, IDB_OPEN_TIMEOUT_MS);
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      action();
    };
    request.onerror = () =>
      finish(() =>
        reject(request.error ?? new Error("IndexedDB open failed")),
      );
    request.onblocked = () =>
      finish(() => reject(new Error("IndexedDB open was blocked")));
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      finish(() => resolve(request.result));
    };
  });
}

async function saveToIndexedDb(profile: StoredProfile): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        reject(new Error(`Missing IndexedDB store ${PROFILE_STORE}`));
        return;
      }
      const transaction = db.transaction(PROFILE_STORE, "readwrite");
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          transaction.abort();
        } catch {
          // Tranzacția poate fi deja închisă; eroarea de timeout rămâne autoritară.
        }
        reject(new Error("IndexedDB write timed out"));
      }, IDB_WRITE_TIMEOUT_MS);
      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        action();
      };
      transaction.objectStore(PROFILE_STORE).put(profile, CURRENT_PROFILE_KEY);
      transaction.oncomplete = () => finish(resolve);
      transaction.onerror = () =>
        finish(() =>
          reject(transaction.error ?? new Error("IndexedDB transaction failed")),
        );
      transaction.onabort = () =>
        finish(() =>
          reject(transaction.error ?? new Error("IndexedDB transaction aborted")),
        );
    });
  } finally {
    db.close();
  }
}

async function writeSnapshot(
  profile: StoredProfile,
  emergencyToken: string | null,
): Promise<void> {
  health = { ...health, status: "saving", lastError: null };
  try {
    await saveToIndexedDb(profile);
    try {
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
    } catch {
      // Scrierea principală a reușit; cleanup-ul fallback-ului nu este critic.
    }
    if (emergencyToken !== null) {
      clearEmergencyProfileSnapshot(emergencyToken);
    }
    health = {
      status: "healthy",
      lastSavedAtLocal: new Date().toISOString(),
      lastError: null,
    };
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(profile));
      if (emergencyToken !== null) {
        clearEmergencyProfileSnapshot(emergencyToken);
      }
      health = {
        status: "fallback",
        lastSavedAtLocal: new Date().toISOString(),
        lastError: message,
      };
      return;
    } catch (fallbackError) {
      // Snapshot-ul de urgență rămâne disponibil dacă scrierea sincronă a reușit.
      health = {
        status: "failed",
        lastSavedAtLocal: health.lastSavedAtLocal,
        lastError:
          fallbackError instanceof Error
            ? `${message}; fallback: ${fallbackError.message}`
            : `${message}; fallback: ${String(fallbackError)}`,
      };
      throw fallbackError;
    }
  }
}

/**
 * Scrie mai întâi sincron snapshot-ul de urgență, apoi serializează confirmarea
 * IndexedDB. O confirmare veche nu poate șterge snapshot-ul unei mutații noi.
 */
export function queueProfileSave(profile: StoredProfile): void {
  const snapshot = structuredClone(profile);
  const emergencyToken = writeEmergencyProfileSnapshot(snapshot);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeSnapshot(snapshot, emergencyToken));
}

/** Poartă durabilă folosită la final de nivel, sesiune și înainte de ștergere. */
export async function flushProfileWrites(): Promise<void> {
  await writeQueue;
}

export function profileStorageHealth(): ProfileStorageHealth {
  return { ...health };
}

export function resetProfileStorageHealth(): void {
  health = {
    status: "idle",
    lastSavedAtLocal: null,
    lastError: null,
  };
  writeQueue = Promise.resolve();
}
