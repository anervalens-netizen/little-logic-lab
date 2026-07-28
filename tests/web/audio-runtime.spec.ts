import { expect, test, type Page } from "@playwright/test";

async function seedSupportedJourneyProgress(page: Page): Promise<void> {
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
      const attempts = [0, 1].map((index) => ({
        atLocal: `2026-07-28T10:0${index}:00.000Z`,
        sessionId: `supported-${gameId}-${index}`,
        gameId,
        skillId:
          gameId === "same-picture"
            ? "visual_discrimination"
            : "classification_color",
        levelSeed: `${gameId}:supported:${index}`,
        ladderStageId: `${gameId}:L001`,
        contentVersion: "1.0.0:1.0.0",
        completed: true,
        correctFirstTry: index === 0,
        correctEventually: true,
        hintsUsed: index === 0 ? 0 : 1,
        wrongAttempts: index === 0 ? 0 : 1,
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
  ).toBeVisible({ timeout: 35_000 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-state",
    "ready",
  );
  const releaseIdentity = await page.evaluate(async () => {
    const htmlCommit = document.querySelector<HTMLMetaElement>(
      'meta[name="logic-lab-release"]',
    )?.content;
    let response: Response | undefined;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const request = (await cache.keys()).find(
        (candidate) => new URL(candidate.url).pathname === "/release.json",
      );
      if (request) response = await cache.match(request);
      if (response) break;
    }
    const release = response?.ok
      ? ((await response.json()) as { commit?: string })
      : undefined;
    return { htmlCommit, cachedCommit: release?.commit };
  });
  expect(releaseIdentity.cachedCommit).toBe(releaseIdentity.htmlCommit);
  expect(releaseIdentity.cachedCommit).toMatch(/^[0-9a-f]{40}$/);

  await page.getByRole("button", { name: "Continuă aventura" }).click();
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

test("child home exposes one journey action and three visual stops", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();

  const home = page.locator(
    '[data-screen="home"][data-screen-ready="true"]',
  );
  await expect(home).toBeVisible({ timeout: 35_000 });
  await expect(page.getByText("Aventura lui Lumi", { exact: true })).toBeVisible();
  await expect(page.locator(".home-adventure-stop")).toHaveCount(3);
  await expect(page.getByText("Găsește perechea", { exact: true })).toBeVisible();
  await expect(page.getByText("Coșurile de culori", { exact: true })).toBeVisible();
  await expect(page.getByText("Pune forma la loc", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toHaveCount(1);
  await expect(page.locator(".home-adventure button")).toHaveCount(1);
  await expect(home).toHaveAttribute("data-unlocked-count", "3");
});

test("supported success across two journey games unlocks the next catalog game", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await seedSupportedJourneyProgress(page);
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();

  const home = page.locator(
    '[data-screen="home"][data-screen-ready="true"]',
  );
  await expect(home).toBeVisible({ timeout: 35_000 });
  await expect(home).toHaveAttribute("data-unlocked-count", "4");
  await expect(page.locator(".home-adventure-stop")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toHaveCount(1);
});
