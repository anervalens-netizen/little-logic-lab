import { expect, test, type Page } from "@playwright/test";

const P0_GAMES = [
  ["same-picture", "Găsește perechea"],
  ["sort-by-color", "Coșurile de culori"],
  ["inset-puzzle", "Pune forma la loc"],
  ["daily-order", "Ce facem întâi?"],
  ["one-to-one-count", "Dă câte unul"],
  ["shadow-match", "Potrivește umbra"],
  ["peek-and-find", "Privește și găsește"],
  ["wait-for-go", "Așteaptă semnalul"],
  ["listen-find", "Ascultă și găsește"],
  ["trace-road", "Urmează drumul"],
  ["emotion-match", "Cum se simte?"],
  ["sort-by-shape", "Casa formelor"],
  ["sort-by-size", "Mic, mijlociu, mare"],
  ["drag-and-fit", "Mută și potrivește"],
  ["real-color-hunt", "Vânătoarea de culori"],
] as const;

async function seedAllGamesUnlocked(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.evaluate(async (games) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("minte-in-joaca");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction("profiles", "readwrite");
    const store = transaction.objectStore("profiles");
    const profile = await new Promise<Record<string, any>>((resolve, reject) => {
      const request = store.get("current");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    profile.ageMonths = 72;
    profile.sessionLocked = false;
    const attempts: Record<string, any>[] = [];
    for (const [gameId] of games) {
      const gameAttempts = [0, 1].map((index) => ({
        atLocal: `2026-07-29T05:${String(index).padStart(2, "0")}:00.000Z`,
        sessionId: `all-games-${gameId}-${index}`,
        gameId,
        skillId: `seed-${gameId}`,
        levelSeed: `${gameId}:all-games:${index}`,
        ladderStageId: `${gameId}:L001`,
        contentVersion: "1.0.0:1.0.0",
        completed: true,
        correctFirstTry: true,
        correctEventually: true,
        hintsUsed: 0,
        wrongAttempts: 0,
        responseMs: 2_000,
        abandoned: false,
      }));
      profile.progressByGame[gameId] = {
        difficulty: {},
        recentOutcomes: gameAttempts,
        timesPlayed: gameAttempts.length,
      };
      attempts.push(...gameAttempts);
    }
    profile.attempts = [...profile.attempts, ...attempts].slice(-500);
    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, P0_GAMES);
}

async function enterHome(page: Page): Promise<void> {
  await page.reload();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 35_000 });
}

async function enterParentGames(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Jocuri" }).click();
}

test("all P0 games reach ready and cleanly return Home", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env["LOGIC_LAB_ALL_GAMES"] !== "1",
    "Full catalog smoke runs only through npm run test:web:all-games.",
  );
  test.fixme(
    !testInfo.project.name.includes("chromium"),
    "Full catalog smoke is currently qualified on the repeatable Chromium target.",
  );
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "The full catalog smoke uses one repeatable mobile engine.",
  );
  test.setTimeout(240_000);

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedAllGamesUnlocked(page);
  await enterHome(page);

  for (const [gameId, title] of P0_GAMES) {
    await enterParentGames(page);
    const row = page.locator(".parent-game-catalog-item").filter({ hasText: title });
    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: "Previzualizează nivelul" })
      .click();

    const playArea = page.locator(`.game-play-area[data-game-id="${gameId}"]`);
    await expect(playArea).toBeVisible({ timeout: 12_000 });
    await expect(playArea).toHaveAttribute("data-progress-mode", "preview");
    await expect(page.locator('[data-game-ready="true"]')).toHaveAttribute(
      "data-game-ready",
      "true",
      { timeout: 20_000 },
    );
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);

    await page.getByRole("button", { name: "Înapoi acasă" }).click();
    await expect(
      page.locator('[data-screen="home"][data-screen-ready="true"]'),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(0);
    await expect(page.locator(".game-screen")).toHaveCount(0);
  }

  expect(pageErrors).toEqual([]);
});
