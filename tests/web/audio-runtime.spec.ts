import { expect, test } from "@playwright/test";

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
