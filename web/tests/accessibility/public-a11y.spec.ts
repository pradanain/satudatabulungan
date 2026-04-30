import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const priorityPublicPages = [
  { id: "home", path: "/" },
  { id: "dataset-catalog", path: "/dataset" },
  { id: "dataset-detail", path: "/dataset/jumlah-penduduk-per-kecamatan-2025" },
  { id: "publikasi-berita", path: "/publikasi-berita" },
  { id: "publikasi-buku-digital", path: "/publikasi-buku-digital" },
  { id: "publikasi-infografis", path: "/publikasi/infografis" },
  { id: "publikasi-regulasi", path: "/publikasi-regulasi" },
  { id: "publikasi-petunjuk-teknis", path: "/publikasi-petunjuk-teknis" },
];

test.describe("Public Priority Pages Accessibility Audit", () => {
  for (const pageCase of priorityPublicPages) {
    test(`${pageCase.id} - no critical/serious axe violations`, async ({ page }) => {
      await page.goto(pageCase.path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const severeIssues = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );

      expect(severeIssues, JSON.stringify(severeIssues, null, 2)).toEqual([]);
    });

    test(`${pageCase.id} - keyboard focus flow works`, async ({ page }) => {
      await page.goto(pageCase.path, { waitUntil: "networkidle" });

      const focusTargets: string[] = [];
      const hasVisibleFocusStates: boolean[] = [];

      for (let index = 0; index < 8; index += 1) {
        await page.keyboard.press("Tab");
        const active = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement | null;
          if (!element) {
            return null;
          }

          const style = window.getComputedStyle(element);
          const marker = [
            element.tagName.toLowerCase(),
            element.id ? `#${element.id}` : "",
            element.getAttribute("name") ? `[name=${element.getAttribute("name")}]` : "",
            element.textContent?.trim().slice(0, 24) ?? "",
          ]
            .join("")
            .trim();

          const hasVisibleFocus =
            style.outlineStyle !== "none" ||
            style.outlineWidth !== "0px" ||
            (style.boxShadow && style.boxShadow !== "none");

          return {
            marker,
            hasVisibleFocus,
            tagName: element.tagName.toLowerCase(),
          };
        });

        if (active?.marker && active.tagName !== "body") {
          focusTargets.push(active.marker);
          hasVisibleFocusStates.push(active.hasVisibleFocus);
        }
      }

      const uniqueTargets = [...new Set(focusTargets)];
      expect(uniqueTargets.length).toBeGreaterThanOrEqual(3);
      expect(hasVisibleFocusStates.some(Boolean)).toBeTruthy();
    });
  }
});
