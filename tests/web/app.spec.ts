import { expect, test, type Page } from "@playwright/test";

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
      () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("minte-in-joaca/v2");
          if (!raw) return 0;
          return (JSON.parse(raw) as { attempts: unknown[] }).attempts.length;
        }),
      { timeout: 8_000 },
    )
    .toBe(1);

  const attempt = await page.evaluate(() => {
    const raw = localStorage.getItem("minte-in-joaca/v2");
    return (JSON.parse(raw ?? "{}") as { attempts: Record<string, unknown>[] })
      .attempts[0];
  });

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
  const result = await page.evaluate(() => ({
    current: JSON.parse(localStorage.getItem("minte-in-joaca/v2") ?? "{}") as {
      schemaVersion?: number;
      ageMonths?: number;
    },
    legacy: localStorage.getItem("minte-in-joaca/v1"),
  }));

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
