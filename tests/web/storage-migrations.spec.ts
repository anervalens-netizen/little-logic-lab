import { expect, test, type Page } from "@playwright/test";

async function readProfile(page: Page): Promise<Record<string, any> | null> {
  return page.evaluate(
    () =>
      new Promise<Record<string, any> | null>((resolve, reject) => {
        const request = indexedDB.open("minte-in-joaca");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("profiles", "readonly");
          const read = transaction.objectStore("profiles").get("current");
          read.onerror = () => reject(read.error);
          read.onsuccess = () => {
            resolve(read.result ?? null);
            db.close();
          };
        };
      }),
  );
}

async function writePreviousProfileVersion(
  page: Page,
  options: {
    readonly schemaVersion: 2 | 3;
    readonly ageMonths?: number;
    readonly sessionLocked?: boolean;
  },
): Promise<void> {
  await page.evaluate(async (migration) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("minte-in-joaca");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction("profiles", "readwrite");
    const store = transaction.objectStore("profiles");
    const profile = await new Promise<Record<string, any>>((resolve, reject) => {
      const read = store.get("current");
      read.onerror = () => reject(read.error);
      read.onsuccess = () => resolve(read.result);
    });

    profile.schemaVersion = migration.schemaVersion;
    if (migration.ageMonths !== undefined) {
      profile.ageMonths = migration.ageMonths;
    }
    if (migration.schemaVersion === 2) {
      delete profile.sessionLocked;
    } else {
      profile.sessionLocked = migration.sessionLocked === true;
    }
    delete profile.settings.highContrast;
    delete profile.settings.targetSize;
    delete profile.settings.demonstrationSpeed;

    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, options);
}

test("legacy localStorage v1 migrates without losing settings", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "minte-in-joaca/v1",
      JSON.stringify({
        schemaVersion: 1,
        createdAtLocal: "2026-07-24T10:00:00.000Z",
        ageMonths: 31,
        settings: {
          audioEnabled: true,
          musicEnabled: false,
          voiceEnabled: true,
          reducedMotion: false,
          sessionMinutes: 5,
          coPlayPrompts: true,
        },
        masteryBySkill: {},
        progressByGame: {},
        attempts: [],
        sessions: [],
      }),
    );
  });

  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await expect.poll(() => readProfile(page)).toMatchObject({
    schemaVersion: 4,
    ageMonths: 31,
    sessionLocked: false,
    settings: {
      reducedMotion: false,
      highContrast: false,
      targetSize: "large",
      demonstrationSpeed: "normal",
    },
  });
  expect(
    await page.evaluate(() => localStorage.getItem("minte-in-joaca/v1")),
  ).toBeNull();
});

test("IndexedDB v2 migrates to the current accessibility schema", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await writePreviousProfileVersion(page, {
    schemaVersion: 2,
    ageMonths: 47,
  });

  await page.reload();
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await expect.poll(() => readProfile(page)).toMatchObject({
    schemaVersion: 4,
    ageMonths: 47,
    sessionLocked: false,
    settings: {
      highContrast: false,
      targetSize: "large",
      demonstrationSpeed: "normal",
    },
  });
});

test("IndexedDB v3 preserves the session lock during migration", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await writePreviousProfileVersion(page, {
    schemaVersion: 3,
    sessionLocked: true,
  });

  await page.reload();
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await expect.poll(() => readProfile(page)).toMatchObject({
    schemaVersion: 4,
    sessionLocked: true,
    settings: {
      highContrast: false,
      targetSize: "large",
      demonstrationSpeed: "normal",
    },
  });
});
