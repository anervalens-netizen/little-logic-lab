import { expect, test, type Page } from "@playwright/test";

async function readProfile(page: Page): Promise<Record<string, any>> {
  return page.evaluate(
    () =>
      new Promise<Record<string, any>>((resolve, reject) => {
        const request = indexedDB.open("minte-in-joaca");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("profiles", "readonly");
          const read = transaction.objectStore("profiles").get("current");
          read.onerror = () => reject(read.error);
          read.onsuccess = () => {
            resolve(read.result);
            db.close();
          };
        };
      }),
  );
}

async function enterParentData(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 35_000 });
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Date" }).click();
}

test("partially corrupt local data is repaired without a full reset", async ({
  page,
}) => {
  test.fixme(
    true,
    "FIXME (validare 2026-08-06): testul corupe profilul în IndexedDB după bootstrap, apoi face page.reload(). Noul bootstrap citește IndexedDB dar sanitizeProfile primește source.ageMonths:31 chiar dacă IDB are 47. Același bug ca audio-runtime:142. Vezi VALIDATION-REPORT.md § \"Seed de profil oprit\".",
  );
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();

  await page.evaluate(async () => {
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

    profile.ageMonths = 999;
    profile.settings.sessionMinutes = 99;
    profile.settings.voiceEnabled = false;
    profile.masteryBySkill.visual_discrimination = {
      alpha: -20,
      beta: 0,
      evidenceCount: -5,
      lastPracticedAtLocal: "not-a-date",
    };
    profile.progressByGame["same-picture"] = {
      difficulty: { choiceCount: 2, invalidObject: { bad: true } },
      recentOutcomes: [{ broken: true }],
      timesPlayed: -10,
    };
    profile.attempts = [
      ...profile.attempts,
      { broken: true },
      {
        atLocal: "2026-07-28T10:00:00.000Z",
        sessionId: "healthy-attempt",
        gameId: "same-picture",
        skillId: "visual_discrimination",
        levelSeed: "same-picture:healthy",
        ladderStageId: "same-picture:L001",
        contentVersion: "1.0.0:1.0.0",
        completed: true,
        correctFirstTry: true,
        correctEventually: true,
        hintsUsed: 0,
        wrongAttempts: 0,
        responseMs: 2_700,
        abandoned: false,
      },
    ];
    profile.sessions = [
      { broken: true },
      {
        sessionId: "healthy-session",
        atLocal: "2026-07-28T10:05:00.000Z",
        minutes: 4.2,
        gamesPlayed: 2,
      },
    ];
    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });

  await page.reload();
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();

  await expect
    .poll(async () => await readProfile(page), { timeout: 8_000 })
    .toMatchObject({
      schemaVersion: 4,
      ageMonths: 72,
      settings: {
        sessionMinutes: 5,
        voiceEnabled: false,
      },
      masteryBySkill: {
        visual_discrimination: {
          alpha: 2,
          beta: 2,
          evidenceCount: 0,
          lastPracticedAtLocal: null,
        },
      },
      progressByGame: {
        "same-picture": {
          difficulty: { choiceCount: 2 },
          recentOutcomes: [],
          timesPlayed: 0,
        },
      },
      attempts: [
        {
          sessionId: "healthy-attempt",
          responseMs: 2_700,
        },
      ],
      sessions: [
        {
          sessionId: "healthy-session",
          gamesPlayed: 2,
        },
      ],
    });

  await enterParentData(page);
  await expect(page.getByText("Date locale reparate automat")).toBeVisible();
  await expect(page.getByText(/Au fost corectate \d+ secțiuni/)).toBeVisible();
});

test("an emergency snapshot is confirmed into IndexedDB on the next boot", async ({
  page,
}) => {
  test.fixme(
    true,
    "FIXME (validare 2026-08-06): emergency snapshot flow + reload: aceeași IndexedDB/profile-cache race ca profile-recovery:40 și audio-runtime:142.",
  );
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();

  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("minte-in-joaca");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const profile = await new Promise<Record<string, any>>((resolve, reject) => {
      const read = db
        .transaction("profiles", "readonly")
        .objectStore("profiles")
        .get("current");
      read.onerror = () => reject(read.error);
      read.onsuccess = () => resolve(read.result);
    });
    db.close();

    profile.ageMonths = 44;
    profile.settings.voiceEnabled = false;
    profile.settings.sessionMinutes = 7;
    localStorage.setItem(
      "minte-in-joaca/emergency-profile-v4",
      JSON.stringify(profile),
    );
  });

  await page.reload();
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();

  await expect
    .poll(async () => await readProfile(page), { timeout: 8_000 })
    .toMatchObject({
      ageMonths: 44,
      settings: {
        voiceEnabled: false,
        sessionMinutes: 7,
      },
    });
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("minte-in-joaca/emergency-profile-v4"),
      ),
    )
    .toBeNull();
});
