import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const AUDIO_PACK_VERSION = (JSON.parse(readFileSync(new URL("../../content/audio-packs.json", import.meta.url), "utf8")) as { version: string }).version;

async function enterHome(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Logic Lab", exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 35_000 });
}

async function enterParentData(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Zonă pentru adulți" }).click();
  await page
    .getByRole("button", { name: "Ține apăsat 3 secunde" })
    .dispatchEvent("pointerdown");
  await expect(
    page.locator('[data-screen="parent"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Date" }).click();
}

test("Parent Mode reports required audio packs as locally installed", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });

  await enterHome(page);
  await enterParentData(page);

  await expect(page.getByRole("heading", { name: "Pachete locale" })).toBeVisible();
  const rows = page.locator(".parent-content-pack-row");
  await expect(rows).toHaveCount(3);

  for (const title of ["Vocea de bază", "Aventura atelierului"]) {
    const row = rows.filter({ hasText: title });
    await expect(row).toBeVisible();
    await expect(row.getByText("obligatoriu", { exact: true })).toBeVisible();
    await expect(row.getByText("instalat", { exact: true })).toBeVisible();
    await expect(row).toContainText(/\d+\/\d+ fișiere/);
    await expect(row).toContainText(/(?:KB|MB)/);
  }

  await page.getByRole("button", { name: "Reverifică pachetele" }).click();
  await expect(page.getByText("pregătit", { exact: true })).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("a missing required clip blocks Child Mode and can be repaired locally", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-touch",
    "Cache mutation is verified on the repeatable Chromium service-worker target.",
  );

  await enterHome(page);
  const removed = await page.evaluate(async (packVersion) => {
    let removed = false;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const request = (await cache.keys()).find(
        (candidate) =>
          new URL(candidate.url).pathname ===
          "/audio/ro-RO-v1/hello-lumi.mp3",
      );
      if (request) {
        const response = await cache.match(request);
        if (response) {
          // An earlier release used the same pack version. Its repair must not
          // satisfy current-release readiness after the real asset is removed.
          const stale = await caches.open(`logic-lab-audio-repair-${packVersion}`);
          await stale.put("/audio/ro-RO-v1/hello-lumi.mp3", response);
        }
        removed = (await cache.delete(request)) || removed;
      }
    }
    return removed;
  }, AUDIO_PACK_VERSION);
  expect(removed).toBe(true);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Logic Lab", exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Atinge și joacă-te!" })
    .click();

  await expect(
    page.getByText(
      "Pachetul local este incomplet. Conectează telefonul la internet și încearcă din nou.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 30_000 });
  const repair = page.getByRole("button", {
    name: "REPARĂ ȘI ÎNCEARCĂ DIN NOU",
  });
  await expect(repair).toBeVisible();
  await expect(page.locator('[data-screen="home"]')).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-state",
    "unavailable",
  );

  await repair.click();
  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 35_000 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-state",
    "ready",
  );
  const repaired = await page.evaluate(async () => {
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      const request = (await cache.keys()).find(
        (candidate) =>
          new URL(candidate.url).pathname ===
          "/audio/ro-RO-v1/hello-lumi.mp3",
      );
      if (request) return Boolean(await cache.match(request));
    }
    return false;
  });
  expect(repaired).toBe(true);
});
