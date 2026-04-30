import { URL } from "node:url";
import { load } from "cheerio";

const BAPPEDA_DATA_PUBLIKASI_URL =
  "https://bappeda.bulungan.go.id/informasi/index?meta%5Bkategori%5D=data-dan-publikasi";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_BACKOFF_MS = 500;
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_MAX_HTML_PAGES = 6;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export interface BappedaPublicationItem {
  id: string;
  title: string;
  publishedDate: string;
  downloadCount: number | null;
  viewUrl: string;
  downloadUrl: string;
  sourcePageUrl: string;
}

type CacheEntry = {
  items: BappedaPublicationItem[];
  cachedAt: number;
};

const cacheStore = new Map<string, CacheEntry>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseIntWithFallback(value: string | undefined, fallback: number, min = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getCacheTtlMs(): number {
  return parseIntWithFallback(process.env.BAPPEDA_PUBLIKASI_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
}

function getMaxHtmlPages(): number {
  return parseIntWithFallback(process.env.BAPPEDA_PUBLIKASI_MAX_PAGES, DEFAULT_MAX_HTML_PAGES);
}

function normalizeText(value: string | undefined | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .trim();
}

function parseMetaText(metaText: string): { publishedDate: string; downloadCount: number | null } {
  const cleaned = normalizeText(metaText);
  if (!cleaned) {
    return { publishedDate: "1970-01-01", downloadCount: null };
  }

  const parts = cleaned.split("-");
  const datePart = normalizeText(parts[0]);
  const countPart = normalizeText(parts.slice(1).join("-"));

  let publishedDate = "1970-01-01";
  if (datePart) {
    const parsedDate = new Date(datePart);
    if (!Number.isNaN(parsedDate.getTime())) {
      publishedDate = parsedDate.toISOString().slice(0, 10);
    }
  }

  const countMatch = countPart.match(/(\d+)\s*x\s*diunduh/i);
  const downloadCount = countMatch ? Number.parseInt(countMatch[1], 10) : null;

  return { publishedDate, downloadCount };
}

function shouldRetry(statusCode: number): boolean {
  return RETRYABLE_STATUS_CODES.has(statusCode);
}

async function fetchTextWithRetry(url: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= DEFAULT_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; SatuDataBulunganBot/1.0)",
        },
      });

      clearTimeout(timer);

      if (response.ok) {
        return response.text();
      }

      if (!shouldRetry(response.status) || attempt === DEFAULT_RETRY_COUNT) {
        throw new Error(`HTTP ${response.status} untuk ${url}`);
      }
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error : new Error("Gagal mengambil halaman publikasi Bappeda.");

      if (attempt === DEFAULT_RETRY_COUNT) {
        break;
      }
    }

    await delay(DEFAULT_BACKOFF_MS * 2 ** attempt);
  }

  throw lastError ?? new Error("Gagal mengambil halaman publikasi Bappeda.");
}

function buildAbsoluteUrl(value: string | undefined, baseUrl: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseItemsFromPage(html: string, pageUrl: string): BappedaPublicationItem[] {
  const $ = load(html);
  const items: BappedaPublicationItem[] = [];

  $(".card.bg-gray.border-0").each((index, element) => {
    const wrapper = $(element);
    const title = normalizeText(wrapper.find("h6").first().text());
    const metaText = normalizeText(wrapper.find("small").first().text());
    const links = wrapper.find("a.btn");

    const viewHrefRaw = links.eq(0).attr("href");
    const downloadHrefRaw = links.eq(1).attr("href");
    const viewUrl = buildAbsoluteUrl(viewHrefRaw, pageUrl);
    const downloadUrl = buildAbsoluteUrl(downloadHrefRaw, pageUrl);

    if (!title || !viewUrl || !downloadUrl) {
      return;
    }

    const { publishedDate, downloadCount } = parseMetaText(metaText);

    items.push({
      id: `${publishedDate}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
      title,
      publishedDate,
      downloadCount,
      viewUrl,
      downloadUrl,
      sourcePageUrl: pageUrl,
    });
  });

  return items;
}

function parsePaginationLinks(html: string, pageUrl: string): string[] {
  const $ = load(html);
  const links = new Set<string>();

  $(".pagination a.page-link").each((_, element) => {
    const hrefRaw = $(element).attr("href");
    const href = buildAbsoluteUrl(hrefRaw, pageUrl);
    if (href) {
      links.add(href);
    }
  });

  return Array.from(links);
}

function dedupeItems(items: BappedaPublicationItem[]): BappedaPublicationItem[] {
  const byKey = new Map<string, BappedaPublicationItem>();

  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.viewUrl.toLowerCase()}`;
    if (!byKey.has(key)) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values());
}

export async function getBappedaDigitalPublications(): Promise<BappedaPublicationItem[]> {
  const cacheKey = "bappeda:data-publikasi";
  const cached = cacheStore.get(cacheKey);
  const ttl = getCacheTtlMs();

  if (cached && Date.now() - cached.cachedAt <= ttl) {
    return cached.items;
  }

  const maxPages = getMaxHtmlPages();
  const visited = new Set<string>();
  const queue: string[] = [BAPPEDA_DATA_PUBLIKASI_URL];
  const collected: BappedaPublicationItem[] = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);

    const html = await fetchTextWithRetry(currentUrl);
    collected.push(...parseItemsFromPage(html, currentUrl));

    const nextLinks = parsePaginationLinks(html, currentUrl);
    for (const link of nextLinks) {
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
  }

  const items = dedupeItems(collected).sort((left, right) => right.publishedDate.localeCompare(left.publishedDate));
  cacheStore.set(cacheKey, { items, cachedAt: Date.now() });
  return items;
}
