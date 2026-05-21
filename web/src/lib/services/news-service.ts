import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  getPublishedNews,
  getNews,
  type PortalDataset,
} from "@/lib/services/ckan-portal-api";
import { ensureLegacyNewsMigration } from "@/lib/services/migrate-legacy-news";

export interface PortalNewsItem {
  title: string;
  description: string;
  date: string;
  organization: string;
  href: string;
  topicLabel: string;
  imageSrc: string;
}

const beritaAcronyms = new Set(["SDI", "BPS", "OPD", "DKIP", "API"]);
const beritaMinorWords = new Set(["dan", "di", "ke", "dari", "untuk", "pada", "dengan", "selaku", "yang"]);
const beritaImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const beritaDirectory = path.join(process.cwd(), "public", "berita");

function normalizeNewsTitle(text: string) {
  const normalized = text.trim().toLowerCase();

  return normalized
    .split(" ")
    .map((word, index) => {
      if (!word) return word;

      const acronymCandidate = word.toUpperCase();
      if (beritaAcronyms.has(acronymCandidate)) return acronymCandidate;

      if (index > 0 && beritaMinorWords.has(word)) return word;

      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

function inferNewsTopicLabel(content: string) {
  const normalized = content.toLowerCase();

  if (normalized.includes("forum")) return "Forum Satu Data";
  if (normalized.includes("koordinasi")) return "Koordinasi SDI";
  if (normalized.includes("bimtek")) return "Bimtek Portal";

  return "Satu Data";
}

function normalizeLegacyText(text: string) {
  return text
    .replaceAll("\u00e2\u0080\u0093", "-")
    .replaceAll("\u00e2\u0080\u009c", '"')
    .replaceAll("\u00e2\u0080\u009d", '"')
    .replaceAll("\u00e2\u0080\u0099", "'")
    .replaceAll("\u00c2", "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferOrganizationFromSourceUrl(sourceUrl: string): string {
  const normalized = sourceUrl.toLowerCase();
  if (normalized.includes("bulungankab.bps.go.id")) return "BPS Kabupaten Bulungan";
  if (normalized.includes("diskominfo.bulungan.go.id")) return "Diskominfo Kabupaten Bulungan";
  return "Pemerintah Kabupaten Bulungan";
}

function extractDateFromLegacySourceUrl(sourceUrl: string): string | null {
  const match = sourceUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

async function loadLegacyNewsItemsFromPublic(limit = Number.MAX_SAFE_INTEGER): Promise<PortalNewsItem[]> {
  try {
    const entries = await readdir(beritaDirectory, { withFileTypes: true });
    const txtEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".txt"));
    const output: PortalNewsItem[] = [];

    for (const entry of txtEntries) {
      const slug = entry.name.replace(/\.txt$/, "");
      const rawText = await readFile(path.join(beritaDirectory, entry.name), "utf8");
      const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      const sourceUrl = lines[0];
      if (!sourceUrl.startsWith("http")) continue;

      const title = normalizeLegacyText(lines[1]);
      if (!title) continue;

      const content = normalizeLegacyText(lines.slice(2).join(" "));
      const description = content.length > 200
        ? `${content.slice(0, 197).trimEnd()}...`
        : content;
      const fallbackDate = "2024-01-01";
      const date = extractDateFromLegacySourceUrl(sourceUrl) ?? fallbackDate;
      const imageFileName = beritaImageExtensions
        .map((ext) => `${slug}${ext}`)
        .find((fileName) => entries.some((file) => file.isFile() && file.name === fileName));

      output.push({
        title,
        description,
        date,
        organization: inferOrganizationFromSourceUrl(sourceUrl),
        href: sourceUrl,
        topicLabel: inferNewsTopicLabel(`${title} ${content}`),
        imageSrc: imageFileName ? `/berita/${imageFileName}` : "/assets/brand/logos/lambang-bulungan.png",
      });
    }

    return output
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, limit);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(`[news-service] fallback public/berita gagal dibaca: ${reason}`);
    return [];
  }
}

function mapCkanToNewsItem(dataset: PortalDataset): PortalNewsItem {
  const publishedAt = dataset.extras.published_at || dataset.metadataModified;
  const date = publishedAt.slice(0, 10);
  const imageUrl = dataset.extras.image_url || "";
  const sourceUrl = dataset.extras.source_url || "";
  const description = dataset.extras.description || dataset.description || "";

  // If there's a source_url (legacy migrated news), link to that external URL
  // Otherwise link to our internal page
  const href = sourceUrl || `/publikasi-berita/${dataset.slug}`;

  return {
    title: dataset.title,
    description: description.length > 200
      ? `${description.slice(0, 197).trimEnd()}...`
      : description,
    date,
    organization: dataset.organizationName,
    href,
    topicLabel: inferNewsTopicLabel(`${dataset.title} ${description}`),
    imageSrc: imageUrl || "/assets/brand/logos/lambang-bulungan.png",
  };
}

export async function loadKabarDataItems(limit = Number.MAX_SAFE_INTEGER): Promise<PortalNewsItem[]> {
  // Trigger migrasi berita lama (non-blocking, sekali saja)
  ensureLegacyNewsMigration();

  try {
    const publishedNews = await getPublishedNews();

    const newsItems = publishedNews.map(mapCkanToNewsItem);

    return newsItems
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, limit);
  } catch (error) {
    console.error("[news-service] Gagal memuat berita dari CKAN:", error);
    const fallbackItems = await loadLegacyNewsItemsFromPublic(limit);
    if (fallbackItems.length > 0) {
      console.info(`[news-service] fallback public/berita aktif: ${fallbackItems.length} item.`);
      return fallbackItems;
    }
    return [];
  }
}

/**
 * Load all news items (including non-published) for internal dashboard.
 */
export async function loadAllNewsItems(): Promise<PortalNewsItem[]> {
  try {
    const allNews = await getNews();
    return allNews.map(mapCkanToNewsItem);
  } catch (error) {
    console.error("[news-service] Gagal memuat semua berita dari CKAN:", error);
    return loadLegacyNewsItemsFromPublic();
  }
}
