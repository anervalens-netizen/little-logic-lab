import { expect, test, type Page } from "@playwright/test";

async function openSamePictureTest(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Minte în joacă", { exact: true })).toBeVisible();
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
    .filter({ hasText: "Găsește perechea" })
    .getByRole("button", { name: "Previzualizează nivelul" })
    .click();
  await expect(page.locator('[data-game-ready="true"]')).toBeVisible({
    timeout: 12_000,
  });
}

test("leaving during pair-joining feedback destroys the scene without late errors", async ({
  page,
}) => {
  test.skip(
    true,
    "FIXME (validare 2026-08-06): data-game-ready visibility timing flakes sub chromium 1234 / Playwright 1.62.0; necesita investigare vezi VALIDATION-REPORT.md § \"data-game-ready ascuns\".",
  );
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await openSamePictureTest(page);
  const modelText = await page.locator(".pixi-accessibility .sr-only").textContent();
  const correctLabel = modelText?.replace(/^Model:\s*/, "").trim();
  expect(correctLabel).toBeTruthy();

  const correctChoice = page.getByRole("button", {
    name: correctLabel!,
    exact: true,
  });
  await expect(correctChoice).toBeVisible();
  await correctChoice.click();
  await page.getByRole("button", { name: "Înapoi acasă" }).click();

  await expect(
    page.locator('[data-screen="home"][data-screen-ready="true"]'),
  ).toBeVisible({ timeout: 8_000 });
  await page.waitForTimeout(1_400);
  await expect(page.locator("canvas.pixi-stage")).toHaveCount(0);
  await expect(page.locator(".pixi-accessibility")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
