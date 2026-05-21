import "server-only";

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
  } catch {
    return [];
  }
}
