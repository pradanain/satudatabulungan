import { expect, test } from "@playwright/test";
import {
  buildInfografisApiPayload,
  normalizeImageOriginalCandidate,
  parseInfografisHtml,
} from "@/lib/services/infografis-service";
import type { InfografisItem } from "@/lib/types/infografis";

test.describe("Infografis Service", () => {
  test("parseInfografisHtml mengambil title, postUrl, imageUrl", () => {
    const html = `
      <div class="rt-grid-item" data-id="6264">
        <a class="tpg-post-link" href="https://diskominfo.bulungan.go.id/wp/capaian-kinerja-makro-ringkasan-lppd-2025/">
          <img data-src="https://diskominfo.bulungan.go.id/wp/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-07-at-12.33.48-2-768x960.jpeg" alt="Capaian Makro" width="768" height="960" />
        </a>
        <div class="entry-title-wrapper">
          <h3 class="entry-title">
            <a class="tpg-post-link" href="https://diskominfo.bulungan.go.id/wp/capaian-kinerja-makro-ringkasan-lppd-2025/">Capaian Kinerja Makro</a>
          </h3>
        </div>
        <div class="post-meta-tags rt-el-post-meta">
          <span class="date"><a href="https://diskominfo.bulungan.go.id/wp/2026/04/13/">13 April 2026</a></span>
        </div>
      </div>
    `;

    const parsed = parseInfografisHtml(html, "https://diskominfo.bulungan.go.id/wp/infografis/");

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].title).toBe("Capaian Kinerja Makro");
    expect(parsed.items[0].postUrl).toBe(
      "https://diskominfo.bulungan.go.id/wp/capaian-kinerja-makro-ringkasan-lppd-2025/",
    );
    expect(parsed.items[0].imageUrl).toBe(
      "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-07-at-12.33.48-2-768x960.jpeg",
    );
  });

  test("normalizeImageOriginalCandidate menghapus suffix ukuran jika ada", () => {
    const resized =
      "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-07-at-12.33.48-2-768x960.jpeg";
    const normalized = normalizeImageOriginalCandidate(resized);

    expect(normalized).toBe(
      "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-07-at-12.33.48-2.jpeg",
    );
  });

  test("buildInfografisApiPayload menghasilkan struktur response endpoint yang benar", () => {
    const seed: InfografisItem[] = [
      {
        id: "1",
        source: "html_scrape",
        title: "Infografis 1",
        postUrl: "https://diskominfo.bulungan.go.id/wp/a",
        imageUrl: "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/a.jpg",
      },
      {
        id: "2",
        source: "html_scrape",
        title: "Infografis 2",
        postUrl: "https://diskominfo.bulungan.go.id/wp/b",
        imageUrl: "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/b.jpg",
      },
      {
        id: "3",
        source: "html_scrape",
        title: "Infografis 3",
        postUrl: "https://diskominfo.bulungan.go.id/wp/c",
        imageUrl: "https://diskominfo.bulungan.go.id/wp/wp-content/uploads/c.jpg",
      },
    ];

    const payload = buildInfografisApiPayload(seed, "html_scrape", 1, 2);

    expect(payload.success).toBeTruthy();
    expect(payload.data).toHaveLength(2);
    expect(payload.meta.page).toBe(1);
    expect(payload.meta.limit).toBe(2);
    expect(payload.meta.total).toBe(3);
    expect(payload.meta.hasNextPage).toBeTruthy();
    expect(payload.meta.sourceUsed).toBe("html_scrape");
    expect(payload.meta.externalSource).toContain("diskominfo.bulungan.go.id");
  });

  test("endpoint /api/infografis mengembalikan struktur response yang benar", async ({ request }) => {
    const response = await request.get("/api/infografis?page=1&limit=2&source=auto");
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload).toHaveProperty("success");
    expect(payload).toHaveProperty("data");
    expect(Array.isArray(payload.data)).toBeTruthy();
    expect(payload).toHaveProperty("meta");
    expect(typeof payload.meta.page).toBe("number");
    expect(typeof payload.meta.limit).toBe("number");
    expect(typeof payload.meta.total).toBe("number");
    expect(typeof payload.meta.hasNextPage).toBe("boolean");
    expect(typeof payload.meta.sourceUsed).toBe("string");
    expect(typeof payload.meta.externalSource).toBe("string");
  });
});
