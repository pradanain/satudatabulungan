import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  createCkanPublication,
  updateCkanPublication,
  getCkanPublicationBySlug,
  getOrganizations,
  type PublicationPayload,
} from "@/lib/services/ckan-portal-api";

const beritaDirectory = path.join(process.cwd(), "public", "berita");
const beritaImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const INDONESIAN_MONTHS: Record<string, string> = {
  januari: "01", februari: "02", maret: "03", april: "04",
  mei: "05", juni: "06", juli: "07", agustus: "08",
  september: "09", oktober: "10", november: "11", desember: "12",
};

function buildCkanSlug(title: string, contentType: string): string {
  const prefix = contentType === "news" ? "berita" : contentType === "publikasi" ? "buku" : "infografis";
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 85);
  return `${prefix}-${base}`;
}

function extractDateFromUrl(url: string): string | null {
  const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function extractDateFromContent(content: string): string | null {
  const match = content.match(
    /\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})\b/i
  );
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = INDONESIAN_MONTHS[match[2].toLowerCase()];
  const year = match[3];
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

function normalizeText(text: string): string {
  return text
    .replaceAll("\u00e2\u0080\u0093", "-")
    .replaceAll("\u00e2\u0080\u009c", '"')
    .replaceAll("\u00e2\u0080\u009d", '"')
    .replaceAll("\u00e2\u0080\u0099", "'")
    .replaceAll("\u00c2", "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferOrganization(url: string): string {
  if (url.includes("bulungankab.bps.go.id")) return "BPS Kabupaten Bulungan";
  if (url.includes("diskominfo.bulungan.go.id")) return "Diskominfo Kabupaten Bulungan";
  return "Pemerintah Kabupaten Bulungan";
}

type ParsedLegacyNews = {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  sourceUrl: string;
  organization: string;
  imageFileName: string | null;
};

async function parseLegacyNewsFiles(): Promise<ParsedLegacyNews[]> {
  try {
    const directoryEntries = await readdir(beritaDirectory, { withFileTypes: true });
    const txtEntries = directoryEntries.filter((e) => e.isFile() && e.name.endsWith(".txt"));

    const results: ParsedLegacyNews[] = [];

    for (const entry of txtEntries) {
      const slug = entry.name.replace(/\.txt$/, "");
      const rawText = await readFile(path.join(beritaDirectory, entry.name), "utf8");
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      if (lines.length < 2) continue;

      const sourceUrl = lines[0];
      if (!sourceUrl.startsWith("http")) continue;

      const title = normalizeText(lines[1]);
      const contentLines = lines.slice(2);
      const content = normalizeText(contentLines.join("\n\n"));
      const firstParagraph = normalizeText(contentLines.join(" "));
      const description = firstParagraph.length > 200
        ? `${firstParagraph.slice(0, 197).trimEnd()}...`
        : firstParagraph;

      const imageFileName = beritaImageExtensions
        .map((ext) => `${slug}${ext}`)
        .find((fn) =>
          directoryEntries.some((c) => c.isFile() && c.name === fn)
        ) ?? null;

      const date =
        extractDateFromUrl(sourceUrl) ??
        extractDateFromContent(rawText) ??
        "2024-01-01";

      results.push({
        slug,
        title,
        description,
        content,
        date,
        sourceUrl,
        organization: inferOrganization(sourceUrl),
        imageFileName,
      });
    }

    return results;
  } catch {
    console.warn("[migrate-legacy-news] Gagal membaca folder public/berita");
    return [];
  }
}

function getMigrationState() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalState = globalThis as any;
  if (!globalState.__legacyNewsMigration) {
    globalState.__legacyNewsMigration = { done: false, promise: null };
  }
  return globalState.__legacyNewsMigration;
}

/**
 * Migrasi berita lama dari public/berita/ ke CKAN.
 * Hanya dijalankan sekali per lifecycle server.
 * Idempotent — cek slug di CKAN sebelum create.
 */
export async function migrateLegacyNewsToCkan(): Promise<{ migrated: number; skipped: number; errors: number }> {
  const state = getMigrationState();
  if (state.done) {
    return { migrated: 0, skipped: 0, errors: 0 };
  }

  const stats = { migrated: 0, skipped: 0, errors: 0 };

  try {
    const legacyNews = await parseLegacyNewsFiles();
    if (legacyNews.length === 0) {
      console.info("[migrate-legacy-news] Tidak ada berita lama ditemukan.");
      state.done = true;
      return stats;
    }

    // Find the DKIP org ID for assigning ownership
    const organizations = await getOrganizations();
    const dkipOrg = organizations.find((o) =>
      o.name.toLowerCase().includes("komunikasi") ||
      o.slug.includes("dkip")
    );

    if (!dkipOrg) {
      console.warn("[migrate-legacy-news] Organisasi DKIP tidak ditemukan di CKAN. Migrasi dibatalkan.");
      return stats;
    }

    console.info(`[migrate-legacy-news] Memulai migrasi ${legacyNews.length} berita ke CKAN...`);

    for (const news of legacyNews) {
      const ckanSlug = buildCkanSlug(news.title, "news");

      try {
        // Check if already migrated
        const existing = await getCkanPublicationBySlug(ckanSlug);
        if (existing) {
          // Check if date needs correcting
          const existingDate = (existing.extras.published_at || "").slice(0, 10);
          if (existingDate !== news.date) {
            console.info(`[migrate-legacy-news] Memperbarui tanggal untuk: "${news.title}" (${existingDate} => ${news.date})`);
            await updateCkanPublication(existing.id, {
              publishedAt: `${news.date}T00:00:00.000Z`,
              year: news.date.slice(0, 4),
            }, "news");
            stats.migrated++;
          } else {
            stats.skipped++;
          }
          continue;
        }

        const payload: PublicationPayload = {
          title: news.title,
          description: news.description,
          content: news.content,
          ownerOrgId: dkipOrg.id,
          status: "Published",
          publishedAt: `${news.date}T00:00:00.000Z`,
          imageUrl: news.imageFileName ? `/berita/${news.imageFileName}` : "",
          sourceUrl: news.sourceUrl,
          year: news.date.slice(0, 4),
          tags: ["berita", "satu-data", "bulungan"],
        };

        await createCkanPublication(payload, "news");
        stats.migrated++;
        console.info(`[migrate-legacy-news] ✅ Berhasil migrasi: ${news.title}`);
      } catch (error) {
        stats.errors++;
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.warn(`[migrate-legacy-news] ❌ Gagal migrasi "${news.title}": ${msg}`);
      }
    }

    state.done = true;
    console.info(
      `[migrate-legacy-news] Selesai. Migrasi: ${stats.migrated}, Skip: ${stats.skipped}, Error: ${stats.errors}`
    );
  } catch (error) {
    console.error("[migrate-legacy-news] Fatal error:", error);
  }

  return stats;
}

/**
 * Trigger migrasi sekali saat pertama kali dipanggil.
 * Non-blocking — jalan di background.
 */
export function ensureLegacyNewsMigration(): void {
  const state = getMigrationState();
  if (state.done || state.promise) return;
  state.promise = migrateLegacyNewsToCkan()
    .catch((err) => console.error("[migrate-legacy-news] Background migration failed:", err))
    .finally(() => { state.promise = null; });
}
