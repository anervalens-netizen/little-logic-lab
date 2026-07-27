import { expect, test, type Page } from "@playwright/test";

async function seedThreeUnlockedGames(page: Page): Promise<void> {
  await page.evaluate(async () => {
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

    for (const gameId of ["same-picture", "sort-by-color"]) {
      const attempts = [0, 1, 2].map((index) => ({
        atLocal: `2026-07-27T10:0${index}:00.000Z`,
        sessionId: `v2-unlock-${index % 2}`,
        gameId,
        skillId: `seed-${gameId}`,
        levelSeed: `${gameId}:seed:${index}`,
        ladderStageId: `${gameId}:L001`,
        contentVersion: "1.0.0:1.0.0",
        completed: true,
        correctFirstTry: true,
        correctEventually: true,
        hintsUsed: 0,
        wrongAttempts: 0,
        abandoned: false,
      }));
      profile.progressByGame[gameId] = {
        difficulty: {},
        recentOutcomes: attempts,
        timesPlayed: attempts.length,
      };
    }
    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
}

test("current release is cached and speech gates child input", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "Service-worker controller timing is verified on the repeatable Chromium target.",
  );

  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();

  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-state",
    "ready",
  );
  const releaseIdentity = await page.evaluate(async () => {
    const htmlCommit = document.querySelector<HTMLMetaElement>(
      'meta[name="logic-lab-release"]',
    )?.content;
    const cached = await caches.match(new URL("/release.json", location.href));
    const release = cached?.ok
      ? ((await cached.json()) as { commit?: string })
      : undefined;
    return { htmlCommit, cachedCommit: release?.commit };
  });
  expect(releaseIdentity.cachedCommit).toBe(releaseIdentity.htmlCommit);
  expect(releaseIdentity.cachedCommit).toMatch(/^[0-9a-f]{40}$/);

  await page.getByRole("button", { name: "Găsește perechea" }).click();
  const playArea = page.locator(".game-play-area");
  await expect(playArea).toBeVisible({ timeout: 8_000 });
  await expect(playArea).toHaveAttribute("inert", "", { timeout: 8_000 });
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-speech-state",
    "idle",
  );
  await expect(playArea).not.toHaveAttribute("inert", "");
});

test("the first three games become a coherent adventure map", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await seedThreeUnlockedGames(page);
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();

  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Aventura lui Lumi" }),
  ).toBeVisible();
  await expect(page.locator(".home-adventure-stop")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Găsește perechea" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Coșurile de culori" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pune forma la loc" }),
  ).toBeVisible();
});
