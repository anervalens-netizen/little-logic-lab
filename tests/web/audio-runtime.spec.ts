import { expect, test } from "@playwright/test";

test("offline preparation and speech finish before child input", async ({
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

  await page.getByRole("button", { name: "Găsește perechea" }).click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-speech-state",
    "idle",
  );
});
