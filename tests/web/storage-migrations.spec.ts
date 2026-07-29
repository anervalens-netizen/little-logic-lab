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

async function mutateCurrentProfile(
  page: Page,
  mutate: (profile: Record<string, any>) => void,
): Promise<void> {
  await page.evaluate(async (mutationSource) => {
    const mutateProfile = new Function(
      "profile",
      `return (${mutationSource})(profile);`,
    ) as (profile: Record<string, any>) => void;
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
    mutateProfile(profile);
    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, mutate.toString());
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
  await mutateCurrentProfile(page, (profile) => {
    profile.schemaVersion = 2;
    profile.ageMonths = 47;
    delete profile.sessionLocked;
    delete profile.settings.highContrast;
    delete profile.settings.targetSize;
    delete profile.settings.demonstrationSpeed;
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
  await mutateCurrentProfile(page, (profile) => {
    profile.schemaVersion = 3;
    profile.sessionLocked = true;
    delete profile.settings.highContrast;
    delete profile.settings.targetSize;
    delete profile.settings.demonstrationSpeed;
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
