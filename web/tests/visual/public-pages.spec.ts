import { expect, test } from "@playwright/test";

const priorityPublicPages = [
  { id: "home", path: "/" },
  { id: "dataset-catalog", path: "/dataset" },
  { id: "dataset-detail", path: "/dataset/jumlah-penduduk-per-kecamatan-2025" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 2200 },
  { name: "mobile", width: 390, height: 2000 },
];

test.describe("Public Priority Pages Visual Regression", () => {
  for (const pageCase of priorityPublicPages) {
    for (const viewport of viewports) {
      test(`${pageCase.id} - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageCase.path, { waitUntil: "networkidle" });
        await page.addStyleTag({
          content:
            "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}",
        });
        await page.waitForTimeout(250);

        await expect(page).toHaveScreenshot(`${pageCase.id}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.015,
          timeout: 20000,
        });
      });
    }
  }
});
