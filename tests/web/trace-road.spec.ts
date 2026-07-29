import { expect, test, type Page } from "@playwright/test";

const BEFORE_TRACE = [
  "same-picture",
  "sort-by-color",
  "daily-order",
  "one-to-one-count",
  "shadow-match",
  "peek-and-find",
  "wait-for-go",
  "listen-find",
] as const;

async function seedTraceAccess(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.evaluate(async (gameIds) => {
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
    const attempts: Record<string, any>[] = [];
    for (const gameId of gameIds) {
      const gameAttempts = [0, 1].map((index) => ({
        atLocal: `2026-07-29T04:${String(index).padStart(2, "0")}:00.000Z`,
        sessionId: `trace-seed-${gameId}-${index}`,
        gameId,
        skillId: `seed-${gameId}`,
        levelSeed: `${gameId}:trace-seed:${index}`,
        ladderStageId: `${gameId}:L001`,
        contentVersion: "1.0.0:1.0.0",
        completed: true,
        correctFirstTry: true,
        correctEventually: true,
        hintsUsed: 0,
        wrongAttempts: 0,
        responseMs: 2_500,
        abandoned: false,
      }));
      profile.progressByGame[gameId] = {
        difficulty: {},
        recentOutcomes: gameAttempts,
        timesPlayed: gameAttempts.length,
      };
      attempts.push(...gameAttempts);
    }
    profile.attempts = [...profile.attempts, ...attempts];
    store.put(profile, "current");
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, BEFORE_TRACE);
}

async function startTraceRoad(page: Page): Promise<void> {
  await page.reload();
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
  await page.getByRole("button", { name: "Jocuri" }).click();
  await page
    .locator(".parent-game-catalog-item")
    .filter({ hasText: "Urmează drumul" })
    .getByRole("button", { name: "Testează un nivel" })
    .click();
}

test("trace road follows continuous Pixi pointer input to the goal", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env["LOGIC_LAB_TRACE_TOUCH"] !== "1",
    "Continuous touch runs only through npm run test:web:trace-touch.",
  );
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "Trusted continuous touch injection is available on Chromium.",
  );

  await seedTraceAccess(page);
  await startTraceRoad(page);

  const trace = page.locator(
    '[data-game-ready="true"][data-trace-points="3"]',
  );
  await expect(trace).toBeVisible({ timeout: 12_000 });
  const canvas = await page.locator("canvas.pixi-stage").boundingBox();
  expect(canvas).not.toBeNull();

  const startX = Number(await trace.getAttribute("data-trace-start-x"));
  const startY = Number(await trace.getAttribute("data-trace-start-y"));
  const checkpoints = page.locator("button.pixi-trace-checkpoint");
  await expect(checkpoints).toHaveCount(2);
  const firstBox = await checkpoints.nth(0).boundingBox();
  expect(firstBox).not.toBeNull();

  const start = { x: canvas!.x + startX, y: canvas!.y + startY };
  const first = {
    x: firstBox!.x + firstBox!.width / 2,
    y: firstBox!.y + firstBox!.height / 2,
  };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, id: 0 }],
  });

  for (let step = 1; step <= 12; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((first.x - start.x) * step) / 12,
          y: start.y + ((first.y - start.y) * step) / 12,
          id: 0,
        },
      ],
    });
    await page.waitForTimeout(24);
  }
  await expect(trace).toHaveAttribute("data-trace-progress", "1");

  const currentBox = await checkpoints.nth(0).boundingBox();
  const nextBox = await checkpoints.nth(1).boundingBox();
  expect(currentBox).not.toBeNull();
  expect(nextBox).not.toBeNull();
  const current = {
    x: currentBox!.x + currentBox!.width / 2,
    y: currentBox!.y + currentBox!.height / 2,
  };
  const destination = {
    x: nextBox!.x + nextBox!.width / 2,
    y: nextBox!.y + nextBox!.height / 2,
  };

  for (let step = 1; step <= 12; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: current.x + ((destination.x - current.x) * step) / 12,
          y: current.y + ((destination.y - current.y) * step) / 12,
          id: 0,
        },
      ],
    });
    await page.waitForTimeout(24);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Promise<boolean>((resolve, reject) => {
            const request = indexedDB.open("minte-in-joaca");
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const transaction = db.transaction("profiles", "readonly");
              const read = transaction.objectStore("profiles").get("current");
              read.onerror = () => reject(read.error);
              read.onsuccess = () => {
                resolve(
                  (read.result?.attempts ?? []).some(
                    (attempt: { gameId?: string }) =>
                      attempt.gameId === "trace-road",
                  ),
                );
                db.close();
              };
            };
          }),
      ),
    )
    .toBe(true);
});
