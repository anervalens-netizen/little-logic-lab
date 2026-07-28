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

test("partially corrupt local data is repaired without a full reset", async ({
  page,
}) => {
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
});
