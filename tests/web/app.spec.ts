import { expect, test, type Page } from "@playwright/test";

async function readStoredProfile(
  page: Page,
): Promise<Record<string, unknown> | null> {
  return page.evaluate(
    () =>
      new Promise<Record<string, unknown> | null>((resolve, reject) => {
        const open = indexedDB.open("minte-in-joaca");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction("profiles", "readonly");
          const request = transaction.objectStore("profiles").get("current");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            resolve(
              (request.result as Record<string, unknown> | undefined) ?? null,
            );
            db.close();
          };
        };
      }),
  );
}

async function seedCleanProgress(
  page: Page,
  gameIds: readonly string[],
): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.evaluate(async (ids) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("minte-in-joaca");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const profile = await new Promise<Record<string, any>>((resolve, reject) => {
      const request = db
        .transaction("profiles", "readonly")
        .objectStore("profiles")
        .get("current");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const progressByGame = { ...profile.progressByGame };
    for (const gameId of ids) {
      const attempts = [0, 1, 2].map((index) => ({
        atLocal: `2026-07-25T10:0${index}:00.000Z`,
        sessionId: `seed-session-${index % 2}`,
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
      progressByGame[gameId] = {
        difficulty: {},
        recentOutcomes: attempts,
        timesPlayed: attempts.length,
      };
    }
    profile.progressByGame = progressByGame;
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("profiles", "readwrite");
      transaction.objectStore("profiles").put(profile, "current");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, gameIds);
}

async function enterHome(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Joacă" })).toBeVisible();
}

test("child home is local-only and progressively unlocked", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });

  await enterHome(page);

  const gameButtons = page.locator(
    'button.choice-card[aria-label]:not([aria-label="Joacă"])',
  );
  await expect(gameButtons).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Găsește perechea" }),
  ).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("completed attempt stores deterministic replay metadata", async ({ page }) => {
  await enterHome(page);
  await page.getByRole("button", { name: "Găsește perechea" }).click();

  const choices = page.locator(".choice-row .choice-card");
  await expect(choices).toHaveCount(2, { timeout: 6_000 });
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await choices.nth(0).click();
  await page.waitForTimeout(350);
  await choices.nth(1).click();

  await expect
    .poll(
      async () => {
        const stored = await readStoredProfile(page);
        return (stored?.attempts as unknown[] | undefined)?.length ?? 0;
      },
      { timeout: 8_000 },
    )
    .toBe(1);

  const stored = await readStoredProfile(page);
  const attempt = (stored?.attempts as Record<string, unknown>[])[0];

  expect(attempt).toMatchObject({
    gameId: "same-picture",
    ladderStageId: "same-picture:L001",
    contentVersion: "1.0.0:1.0.0",
    completed: true,
  });
  expect(attempt?.sessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(attempt?.levelSeed).toMatch(/^same-picture:/);
});

test("Pixi scene is destroyed and recreated without residual canvas", async ({
  page,
}) => {
  await enterHome(page);
  await page.getByRole("button", { name: "Găsește perechea" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);

  await page.getByRole("button", { name: "Înapoi acasă" }).click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible();
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(0);

  await page.getByRole("button", { name: "Găsește perechea" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
});

test("color sorting completes through the accessible Pixi input bridge", async ({
  page,
}) => {
  await seedCleanProgress(page, ["same-picture"]);
  await enterHome(page);
  await page.getByRole("button", { name: "Coșurile de culori" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });

  const items = page.locator("button.pixi-drag-item");
  await expect(items).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const item = items.nth(index);
    const color = await item.getAttribute("aria-label");
    expect(color).not.toBeNull();
    const target = page.locator(
      `button.pixi-drop-target[aria-label="coșul ${color}"]`,
    );
    if (index === 0) {
      const itemBox = await item.boundingBox();
      const targetBox = await target.boundingBox();
      expect(itemBox).not.toBeNull();
      expect(targetBox).not.toBeNull();
      await page.mouse.move(
        itemBox!.x + itemBox!.width / 2,
        itemBox!.y + itemBox!.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBox!.x + targetBox!.width / 2,
        targetBox!.y + targetBox!.height / 2,
        { steps: 4 },
      );
      await page.mouse.up();
      await expect(item).toBeDisabled();
    } else {
      await item.evaluate((button: HTMLButtonElement) => button.click());
      await target.evaluate((button: HTMLButtonElement) => button.click());
    }
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "sort-by-color",
      );
    })
    .toBe(true);
});

test("inset puzzle consumes shared drag/snap runtime", async ({ page }) => {
  await seedCleanProgress(page, ["same-picture", "sort-by-color"]);
  await enterHome(page);
  await page.getByRole("button", { name: "Pune forma la loc" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });

  const items = page.locator("button.pixi-drag-item");
  await expect(items).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const item = items.nth(index);
    const shape = await item.getAttribute("aria-label");
    expect(shape).not.toBeNull();
    await item.evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator(`button.pixi-drop-target[aria-label="gaura ${shape}"]`)
      .evaluate((button: HTMLButtonElement) => button.click());
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "inset-puzzle",
      );
    })
    .toBe(true);
});

test("legacy local profile migrates without losing progress", async ({ page }) => {
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
  const result = {
    current: await readStoredProfile(page),
    ...(await page.evaluate(() => ({
    legacy: localStorage.getItem("minte-in-joaca/v1"),
    }))),
  };

  expect(result.current).toMatchObject({ schemaVersion: 2, ageMonths: 31 });
  expect(result.legacy).toBeNull();
});

test("installed build reloads with the network disabled", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/");
  const serviceWorkerState = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const deadline = Date.now() + 8_000;
    while (
      (!navigator.serviceWorker.controller || (await caches.keys()).length === 0) &&
      Date.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const cachedPaths = (
      await Promise.all(
        (await caches.keys()).map(async (cacheName) =>
          (await caches.open(cacheName)).keys(),
        ),
      )
    )
      .flat()
      .map((request) => new URL(request.url).pathname);
    return {
      controlled: Boolean(navigator.serviceWorker.controller),
      cached: cachedPaths.includes("/index.html"),
    };
  });
  expect(serviceWorkerState).toEqual({ controlled: true, cached: true });

  await context.setOffline(true);
  if (testInfo.project.name === "webkit-touch") {
    const cachedHtml = await page.evaluate(async () => {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        const cachedRequest = (await cache.keys()).find(
          (request) => new URL(request.url).pathname === "/index.html",
        );
        if (cachedRequest) return (await cache.match(cachedRequest))?.text();
      }
      return undefined;
    });
    expect(cachedHtml).toContain("Minte în joacă");
  } else {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  }
});
