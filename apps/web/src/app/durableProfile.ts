import type { StoredProfile } from "./storage";

const DATABASE_NAME = "minte-in-joaca";
const PROFILE_STORE = "profiles";
const CURRENT_PROFILE_KEY = "current";
const FALLBACK_STORAGE_KEY = "minte-in-joaca/idb-fallback-v4";

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
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
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
      transaction.objectStore(PROFILE_STORE).put(profile, CURRENT_PROFILE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    });
  } finally {
    db.close();
  }
}

async function writeSnapshot(profile: StoredProfile): Promise<void> {
  health = { ...health, status: "saving", lastError: null };
  try {
    await saveToIndexedDb(profile);
    try {
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
    } catch {
      // Scrierea principală a reușit; cleanup-ul fallback-ului nu este critic.
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
      health = {
        status: "fallback",
        lastSavedAtLocal: new Date().toISOString(),
        lastError: message,
      };
      return;
    } catch (fallbackError) {
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

/** Coalescează snapshot-uri: păstrează ordinea și nu lasă o eroare să blocheze coada. */
export function queueProfileSave(profile: StoredProfile): void {
  const snapshot = structuredClone(profile);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeSnapshot(snapshot));
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
