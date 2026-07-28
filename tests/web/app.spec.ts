import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function readStoredProfile(
  page: Page,
): Promise<Record<string, any> | null> {
  return page.evaluate(
    () =>
      new Promise<Record<string, any> | null>((resolve, reject) => {
        const open = indexedDB.open("minte-in-joaca");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction("profiles", "readonly");
          const request = transaction.objectStore("profiles").get("current");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            resolve(request.result ?? null);
            db.close();
          };
        };
      }),
  );
}

async function enterHome(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 35_000 });
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toBeVisible();
}

async function enterParent(page: Page): Promise<void> {
  await enterHome(page);
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  const dialog = page.getByRole("dialog", { name: "Zonă pentru adulți" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
}

async function startGameFromParent(
  page: Page,
  gameTitle: string,
): Promise<void> {
  await enterParent(page);
  await page.getByRole("button", { name: "Jocuri" }).click();
  const item = page
    .locator(".parent-game-catalog-item")
    .filter({ hasText: gameTitle });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: "Testează un nivel" }).click();
  await expect(page.locator(".game-play-area")).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
}

async function completeCurrentChoiceLevel(page: Page): Promise<void> {
  const choices = page.locator("button.pixi-accessibility-choice");
  const count = await choices.count();
  expect(count).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < count; index += 1) {
    const button = choices.nth(index);
    if (!(await button.isVisible()).valueOf()) continue;
    await button.click();
    const sessionEnd = page.getByText("Gata pentru azi!", { exact: false });
    if (
      await sessionEnd
        .waitFor({ state: "visible", timeout: 2_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      return;
    }
  }
  await expect(page.getByText("Gata pentru azi!", { exact: false })).toBeVisible({
    timeout: 8_000,
  });
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

test("child home is local-only and exposes one guided journey", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") {
      externalRequests.push(request.url());
    }
  });

  await enterHome(page);

  await expect(page.locator(".home-adventure-stop")).toHaveCount(3);
  await expect(page.locator(".home-adventure button")).toHaveCount(1);
  await expect(page.locator("button.choice-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-screen="home"][data-unlocked-count="3"]'),
  ).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("visual baseline: splash", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.locator('[data-screen="splash"][data-screen-ready="true"]'),
  ).toBeVisible();
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important;}",
  });
  await expect(page).toHaveScreenshot("splash.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await expectNoAutomaticAccessibilityViolations(page);
});

test("visual baseline: premium child journey", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterHome(page);
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important;}",
  });
  await expect(page).toHaveScreenshot("child-home.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await expectNoAutomaticAccessibilityViolations(page);
});

test("Parent Mode persists settings and exposes metadata catalog", async ({ page }) => {
  await enterParent(page);
  await page.getByRole("button", { name: "Setări" }).click();

  const reducedMotion = page.getByRole("switch", {
    name: "Mișcare redusă (fără animații)",
  });
  await expect(reducedMotion).toHaveAttribute("aria-checked", "true");
  await reducedMotion.click();
  await expect(reducedMotion).toHaveAttribute("aria-checked", "false");
  await expect
    .poll(async () => (await readStoredProfile(page))?.settings?.reducedMotion)
    .toBe(false);

  await page.getByRole("button", { name: "Jocuri" }).click();
  await expect(
    page.getByRole("heading", { name: "Jocuri disponibile" }),
  ).toBeVisible();
  await expect(page.locator(".parent-game-catalog-item")).toHaveCount(15);
  await expect(
    page
      .locator(".parent-game-catalog-item")
      .filter({ hasText: "Găsește perechea" })
      .getByRole("button", { name: "Testează un nivel" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Date" }).click();
  await expect(page.getByRole("heading", { name: "Date locale" })).toBeVisible();
  await expect(page.locator(".parent-storage-health")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Exportă progresul (JSON)" }),
  ).toBeVisible();
});

test("visual baseline: Parent Mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterParent(page);
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important;}",
  });
  await expect(page).toHaveScreenshot("parent-overview.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await expectNoAutomaticAccessibilityViolations(page);

  await page.getByRole("button", { name: "Setări" }).click();
  await expect(page).toHaveScreenshot("parent-settings.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await expectNoAutomaticAccessibilityViolations(page);
});

test("Parent accessibility preferences apply to a manually tested game", async ({
  page,
}) => {
  await enterParent(page);
  await page.getByRole("button", { name: "Setări" }).click();
  await page.getByRole("switch", { name: "Contrast ridicat" }).click();
  await page
    .getByRole("switch", { name: "Ținte tactile extra-mari" })
    .click();
  await page
    .getByRole("switch", { name: "Demonstrații mai lente" })
    .click();

  await expect
    .poll(async () => (await readStoredProfile(page))?.settings)
    .toMatchObject({
      highContrast: true,
      targetSize: "extra_large",
      demonstrationSpeed: "slow",
    });

  const applied = await page.evaluate(() => ({
    contrast: document.documentElement.dataset.highContrast,
    targetSize: document.documentElement.dataset.targetSize,
    speed: document.documentElement.dataset.demonstrationSpeed,
    tapMinimum: getComputedStyle(document.documentElement)
      .getPropertyValue("--tap-min")
      .trim(),
  }));
  expect(applied).toEqual({
    contrast: "true",
    targetSize: "extra_large",
    speed: "slow",
    tapMinimum: "112px",
  });

  await page.getByRole("button", { name: "Jocuri" }).click();
  const startedAt = await page.evaluate(() => performance.now());
  await page
    .locator(".parent-game-catalog-item")
    .filter({ hasText: "Găsește perechea" })
    .getByRole("button", { name: "Testează un nivel" })
    .click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
  const readyAfterMs =
    (await page.evaluate(() => performance.now())) - startedAt;
  expect(readyAfterMs).toBeGreaterThanOrEqual(3_600);
  await expect(page.locator(".pixi-accessibility-choice").first()).toHaveCSS(
    "min-width",
    "112px",
  );
  await expect(page.locator("canvas.pixi-stage")).toHaveCSS(
    "filter",
    "contrast(1.16) saturate(0.92)",
  );
});

test("a completed adult test locks child play until Parent Mode allows a new session", async ({
  page,
}) => {
  await startGameFromParent(page, "Găsește perechea");
  await completeCurrentChoiceLevel(page);

  await expect(page).toHaveScreenshot("session-end.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
  });
  await expect
    .poll(async () => (await readStoredProfile(page))?.sessionLocked)
    .toBe(true);
  await page.getByRole("button", { name: "Înapoi acasă" }).click();

  await expect(
    page.locator(
      '[data-screen="home"][data-session-locked="true"][data-screen-ready="true"]',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toHaveCount(0);
  await expectNoAutomaticAccessibilityViolations(page);

  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Permite o sesiune nouă" }).click();

  await expect(
    page.locator(
      '[data-screen="home"][data-session-locked="false"][data-screen-ready="true"]',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuă aventura" }),
  ).toBeVisible();
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

  await page.getByRole("button", { name: "Jocuri" }).click();
  await page
    .locator(".parent-game-catalog-item")
    .filter({ hasText: "Găsește perechea" })
    .getByRole("button", { name: "Testează un nivel" })
    .click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
  await expectNoAutomaticAccessibilityViolations(page);
});

test("Romanian voice is bundled and cached for offline use", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const deadline = Date.now() + 25_000;
    while (!navigator.serviceWorker.controller && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });

  await context.setOffline(true);
  if (testInfo.project.name !== "webkit-touch") {
    const routedReleaseIdentity = await page.evaluate(async () => {
      const response = await fetch("/release.json");
      return {
        ok: response.ok,
        commit: ((await response.json()) as { commit: string }).commit,
      };
    });
    expect(routedReleaseIdentity.ok).toBe(true);
    expect(routedReleaseIdentity.commit).toMatch(/^[0-9a-f]{40}$/);
  }

  const cachedRecording = await page.evaluate(async () => {
    let response: Response | undefined;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const recordingRequest = (await cache.keys()).find(
        (request) =>
          new URL(request.url).pathname ===
          "/audio/ro-RO-v1/hello-lumi.mp3",
      );
      if (recordingRequest) response = await cache.match(recordingRequest);
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

  await startGameFromParent(page, "Găsește perechea");
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
});

test("completed attempt stores deterministic replay metadata durably", async ({
  page,
}) => {
  await startGameFromParent(page, "Găsește perechea");
  await completeCurrentChoiceLevel(page);

  await expect
    .poll(
      async () => (await readStoredProfile(page))?.attempts?.length ?? 0,
      { timeout: 8_000 },
    )
    .toBe(1);

  const stored = await readStoredProfile(page);
  const attempt = stored?.attempts?.[0];
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

test("Pixi scene is destroyed before returning to lightweight Home", async ({
  page,
}) => {
  await startGameFromParent(page, "Găsește perechea");
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(1);
  const replay = page.getByRole("button", { name: "Ascultă din nou" });
  await expect(replay).toBeVisible();
  await replay.click();
  await expect(replay).toHaveClass(/is-replaying/);

  await page.getByRole("button", { name: "Înapoi acasă" }).click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible();
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(0);
  await expect(page.locator(".game-screen")).toHaveCount(0);
  await expect(page.locator("button.choice-card")).toHaveCount(0);
});
