import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

async function seedGameDifficulty(
  page: Page,
  gameId: string,
  ageMonths: number,
  difficulty: Record<string, string | number | boolean>,
): Promise<void> {
  await page.evaluate(
    async ({ id, age, vector }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("minte-in-joaca");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      const transaction = db.transaction("profiles", "readwrite");
      const store = transaction.objectStore("profiles");
      const profile = await new Promise<Record<string, any>>(
        (resolve, reject) => {
          const request = store.get("current");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        },
      );
      profile.ageMonths = age;
      profile.progressByGame[id] = {
        difficulty: vector,
        recentOutcomes: [],
        timesPlayed: 0,
      };
      store.put(profile, "current");
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },
    { id: gameId, age: ageMonths, vector: difficulty },
  );
}

async function placeVisiblePixiSortItems(
  page: Page,
  targetName: (itemLabel: string) => string,
): Promise<void> {
  const items = page.locator("button.pixi-drag-item");
  const count = await items.count();
  for (let index = 0; index < count; index += 1) {
    const item = items.nth(index);
    const label = await item.getAttribute("aria-label");
    expect(label).not.toBeNull();
    await item.evaluate((button: HTMLButtonElement) => button.click());
    await page
      .getByRole("button", { name: targetName(label!), exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
  }
}

async function enterHome(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Joacă" })).toBeVisible();
}

async function expectNoAutomaticAccessibilityViolations(
  page: Page,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    results.violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.nodes
            .map((node) => node.target.join(" "))
            .join(", ")}`,
      )
      .join("\n"),
  ).toEqual([]);
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

test("parent mode is React-owned and persists semantic settings", async ({
  page,
}) => {
  await enterHome(page);
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  const hold = page.getByRole("button", { name: "Ține apăsat 3 secunde" });
  await hold.dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("heading", { name: "Zonă pentru adulți" }),
  ).toBeVisible();

  const reducedMotion = page.getByRole("switch", {
    name: "Mișcare redusă (fără animații)",
  });
  await expect(reducedMotion).toHaveAttribute("aria-checked", "true");
  await reducedMotion.click();
  await expect(reducedMotion).toHaveAttribute("aria-checked", "false");
  await expect
    .poll(async () => {
      const stored = await readStoredProfile(page);
      return (stored?.settings as { reducedMotion?: boolean } | undefined)
        ?.reducedMotion;
    })
    .toBe(false);

  await page.getByRole("button", { name: "Înapoi" }).click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible();
  await expect(page.locator(".parent-panel")).toHaveCount(0);
});

test("home, Parent Mode and Pixi semantics pass Axe", async ({ page }) => {
  await enterHome(page);
  await expectNoAutomaticAccessibilityViolations(page);

  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await expectNoAutomaticAccessibilityViolations(page);

  await page.getByRole("button", { name: "Înapoi" }).click();
  await page.getByRole("button", { name: "Găsește perechea" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expectNoAutomaticAccessibilityViolations(page);
});

test("Romanian voice is bundled and cached for offline use", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const deadline = Date.now() + 8_000;
    while (!navigator.serviceWorker.controller && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });

  await context.setOffline(true);
  const cachedRecording = await page.evaluate(async () => {
    let response: Response | undefined;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const recordingRequest = (await cache.keys()).find(
        (request) =>
          new URL(request.url).pathname ===
          "/audio/ro-RO-v1/hello-lumi.mp3",
      );
      if (recordingRequest) {
        response = await cache.match(recordingRequest);
      }
      if (response) break;
    }
    if (!response) return { ok: false, contentType: null, size: 0 };
    return {
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      size: (await response.blob()).size,
    };
  });
  expect(cachedRecording.ok).toBe(true);
  expect(cachedRecording.contentType).toContain("audio");
  expect(cachedRecording.size).toBeGreaterThan(10_000);
});

test("Pixi exposes frame diagnostics and meets the input budget", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env["LOGIC_LAB_PERF"] !== "1",
    "Benchmark serial: npm run test:web:performance",
  );
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "Chromium is the repeatable synthetic performance gate; device QA is separate.",
  );
  await enterHome(page, "/?diagnostics=1");
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  const reducedMotion = page.getByRole("switch", {
    name: "Mișcare redusă (fără animații)",
  });
  await expect(reducedMotion).toHaveAttribute("aria-checked", "true");
  await reducedMotion.click();
  await page.getByRole("button", { name: "Înapoi" }).click();
  await page.getByRole("button", { name: "Găsește perechea" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await page.evaluate(() => window.__logicLabPerformance?.reset());
  await page.waitForTimeout(2_000);
  await page.locator(".pixi-accessibility-choice").first().click();
  await page.waitForTimeout(120);

  const metrics = await page.evaluate(() =>
    window.__logicLabPerformance?.snapshot(),
  );
  expect(metrics).toBeDefined();
  const evidence = JSON.stringify(metrics);
  expect(metrics!.frameSamples, evidence).toBeGreaterThan(20);
  expect(metrics!.frameP95Ms, evidence).toBeGreaterThan(0);
  expect(metrics!.inputSamples, evidence).toBeGreaterThan(0);
  expect(metrics!.inputP95Ms, evidence).toBeLessThan(50);
  expect(metrics!.longTasksOver100Ms, evidence).toBeGreaterThanOrEqual(0);
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
  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (
        profile?.progressByGame as
          | Record<string, { difficulty?: Record<string, unknown> }>
          | undefined
      )?.["same-picture"]?.difficulty;
    })
    .toEqual({
      choiceCount: 2,
      distractorSimilarity: 0,
      targetCueDuration: -1,
      sceneClutter: 0,
    });
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
}, testInfo) => {
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
    if (index === 0 && testInfo.project.name === "chromium-touch") {
      const itemBox = await item.boundingBox();
      const targetBox = await target.boundingBox();
      expect(itemBox).not.toBeNull();
      expect(targetBox).not.toBeNull();
      const from = {
        x: itemBox!.x + itemBox!.width / 2,
        y: itemBox!.y + itemBox!.height / 2,
      };
      const to = {
        x: targetBox!.x + targetBox!.width / 2,
        y: targetBox!.y + targetBox!.height / 2,
      };
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.move(to.x, to.y, { steps: 12 });
      await page.waitForTimeout(80);
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

test("sorting batches the full twelve-item, four-bin ladder stage", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One mobile engine is sufficient for the deterministic batch/grid contract.",
  );
  await seedCleanProgress(page, ["same-picture"]);
  await seedGameDifficulty(page, "sort-by-color", 72, {
    itemCount: 12,
    binCount: 4,
    ruleCount: 2,
    ruleCueVisibility: "at_switch",
  });

  await enterHome(page);
  await page.getByRole("button", { name: "Coșurile de culori" }).click();
  for (let batch = 0; batch < 4; batch += 1) {
    await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
    await expect(page.locator("button.pixi-drag-item")).toHaveCount(3);
    const targets = page.locator("button.pixi-drop-target");
    await expect(targets).toHaveCount(4);
    if (batch === 0) {
      const boxes = await targets.evaluateAll((buttons) =>
        buttons.map((button) => {
          const box = button.getBoundingClientRect();
          return { width: box.width, height: box.height };
        }),
      );
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(96);
        expect(box.height).toBeGreaterThanOrEqual(96);
      }
    }
    await placeVisiblePixiSortItems(page, (label) => `coșul ${label}`);
    await page.waitForTimeout(900);
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (
        profile?.attempts as
          | Array<{ gameId: string; ladderStageId: string }>
          | undefined
      )?.find((attempt) => attempt.gameId === "sort-by-color")?.ladderStageId;
    })
    .toBe("sort-by-color:L012");
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
      .locator(`button.pixi-drop-target[aria-label="locul pentru ${shape}"]`)
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

test("spatial-fit batches the full ten-piece ladder stage", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage contract.",
  );
  await seedCleanProgress(page, ["same-picture", "sort-by-color"]);
  await seedGameDifficulty(page, "inset-puzzle", 72, {
    pieceCount: 10,
    rotationEnabled: true,
    outlineSupport: "none",
    similarity: 4,
  });

  await enterHome(page);
  await page.getByRole("button", { name: "Pune forma la loc" }).click();
  for (const batchSize of [4, 4, 2]) {
    await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
    const items = page.locator("button.pixi-drag-item");
    await expect(items).toHaveCount(batchSize);
    for (let index = 0; index < batchSize; index += 1) {
      const item = items.nth(index);
      const label = await item.getAttribute("aria-label");
      expect(label).not.toBeNull();
      await item.evaluate((button: HTMLButtonElement) => button.click());
      await page
        .locator(`button.pixi-drop-target[aria-label="locul pentru ${label}"]`)
        .evaluate((button: HTMLButtonElement) => button.click());
    }
    await page.waitForTimeout(900);
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (
        profile?.attempts as
          | Array<{ gameId: string; ladderStageId: string }>
          | undefined
      )?.find((attempt) => attempt.gameId === "inset-puzzle")?.ladderStageId;
    })
    .toBe("inset-puzzle:L015");
});

const P0_BEFORE_DAILY = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
] as const;

test("daily order uses the shared Pixi sequence renderer", async ({ page }) => {
  await seedCleanProgress(page, P0_BEFORE_DAILY);
  await enterHome(page);
  await page.getByRole("button", { name: "Ce facem întâi?" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const cards = page.locator("button.pixi-sequence-card");
  await expect(cards).toHaveCount(2);

  for (let step = 0; step < 2; step += 1) {
    for (let index = 0; index < 2; index += 1) {
      const card = cards.nth(index);
      if (await card.isDisabled()) continue;
      await card.evaluate((button: HTMLButtonElement) => button.click());
      await page.waitForTimeout(520);
      if (await card.isDisabled()) break;
    }
  }
  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "daily-order",
      );
    })
    .toBe(true);
});

test("daily order renders the full six-step stage plus three distractors", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_DAILY);
  await seedGameDifficulty(page, "daily-order", 72, {
    stepCount: 6,
    distractorCount: 3,
    causalDistance: 3,
    verbalSupport: "minimal",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Ce facem întâi?" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  const cards = page.locator("button.pixi-sequence-card");
  await expect(cards).toHaveCount(9);
  const boxes = await cards.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(96);
    expect(box.height).toBeGreaterThanOrEqual(96);
  }
});

const P0_BEFORE_COUNT = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
  "daily-order",
] as const;

test("one-to-one counting uses shared Pixi drag with one treat per friend", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_COUNT);
  await seedGameDifficulty(page, "one-to-one-count", 31, {
    maxQuantity: 2,
    choiceCount: 2,
    symbolSupport: "none",
    perceptualControl: "basic",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Dă câte unul" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const items = page.locator("button.pixi-drag-item");
  const targets = page.locator("button.pixi-drop-target");
  await expect(items).toHaveCount(2);
  await expect(targets).toHaveCount(2);

  await items.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await targets.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await expect(items.nth(0)).toBeDisabled();

  await items.nth(1).evaluate((button: HTMLButtonElement) => button.click());
  await targets.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await expect(items.nth(1)).toBeEnabled();
  await targets.nth(1).evaluate((button: HTMLButtonElement) => button.click());

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "one-to-one-count",
      );
    })
    .toBe(true);
});

test("one-to-one counting batches the full twenty-friend ladder stage", async ({
  page,
}, testInfo) => {
  test.setTimeout(75_000);
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_COUNT);
  await seedGameDifficulty(page, "one-to-one-count", 72, {
    maxQuantity: 20,
    choiceCount: 8,
    symbolSupport: "mixed",
    perceptualControl: "strict",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Dă câte unul" }).click();

  for (let batch = 1; batch <= 7; batch += 1) {
    const ready = page.locator(
      `[data-game-ready="true"][data-total-items="20"][data-batch-index="${batch}"][data-batch-count="7"][data-choice-count="8"]`,
    );
    await expect(ready).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
    const expectedCount = batch === 7 ? 2 : 3;
    const items = page.locator("button.pixi-drag-item:not([hidden])");
    const targets = page.locator("button.pixi-drop-target:not([hidden])");
    await expect(items).toHaveCount(expectedCount);
    await expect(targets).toHaveCount(expectedCount);
    const controls = page.locator(
      "button.pixi-drag-item:not([hidden]), button.pixi-drop-target:not([hidden])",
    );
    const boxes = await controls.evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }),
    );
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(96);
      expect(box.height).toBeGreaterThanOrEqual(96);
    }
    for (let index = 0; index < expectedCount; index += 1) {
      await items
        .nth(index)
        .evaluate((button: HTMLButtonElement) => button.click());
      await targets
        .nth(index)
        .evaluate((button: HTMLButtonElement) => button.click());
    }
  }
  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (
        profile?.attempts as
          | Array<{ gameId: string; ladderStageId: string }>
          | undefined
      )?.find((attempt) => attempt.gameId === "one-to-one-count")
        ?.ladderStageId;
    })
    .toBe("one-to-one-count:L019");
});

const P0_BEFORE_DRAG_AND_FIT = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
  "daily-order",
  "one-to-one-count",
  "shadow-match",
  "peek-and-find",
  "wait-for-go",
  "listen-find",
  "trace-road",
  "emotion-match",
  "sort-by-shape",
  "sort-by-size",
] as const;
const P0_BEFORE_COLOR_HUNT = [
  ...P0_BEFORE_DRAG_AND_FIT,
  "drag-and-fit",
] as const;

test("color hunt uses a Pixi real-world prompt without scoring the child", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the open-ended three-step contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_COLOR_HUNT);
  await seedGameDifficulty(page, "real-color-hunt", 72, {
    stepCount: 3,
    ruleCount: 1,
    memoryDelaySec: 0,
    parentPromptSupport: "full",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Vânătoarea de culori" }).click();

  for (let step = 0; step < 3; step += 1) {
    await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
    const found = page.locator("button.pixi-accessibility-choice");
    await expect(found).toHaveCount(1);
    await expect(found).toHaveAttribute(
      "aria-label",
      /^Am găsit ceva (roșu|albastru|galben|verde)$/,
    );
    const currentLabel = await found.getAttribute("aria-label");
    await found.evaluate((button: HTMLButtonElement) => button.click());
    if (step < 2) {
      await expect
        .poll(() =>
          page
            .locator("button.pixi-accessibility-choice")
            .getAttribute("aria-label"),
        )
        .not.toBe(currentLabel);
    }
  }
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(0, {
    timeout: 3_000,
  });
  const profile = await readStoredProfile(page);
  expect(
    (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
      (attempt) => attempt.gameId === "real-color-hunt",
    ),
  ).toBe(false);
});

test("color hunt exposes the oldest six-step dual-rule memory stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic long-delay contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_COLOR_HUNT);
  await seedGameDifficulty(page, "real-color-hunt", 72, {
    stepCount: 6,
    ruleCount: 2,
    memoryDelaySec: 40,
    parentPromptSupport: "optional",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Vânătoarea de culori" }).click();
  const scene = page.locator(
    '[data-scene-ready="true"][data-step-count="6"][data-rule-count="2"][data-memory-delay-sec="40"][data-parent-prompt-support="optional"]',
  );
  await expect(scene).toBeVisible({ timeout: 8_000 });
  await expect(page.locator("button.pixi-accessibility-choice")).toBeDisabled();
  await page.getByRole("button", { name: "Înapoi acasă" }).click();
  await expect(page.getByRole("button", { name: "Joacă" })).toBeVisible({
    timeout: 3_000,
  });
});

const P0_BEFORE_SHADOW = [
  "same-picture",
  "sort-by-color",
  "inset-puzzle",
  "daily-order",
  "one-to-one-count",
] as const;
const P0_BEFORE_PEEK = [...P0_BEFORE_SHADOW, "shadow-match"] as const;
const P0_BEFORE_WAIT = [...P0_BEFORE_PEEK, "peek-and-find"] as const;

const P0_BEFORE_LISTEN = [
  ...P0_BEFORE_SHADOW,
  "shadow-match",
  "peek-and-find",
  "wait-for-go",
] as const;

const P0_BEFORE_EMOTION = [
  ...P0_BEFORE_LISTEN,
  "listen-find",
  "trace-road",
] as const;
const P0_BEFORE_TRACE = [...P0_BEFORE_LISTEN, "listen-find"] as const;

const P0_BEFORE_SHAPE = [...P0_BEFORE_EMOTION, "emotion-match"] as const;
const P0_BEFORE_SIZE = [...P0_BEFORE_SHAPE, "sort-by-shape"] as const;

test("trace road follows continuous Pixi pointer input to the goal", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "Trusted continuous touch injection is available in the Chromium project.",
  );
  test.skip(
    process.env["LOGIC_LAB_TRACE_TOUCH"] !== "1",
    "Continuous touch runs serially in its dedicated release gate.",
  );
  await seedCleanProgress(page, P0_BEFORE_TRACE);
  await enterHome(page);
  await page.getByRole("button", { name: "Urmează drumul" }).click();
  const trace = page.locator(
    '[data-game-ready="true"][data-trace-points="3"]',
  );
  await expect(trace).toBeVisible({ timeout: 8_000 });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const canvas = await page.locator("canvas.pixi-stage").boundingBox();
  expect(canvas).not.toBeNull();
  const startX = Number(await trace.getAttribute("data-trace-start-x"));
  const startY = Number(await trace.getAttribute("data-trace-start-y"));
  const checkpoints = page.locator("button.pixi-trace-checkpoint");
  const firstBox = await checkpoints.nth(0).boundingBox();
  expect(firstBox).not.toBeNull();
  const start = { x: canvas!.x + startX, y: canvas!.y + startY };
  const middle = {
    x: firstBox!.x + firstBox!.width / 2,
    y: firstBox!.y + firstBox!.height / 2,
  };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, id: 0 }],
  });
  await page.waitForTimeout(100);
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((middle.x - start.x) * step) / 10,
          y: start.y + ((middle.y - start.y) * step) / 10,
          id: 0,
        },
      ],
    });
    await page.waitForTimeout(24);
  }
  await expect(trace).toHaveAttribute("data-trace-progress", "1");
  await page.waitForTimeout(380);
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
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: current.x + ((destination.x - current.x) * step) / 10,
          y: current.y + ((destination.y - current.y) * step) / 10,
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
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "trace-road",
      );
    })
    .toBe(true);
});

test("trace road consumes the oldest narrow twelve-step route", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage route contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_TRACE);
  await seedGameDifficulty(page, "trace-road", 72, {
    pathLength: 8,
    pathWidth: "narrow",
    turnCount: 10,
    guideStrength: "on_request",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Urmează drumul" }).click();
  const trace = page.locator(
    '[data-game-ready="true"][data-trace-points="13"]',
  );
  await expect(trace).toBeVisible({ timeout: 8_000 });
  await expect(
    page.getByRole("group", { name: "Urmează drumul în 12 pași" }),
  ).toBeVisible();
  const next = page.locator("button.pixi-trace-checkpoint:enabled");
  await expect(next).toHaveCount(1);
  const box = await next.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(96);
  expect(box?.height).toBeGreaterThanOrEqual(96);
});

test("peek and find hides both the visual and semantic answer in Pixi", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_PEEK);
  await enterHome(page);
  await page.getByRole("button", { name: "Privește și găsește" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  await expect(page.locator(".pixi-accessibility .sr-only")).toHaveAttribute(
    "hidden",
    "",
  );
  const cups = page.locator("button.pixi-accessibility-choice");
  await expect(cups).toHaveCount(2);
  await cups.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(60);
  await cups.nth(1).evaluate((button: HTMLButtonElement) => button.click());

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "peek-and-find",
      );
    })
    .toBe(true);
});

test("peek and find renders the oldest nine-cup transformed stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_PEEK);
  await seedGameDifficulty(page, "peek-and-find", 72, {
    itemCount: 12,
    delayMs: 6_000,
    locationCount: 9,
    transformation: "rotate_layout",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Privește și găsește" }).click();
  await expect(
    page.locator(
      '[data-game-ready="true"][data-item-count="12"][data-location-count="9"][data-transformation="rotate_layout"]',
    ),
  ).toBeVisible({
    timeout: 12_000,
  });
  const cups = page.locator("button.pixi-accessibility-choice:not(:disabled)");
  await expect(cups).toHaveCount(9);
  const boxes = await cups.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(96);
    expect(box.height).toBeGreaterThanOrEqual(96);
  }
});

test("wait for go completes four Pixi signals without rewarding speed", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_WAIT);
  await enterHome(page);
  await page.getByRole("button", { name: "Așteaptă semnalul" }).click();

  for (let index = 0; index < 4; index += 1) {
    const group = page.getByRole("group", {
      name: `Semnalul ${index + 1} din 4`,
    });
    await expect(group).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
    const action = page.locator("button.pixi-target-action");
    const label = await action.getAttribute("aria-label");
    expect(label).toContain(`semnalul ${index + 1} din 4`);
    if (label?.startsWith("Atinge soarele")) {
      await action.evaluate((button: HTMLButtonElement) => button.click());
    }
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "wait-for-go",
      );
    })
    .toBe(true);
});

test("wait for go consumes the full sixteen-signal ladder stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_WAIT);
  await seedGameDifficulty(page, "wait-for-go", 72, {
    trialCount: 16,
    goNoGoRatio: 0.55,
    signalDelayMs: 1_000,
    ruleComplexity: 3,
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Așteaptă semnalul" }).click();
  await expect(
    page.getByRole("group", { name: "Semnalul 1 din 16" }),
  ).toBeVisible({ timeout: 8_000 });
  const action = page.locator("button.pixi-target-action");
  const box = await action.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(96);
  expect(box?.height).toBeGreaterThanOrEqual(96);
  await page.getByRole("button", { name: "Înapoi acasă" }).click();
});

test("shadow matching uses the shared Pixi choice renderer", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_SHADOW);
  await enterHome(page);
  await page.getByRole("button", { name: "Potrivește umbra" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(2);
  await options.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(50);
  await options.nth(1).evaluate((button: HTMLButtonElement) => button.click());

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "shadow-match",
      );
    })
    .toBe(true);
});

test("shadow matching keeps eight choices touch-sized on the oldest ladder stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_SHADOW);
  await seedGameDifficulty(page, "shadow-match", 72, {
    choiceCount: 8,
    distractorSimilarity: 4,
    targetCueDuration: 0,
    sceneClutter: 4,
  });

  await enterHome(page);
  await page.getByRole("button", { name: "Potrivește umbra" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(8);
  const boxes = await options.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(96);
    expect(box.height).toBeGreaterThanOrEqual(96);
  }
});

test("listen and find keeps the answer hidden in the shared Pixi choice scene", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_LISTEN);
  await enterHome(page);
  await page.getByRole("button", { name: "Ascultă și găsește" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const replay = page.getByRole("button", { name: "Repetă cerința audio" });
  await expect(replay).toBeVisible();
  const replayBox = await replay.boundingBox();
  expect(replayBox?.width).toBeGreaterThanOrEqual(96);
  expect(replayBox?.height).toBeGreaterThanOrEqual(96);
  await replay.evaluate((button: HTMLButtonElement) => button.click());
  await expect(replay).toBeEnabled();
  await expect
    .poll(async () =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => /\/audio\/ro-RO-v1\/listen-.+-1\.mp3$/.test(entry.name)),
      ),
    )
    .toBe(true);

  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(2);
  await options.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(50);
  await options.nth(1).evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "listen-find",
      );
    })
    .toBe(true);
});

test("listen replay respects the limited ladder stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic replay contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_LISTEN);
  await seedGameDifficulty(page, "listen-find", 48, {
    choiceCount: 3,
    utteranceLength: 2,
    attributeCount: 2,
    repeatAvailability: "limited",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Ascultă și găsește" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  const replay = page.getByRole("button", { name: "Repetă cerința audio" });
  await replay.evaluate((button: HTMLButtonElement) => button.click());
  await expect(replay).toBeDisabled();
});

test("listen and find renders the full eight-choice, eight-word stage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_LISTEN);
  await seedGameDifficulty(page, "listen-find", 72, {
    choiceCount: 8,
    utteranceLength: 8,
    attributeCount: 4,
    repeatAvailability: "on_request",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Ascultă și găsește" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(8);
  const boxes = await options.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(96);
    expect(box.height).toBeGreaterThanOrEqual(96);
  }
  await expect
    .poll(async () =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => /\/audio\/ro-RO-v1\/listen-.+-8\.mp3$/.test(entry.name)),
      ),
    )
    .toBe(true);
});

test("emotion matching uses the shared Pixi choice renderer", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_EMOTION);
  await enterHome(page);
  await page.getByRole("button", { name: "Cum se simte?" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(2);
  await options.nth(0).evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(50);
  await options.nth(1).evaluate((button: HTMLButtonElement) => button.click());

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "emotion-match",
      );
    })
    .toBe(true);
});

test("emotion matching renders all eight oldest-stage perspectives", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "One engine is sufficient for the deterministic high-stage layout contract.",
  );
  await seedCleanProgress(page, P0_BEFORE_EMOTION);
  await seedGameDifficulty(page, "emotion-match", 72, {
    choiceCount: 8,
    contextLength: 4,
    perspectiveCount: 2,
    ambiguity: 1,
  });

  await enterHome(page);
  await page.getByRole("button", { name: "Cum se simte?" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  const options = page.locator(".pixi-accessibility-choice");
  await expect(options).toHaveCount(8);
  const boxes = await options.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(96);
    expect(box.height).toBeGreaterThanOrEqual(96);
  }
});

test("shape sorting uses the shared Pixi batch renderer", async ({ page }) => {
  await seedCleanProgress(page, P0_BEFORE_SHAPE);
  await enterHome(page);
  await page.getByRole("button", { name: "Casa formelor" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  await expect(page.locator("button.pixi-drag-item")).toHaveCount(2);
  await placeVisiblePixiSortItems(page, (label) => `casa ${label}`);

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "sort-by-shape",
      );
    })
    .toBe(true);
});

test("size sorting uses four meaningful size categories in Pixi", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_SIZE);
  await seedGameDifficulty(page, "sort-by-size", 32, {
    itemCount: 2,
    binCount: 2,
    ruleCount: 1,
    ruleCueVisibility: "always",
  });
  await enterHome(page);
  await page.getByRole("button", { name: "Mic, mijlociu, mare" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  await expect(page.locator("button.pixi-drag-item")).toHaveCount(2);
  const plurals: Readonly<Record<string, string>> = {
    mic: "mici",
    mijlociu: "mijlocii",
    mare: "mari",
    "foarte mare": "foarte mari",
  };
  await placeVisiblePixiSortItems(
    page,
    (label) => `coșul pentru cele ${plurals[label] ?? label}`,
  );

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "sort-by-size",
      );
    })
    .toBe(true);
});

test("drag-and-fit completes through the shared spatial-fit archetype", async ({
  page,
}) => {
  await seedCleanProgress(page, P0_BEFORE_DRAG_AND_FIT);
  await enterHome(page);
  await page.getByRole("button", { name: "Mută și potrivește" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 8_000,
  });

  const items = page.locator("button.pixi-drag-item");
  await expect(items).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const item = items.nth(index);
    const label = await item.getAttribute("aria-label");
    expect(label).not.toBeNull();
    await item.evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator(`button.pixi-drop-target[aria-label="locul pentru ${label}"]`)
      .evaluate((button: HTMLButtonElement) => button.click());
  }

  await expect
    .poll(async () => {
      const profile = await readStoredProfile(page);
      return (profile?.attempts as Array<{ gameId: string }> | undefined)?.some(
        (attempt) => attempt.gameId === "drag-and-fit",
      );
    })
    .toBe(true);
});

const GOLDEN_SCENES = [
  {
    id: "same-picture",
    name: "Găsește perechea",
    unlocks: [] as string[],
  },
  {
    id: "sort-by-color",
    name: "Coșurile de culori",
    unlocks: ["same-picture"],
  },
  {
    id: "inset-puzzle",
    name: "Pune forma la loc",
    unlocks: ["same-picture", "sort-by-color"],
  },
  {
    id: "daily-order",
    name: "Ce facem întâi?",
    unlocks: P0_BEFORE_DAILY,
  },
  {
    id: "one-to-one-count",
    name: "Dă câte unul",
    unlocks: P0_BEFORE_COUNT,
  },
  {
    id: "drag-and-fit",
    name: "Mută și potrivește",
    unlocks: P0_BEFORE_DRAG_AND_FIT,
  },
  {
    id: "real-color-hunt",
    name: "Vânătoarea de culori",
    unlocks: P0_BEFORE_COLOR_HUNT,
  },
  {
    id: "shadow-match",
    name: "Potrivește umbra",
    unlocks: P0_BEFORE_SHADOW,
  },
  {
    id: "peek-and-find",
    name: "Privește și găsește",
    unlocks: P0_BEFORE_PEEK,
  },
  {
    id: "wait-for-go",
    name: "Așteaptă semnalul",
    unlocks: P0_BEFORE_WAIT,
  },
  {
    id: "emotion-match",
    name: "Cum se simte?",
    unlocks: P0_BEFORE_EMOTION,
  },
  {
    id: "listen-find",
    name: "Ascultă și găsește",
    unlocks: P0_BEFORE_LISTEN,
  },
  {
    id: "trace-road",
    name: "Urmează drumul",
    unlocks: P0_BEFORE_TRACE,
  },
  {
    id: "sort-by-shape",
    name: "Casa formelor",
    unlocks: P0_BEFORE_SHAPE,
  },
  {
    id: "sort-by-size",
    name: "Mic, mijlociu, mare",
    unlocks: P0_BEFORE_SIZE,
  },
] as const;

for (const scene of GOLDEN_SCENES) {
  test(`visual baseline: ${scene.id}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-07-25T10:00:00.000Z"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (scene.unlocks.length > 0) {
      await seedCleanProgress(page, scene.unlocks);
    }
    if (scene.id === "sort-by-size") {
      await seedGameDifficulty(page, "sort-by-size", 32, {
        itemCount: 2,
        binCount: 2,
        ruleCount: 1,
        ruleCueVisibility: "always",
      });
    }
    await enterHome(page);
    await page.getByRole("button", { name: scene.name }).click();
    await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
      timeout: 8_000,
    });
    await page.locator(".speech-bubble").evaluateAll((bubbles) => {
      bubbles.forEach((bubble) => bubble.remove());
    });
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation:none!important;transition:none!important;}",
    });
    await expect(page).toHaveScreenshot(`${scene.id}.png`, {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
  });
}

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
  await seedCleanProgress(page, P0_BEFORE_TRACE);
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
    await page.locator("body").click({ position: { x: 20, y: 20 } });
    await expect(
      page.locator('[data-screen="home"][data-screen-ready="true"]'),
    ).toBeVisible();
    await page.getByRole("button", { name: "Urmează drumul" }).click();
    await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  }
});
