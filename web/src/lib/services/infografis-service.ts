import { URL } from "node:url";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import type {
  InfografisApiResponse,
  InfografisItem,
  InfografisSourceQuery,
  InfografisSourceType,
} from "@/lib/types/infografis";

const EXTERNAL_INFOGRAFIS_SOURCE = "https://diskominfo.bulungan.go.id/wp/infografis/";
const WORDPRESS_REST_BASE_CANDIDATES = [
  "https://diskominfo.bulungan.go.id/wp-json/wp/v2",
  "https://diskominfo.bulungan.go.id/wp/wp-json/wp/v2",
] as const;
const ALLOWED_IMAGE_HOST = "diskominfo.bulungan.go.id";
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 4_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_BACKOFF_MS = 500;
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_MAX_HTML_PAGES = 2;

type FetchJsonOptions = {
  timeoutMs?: number;
  retries?: number;
};

type ServiceRequestParams = {
  page: number;
  limit: number;
  source: InfografisSourceQuery;
};

type FetchResult = {
  items: InfografisItem[];
  sourceUsed: InfografisSourceType;
};

type CacheEntry = {
  items: InfografisItem[];
  sourceUsed: InfografisSourceType;
  cachedAt: number;
};

type WordPressCategory = {
  id: number;
  slug?: string;
  name?: string;
};

type WordPressMedia = {
  source_url?: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url?: string; width?: number; height?: number }>;
  };
};

type WordPressPost = {
  id: number;
  date?: string;
  link?: string;
  title?: {
    rendered?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: WordPressMedia[];
  };
};

type CkanActionResponse<T> = {
  success: boolean;
  result: T;
};

type CkanPackageSearchResult = {
  count: number;
  results: CkanPackage[];
};

type CkanPackage = {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  metadata_modified?: string;
  resources?: CkanResource[];
  extras?: Array<{ key: string; value: string }>;
};

type CkanResource = {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  image_url?: string;
  format?: string;
  datastore_active?: boolean;
};

type CkanDatastoreResponse = {
  records?: Record<string, unknown>[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalState = globalThis as any;
if (!globalState.__infografisCacheStore) {
  globalState.__infografisCacheStore = new Map<string, CacheEntry>();
}
if (!globalState.__infografisImageCache) {
  globalState.__infografisImageCache = new Map<string, boolean>();
}
const cacheStore: Map<string, CacheEntry> = globalState.__infografisCacheStore;
const imageValidationCache: Map<string, boolean> = globalState.__infografisImageCache;

function parseIntWithFallback(value: string | undefined, fallback: number, min = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getCacheTtlMs(): number {
  return parseIntWithFallback(process.env.INFOGRAFIS_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
}

function getMaxHtmlPages(): number {
  return parseIntWithFallback(process.env.INFOGRAFIS_HTML_MAX_PAGES, DEFAULT_MAX_HTML_PAGES);
}

function normalizeText(value: string | undefined | null): string {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateToIso(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function parseIndonesianDateText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.replace(/\s+/g, " ").trim().toLowerCase();
  const match = cleaned.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (!match) {
    return undefined;
  }

  const monthMap: Record<string, string> = {
    januari: "01",
    februari: "02",
    maret: "03",
    april: "04",
    mei: "05",
    juni: "06",
    juli: "07",
    agustus: "08",
    september: "09",
    oktober: "10",
    november: "11",
    desember: "12",
  };

  const day = match[1].padStart(2, "0");
  const month = monthMap[match[2]];
  const year = match[3];

  if (!month) {
    return undefined;
  }

  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function isAllowedImageHost(urlValue: string): boolean {
  try {
    const parsed = new URL(urlValue);
    return parsed.hostname === ALLOWED_IMAGE_HOST && (parsed.protocol === "https:" || parsed.protocol === "http:");
  } catch {
    return false;
  }
}

function buildAbsoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function normalizeImageOriginalCandidate(imageUrl: string): string | null {
  if (!isAllowedImageHost(imageUrl)) {
    return null;
  }

  try {
    const parsed = new URL(imageUrl);
    const withoutSizeSuffix = parsed.pathname.replace(/-(\d+)x(\d+)(\.[a-zA-Z0-9]+)$/i, "$3");
    if (withoutSizeSuffix === parsed.pathname) {
      return null;
    }

    const candidate = new URL(parsed.toString());
    candidate.pathname = withoutSizeSuffix;
    return candidate.toString();
  } catch {
    return null;
  }
}

function shouldRetry(statusCode: number): boolean {
  return RETRYABLE_STATUS_CODES.has(statusCode);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchJsonOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRY_COUNT;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; SatuDataBulunganBot/1.0)",
          ...(init.headers ?? {}),
        },
      });

      if (response.ok) {
        clearTimeout(timer);
        return response;
      }

      if (!shouldRetry(response.status) || attempt === retries) {
        clearTimeout(timer);
        throw new Error(`HTTP ${response.status} untuk ${url}`);
      }

      clearTimeout(timer);
      await delay(DEFAULT_BACKOFF_MS * 2 ** attempt);
      continue;
    } catch (error) {
      clearTimeout(timer);
      const wrappedError = error instanceof Error ? error : new Error("Gagal mengakses sumber data.");
      lastError = wrappedError;

      if (attempt === retries) {
        break;
      }

      await delay(DEFAULT_BACKOFF_MS * 2 ** attempt);
    }
  }

  throw lastError ?? new Error("Gagal mengakses sumber data.");
}

async function fetchJsonWithRetry<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const response = await fetchWithRetry(url, { method: "GET" }, options);
  return (await response.json()) as T;
}

async function fetchTextWithRetry(url: string, options: FetchJsonOptions = {}): Promise<string> {
  const response = await fetchWithRetry(url, { method: "GET" }, options);
  return response.text();
}

async function validateUrlExists(urlValue: string): Promise<boolean> {
  const cached = imageValidationCache.get(urlValue);
  if (typeof cached === "boolean") {
    return cached;
  }

  try {
    const response = await fetchWithRetry(
      urlValue,
      {
        method: "HEAD",
        headers: { Accept: "image/*,*/*;q=0.8" },
      },
      { timeoutMs: 8_000, retries: 1 },
    );

    const valid = response.ok;
    imageValidationCache.set(urlValue, valid);
    return valid;
  } catch {
    imageValidationCache.set(urlValue, false);
    return false;
  }
}

async function resolveOriginalImageUrl(imageUrl: string): Promise<string | undefined> {
  const candidate = normalizeImageOriginalCandidate(imageUrl);
  if (!candidate) {
    return undefined;
  }

  const isValid = await validateUrlExists(candidate);
  return isValid ? candidate : undefined;
}

async function normalizeInfografisItem(
  item: Omit<InfografisItem, "imageOriginalUrl">,
): Promise<InfografisItem | null> {
  const title = normalizeText(item.title);
  if (!title) {
    return null;
  }

  if (!item.imageUrl || !isAllowedImageHost(item.imageUrl)) {
    return null;
  }

  let postUrl = item.postUrl;
  if (!postUrl) {
    return null;
  }

  try {
    postUrl = new URL(postUrl).toString();
  } catch {
    return null;
  }

  const imageOriginalUrl = await resolveOriginalImageUrl(item.imageUrl);

  return {
    ...item,
    title,
    postUrl,
    imageUrl: item.imageUrl,
    imageOriginalUrl,
  };
}

function deduplicateItems(items: InfografisItem[]): InfografisItem[] {
  const byKey = new Map<string, InfografisItem>();

  for (const item of items) {
    const dedupeKey = (item.sourcePostId?.trim().toLowerCase() || item.postUrl.trim().toLowerCase()).trim();
    if (!dedupeKey) {
      continue;
    }

    if (!byKey.has(dedupeKey)) {
      byKey.set(dedupeKey, item);
    }
  }

  return Array.from(byKey.values());
}

export function parseInfografisHtml(html: string, pageUrl: string): {
  items: Array<Omit<InfografisItem, "imageOriginalUrl">>;
  paginationLinks: string[];
} {
  const $ = load(html);

  const items: Array<Omit<InfografisItem, "imageOriginalUrl">> = [];
  $(".rt-grid-item").each((index, element) => {
    const wrapper = $(element);
    const sourcePostId = wrapper.attr("data-id")?.trim();
    const linkNode = wrapper.find("a.tpg-post-link").first();
    const imageNode = wrapper.find("img").first();
    const titleNode = wrapper.find(".entry-title a").first();
    const dateNode = wrapper.find(".post-meta-tags .date a").first();

    const rawPostUrl = linkNode.attr("href");
    const postUrl = buildAbsoluteUrl(rawPostUrl, pageUrl) ?? "";

    const imageCandidates = [
      imageNode.attr("data-src"),
      imageNode.attr("data-lazy-src"),
      imageNode.attr("src"),
    ].filter(
      (value): value is string => typeof value === "string" && value.length > 0 && !value.startsWith("data:image/"),
    );

    const imageUrl = imageCandidates
      .map((value) => buildAbsoluteUrl(value, pageUrl))
      .find((value): value is string => Boolean(value));

    const publishedDateText = normalizeText(dateNode.text()) || undefined;

    items.push({
      id: sourcePostId || `${pageUrl}#${index + 1}`,
      source: "html_scrape",
      sourcePostId,
      title: normalizeText(titleNode.text()) || normalizeText(linkNode.text()) || "Infografis",
      postUrl,
      imageUrl: imageUrl ?? "",
      publishedDate: parseIndonesianDateText(publishedDateText),
      publishedDateText,
      alt: normalizeText(imageNode.attr("alt")) || undefined,
      width: parseIntWithFallback(imageNode.attr("width"), 0, 0) || undefined,
      height: parseIntWithFallback(imageNode.attr("height"), 0, 0) || undefined,
    });
  });

  const paginationLinks = new Set<string>();
  $(".pagination-list a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    const absolute = buildAbsoluteUrl(href, pageUrl);
    if (absolute && absolute.includes("/infografis/page/")) {
      paginationLinks.add(absolute);
    }
  });

  return {
    items,
    paginationLinks: Array.from(paginationLinks),
  };
}

async function fetchFromHtmlScrape(): Promise<FetchResult> {
  const maxPages = getMaxHtmlPages();
  const queue: string[] = [EXTERNAL_INFOGRAFIS_SOURCE];
  const visited = new Set<string>();
  const collected: Array<Omit<InfografisItem, "imageOriginalUrl">> = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const pageUrl = queue.shift();
    if (!pageUrl || visited.has(pageUrl)) {
      continue;
    }

    visited.add(pageUrl);
    const html = await fetchTextWithRetry(pageUrl, { timeoutMs: DEFAULT_TIMEOUT_MS, retries: 0 });
    const parsed = parseInfografisHtml(html, pageUrl);

    collected.push(...parsed.items);

    for (const link of parsed.paginationLinks) {
      if (!visited.has(link) && queue.length + visited.size < maxPages) {
        queue.push(link);
      }
    }
  }

  const normalized = (
    await Promise.all(collected.map((item) => normalizeInfografisItem(item)))
  ).filter((item): item is InfografisItem => Boolean(item));

  return {
    items: deduplicateItems(normalized),
    sourceUsed: "html_scrape",
  };
}

function pickWordPressMedia(post: WordPressPost): {
  imageUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
} {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) {
    return {};
  }

  const sizes = media.media_details?.sizes;
  const preferredOrder = ["large", "medium_large", "medium", "full"];

  for (const key of preferredOrder) {
    const picked = sizes?.[key];
    if (picked?.source_url) {
      return {
        imageUrl: picked.source_url,
        alt: media.alt_text,
        width: picked.width,
        height: picked.height,
      };
    }
  }

  return {
    imageUrl: media.source_url,
    alt: media.alt_text,
    width: media.media_details?.width,
    height: media.media_details?.height,
  };
}

function mapWordPressPostToItem(post: WordPressPost): Omit<InfografisItem, "imageOriginalUrl"> {
  const media = pickWordPressMedia(post);
  const rawTitle = normalizeText(post.title?.rendered);
  const postUrl = post.link?.trim() ?? "";

  return {
    id: String(post.id),
    source: "wordpress_rest",
    sourcePostId: String(post.id),
    title: rawTitle || "Infografis",
    postUrl,
    imageUrl: media.imageUrl ?? "",
    publishedDate: parseDateToIso(post.date),
    publishedDateText: undefined,
    alt: media.alt,
    width: media.width,
    height: media.height,
  };
}

async function fetchWordPressPostsByCategory(
  restBase: string,
  categoryId: number,
): Promise<WordPressPost[]> {
  const endpoint = `${restBase}/posts?categories=${categoryId}&per_page=100&page=1&_embed=1&_fields=id,date,link,title,_embedded`;
  return fetchJsonWithRetry<WordPressPost[]>(endpoint, { retries: 1 });
}

async function fetchWordPressPostsBySearch(restBase: string): Promise<WordPressPost[]> {
  const endpoint = `${restBase}/posts?search=infografis&per_page=100&page=1&_embed=1&_fields=id,date,link,title,_embedded`;
  return fetchJsonWithRetry<WordPressPost[]>(endpoint, { retries: 1 });
}

async function fetchFromWordPressRest(): Promise<FetchResult> {
  let lastError: Error | null = null;

  for (const restBase of WORDPRESS_REST_BASE_CANDIDATES) {
    try {
      const categoriesEndpoint = `${restBase}/categories?search=infografis&per_page=50&_fields=id,slug,name`;
      const categories = await fetchJsonWithRetry<WordPressCategory[]>(categoriesEndpoint, { retries: 0 });

      let posts: WordPressPost[] = [];
      if (categories.length > 0) {
        for (const category of categories) {
          const categoryPosts = await fetchWordPressPostsByCategory(restBase, category.id);
          posts.push(...categoryPosts);
        }
      }

      if (posts.length === 0) {
        posts = await fetchWordPressPostsBySearch(restBase);
      }

      const normalized = (
        await Promise.all(posts.map((post) => normalizeInfografisItem(mapWordPressPostToItem(post))))
      ).filter((item): item is InfografisItem => Boolean(item));

      if (normalized.length > 0) {
        return {
          items: deduplicateItems(normalized),
          sourceUsed: "wordpress_rest",
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Gagal mengambil infografis WordPress REST.");
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    items: [],
    sourceUsed: "wordpress_rest",
  };
}

function parseCkanExtra(pkg: CkanPackage, keys: string[]): string | undefined {
  const extras = pkg.extras ?? [];
  for (const key of keys) {
    const found = extras.find((entry) => entry.key.toLowerCase() === key.toLowerCase());
    if (found?.value) {
      return found.value;
    }
  }

  return undefined;
}

function resourceLooksLikeImage(resourceUrl: string | undefined): boolean {
  if (!resourceUrl) {
    return false;
  }

  const normalized = resourceUrl.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].some((ext) => normalized.includes(ext));
}

async function fetchCkanAction<T>(action: string, query = ""): Promise<T> {
  const ckanBaseUrl = (process.env.CKAN_BASE_URL ?? "").trim();
  if (!ckanBaseUrl) {
    throw new Error("CKAN_BASE_URL belum dikonfigurasi.");
  }

  const endpoint = `${ckanBaseUrl}/api/3/action/${action}${query ? `?${query}` : ""}`;
  const response = await fetchWithRetry(
    endpoint,
    {
      method: "GET",
      headers: {
        Authorization: process.env.CKAN_API_KEY?.trim() || "",
      },
    },
    { retries: 1 },
  );

  const data = (await response.json()) as CkanActionResponse<T>;
  if (!data.success) {
    throw new Error(`CKAN action ${action} gagal.`);
  }

  return data.result;
}

async function extractItemsFromCkanDatastore(resourceId: string): Promise<Array<Omit<InfografisItem, "imageOriginalUrl">>> {
  const result = await fetchCkanAction<CkanDatastoreResponse>(
    "datastore_search",
    `resource_id=${encodeURIComponent(resourceId)}&limit=1000`,
  );

  const records = result.records ?? [];
  const mapped: Array<Omit<InfografisItem, "imageOriginalUrl">> = [];

  for (const record of records) {
    const lowerKeyMap = new Map<string, unknown>(
      Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
    );

    const pick = (keys: string[]) => {
      for (const key of keys) {
        const value = lowerKeyMap.get(key.toLowerCase());
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }

      return undefined;
    };

    const title = pick(["title", "judul", "name"]);
    const postUrl = pick(["posturl", "post_url", "url", "link"]);
    const imageUrl = pick(["imageurl", "image_url", "thumbnail", "thumb"]);

    if (!title || !postUrl || !imageUrl) {
      continue;
    }

    mapped.push({
      id: pick(["id", "sourcepostid", "source_post_id"]) ?? `${postUrl}#datastore`,
      source: "ckan",
      sourcePostId: pick(["sourcepostid", "source_post_id"]),
      title,
      postUrl,
      imageUrl,
      publishedDate: parseDateToIso(pick(["publisheddate", "published_date", "date"])),
      publishedDateText: pick(["publisheddatetext", "published_date_text", "date_text"]),
      alt: pick(["alt", "image_alt"]),
    });
  }

  return mapped;
}

async function fetchFromCkan(): Promise<FetchResult> {
  const packageHint =
    process.env.CKAN_INFOGRAFIS_PACKAGE_ID?.trim() || process.env.CKAN_INFOGRAFIS_PACKAGE_NAME?.trim() || "";

  const packages: CkanPackage[] = [];

  if (packageHint) {
    const pkg = await fetchCkanAction<CkanPackage>("package_show", `id=${encodeURIComponent(packageHint)}`);
    packages.push(pkg);
  } else {
    const search = await fetchCkanAction<CkanPackageSearchResult>("package_search", "q=infografis&rows=50&start=0");
    packages.push(...search.results);
  }

  const rawItems: Array<Omit<InfografisItem, "imageOriginalUrl">> = [];

  for (const pkg of packages) {
    const packageTitle = normalizeText(pkg.title ?? pkg.name ?? "Infografis");
    const packagePostUrl = parseCkanExtra(pkg, ["postUrl", "post_url", "source_url"]) ?? pkg.url ?? "";
    const packageImageUrl = parseCkanExtra(pkg, ["imageUrl", "image_url", "thumbnail"]);

    if (packagePostUrl && packageImageUrl) {
      rawItems.push({
        id: pkg.id,
        source: "ckan",
        sourcePostId: parseCkanExtra(pkg, ["sourcePostId", "source_post_id"]),
        title: packageTitle,
        postUrl: packagePostUrl,
        imageUrl: packageImageUrl,
        publishedDate: parseDateToIso(parseCkanExtra(pkg, ["publishedDate", "published_date"])),
        publishedDateText: parseCkanExtra(pkg, ["publishedDateText", "published_date_text"]),
        alt: parseCkanExtra(pkg, ["alt"]),
      });
    }

    for (const resource of pkg.resources ?? []) {
      const resourcePostUrl =
        packagePostUrl || parseCkanExtra(pkg, ["postUrl", "post_url"]) || resource.url || "";
      const resourceImageUrl = resource.image_url || (resourceLooksLikeImage(resource.url) ? resource.url : undefined);

      if (resourcePostUrl && resourceImageUrl) {
        rawItems.push({
          id: resource.id ?? `${pkg.id}-${resource.title ?? resource.name ?? "resource"}`,
          source: "ckan",
          sourcePostId:
            parseCkanExtra(pkg, ["sourcePostId", "source_post_id"]) ?? resource.id ?? undefined,
          title: normalizeText(resource.title ?? resource.name ?? packageTitle),
          postUrl: resourcePostUrl,
          imageUrl: resourceImageUrl,
          publishedDate: parseDateToIso(pkg.metadata_modified),
          publishedDateText: undefined,
          alt: normalizeText(resource.title ?? resource.name),
        });
      }

      if (resource.datastore_active && resource.id) {
        try {
          const datastoreItems = await extractItemsFromCkanDatastore(resource.id);
          rawItems.push(...datastoreItems);
        } catch {
          // Ignore datastore parsing errors and continue with remaining resources.
        }
      }
    }
  }

  const normalized = (
    await Promise.all(rawItems.map((item) => normalizeInfografisItem(item)))
  ).filter((item): item is InfografisItem => Boolean(item));

  return {
    items: deduplicateItems(normalized),
    sourceUsed: "ckan",
  };
}


type StaticInfografisRecord = {
  title: string;
  postUrl: string;
  imageUrl: string;
  date?: string;
};

function fetchFromStaticJson(): FetchResult {
  try {
    // infografis.json berada di root /app (standalone output menyalin public + source tidak di-bundle)
    // Kita coba beberapa kandidat path
    const candidates = [
      join(/* turbopackIgnore: true */ process.cwd(), "infografis.json"),
      join(/* turbopackIgnore: true */ process.cwd(), "public", "infografis.json"),
    ];

    let raw: string | null = null;
    for (const candidate of candidates) {
      try {
        raw = readFileSync(candidate, "utf8");
        break;
      } catch {
        // Try next candidate
      }
    }

    if (!raw) {
      return { items: [], sourceUsed: "static_json" };
    }

    const records = JSON.parse(raw) as StaticInfografisRecord[];
    const items: InfografisItem[] = records
      .filter((rec) => rec.title && rec.postUrl && rec.imageUrl && isAllowedImageHost(rec.imageUrl))
      .map((rec, index) => ({
        id: `static-${index}`,
        source: "static_json" as const,
        sourcePostId: undefined,
        title: normalizeText(rec.title),
        postUrl: rec.postUrl,
        imageUrl: rec.imageUrl,
        imageOriginalUrl: undefined,
        publishedDate: rec.date ? (parseIndonesianDateText(rec.date) ?? parseDateToIso(rec.date)) : undefined,
        publishedDateText: rec.date,
        alt: undefined,
        width: undefined,
        height: undefined,
      }))
      .filter((item) => Boolean(item.title));

    return {
      items: deduplicateItems(items),
      sourceUsed: "static_json",
    };
  } catch {
    return { items: [], sourceUsed: "static_json" };
  }
}

async function fetchLiveSources(): Promise<FetchResult> {
  try {
    const htmlResult = await fetchFromHtmlScrape();
    if (htmlResult.items.length > 0) {
      return htmlResult;
    }
  } catch {
    // Continue to REST fallback when HTML path fails.
  }

  try {
    const restResult = await fetchFromWordPressRest();
    if (restResult.items.length > 0) {
      return restResult;
    }
  } catch {
    // Continue to static JSON fallback when REST path fails.
  }

  // Fallback terakhir: baca dari file JSON statis yang di-bundle bersama image Docker.
  return fetchFromStaticJson();
}

async function fetchBySourcePreference(source: InfografisSourceQuery): Promise<FetchResult> {
  if (source === "ckan") {
    return fetchFromCkan();
  }

  if (source === "live") {
    return fetchLiveSources();
  }

  // source === "auto": coba CKAN → live scrape → static JSON
  try {
    const ckanResult = await fetchFromCkan();
    if (ckanResult.items.length > 0) {
      return ckanResult;
    }
  } catch {
    // Continue to live sources when CKAN is not reachable or has no data.
  }

  const liveResult = await fetchLiveSources();
  if (liveResult.items.length > 0) {
    return liveResult;
  }

  // Fallback terakhir: static JSON
  return fetchFromStaticJson();
}

function getCacheKey(source: InfografisSourceQuery): string {
  return `infografis:${source}`;
}

async function getItemsWithCache(source: InfografisSourceQuery): Promise<FetchResult> {
  const cacheKey = getCacheKey(source);
  const existing = cacheStore.get(cacheKey);
  const now = Date.now();
  const cacheTtlMs = getCacheTtlMs();

  if (existing && now - existing.cachedAt < cacheTtlMs) {
    return {
      items: existing.items,
      sourceUsed: existing.sourceUsed,
    };
  }

  try {
    const freshResult = await fetchBySourcePreference(source);
    cacheStore.set(cacheKey, {
      items: freshResult.items,
      sourceUsed: freshResult.sourceUsed,
      cachedAt: now,
    });

    return freshResult;
  } catch (error) {
    if (existing) {
      return {
        items: existing.items,
        sourceUsed: existing.sourceUsed,
      };
    }

    throw error;
  }
}

export function buildInfografisApiPayload(
  items: InfografisItem[],
  sourceUsed: InfografisSourceType,
  page: number,
  limit: number,
): InfografisApiResponse {
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      hasNextPage: start + limit < total,
      sourceUsed,
      externalSource: EXTERNAL_INFOGRAFIS_SOURCE,
    },
  };
}

export function normalizeInfografisSourceQuery(value: string | null): InfografisSourceQuery {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "ckan") {
    return "ckan";
  }

  if (normalized === "live") {
    return "live";
  }

  return "auto";
}

export async function getInfografisApiPayload(params: ServiceRequestParams): Promise<InfografisApiResponse> {
  const safePage = params.page > 0 ? params.page : 1;
  const safeLimit = params.limit > 0 ? params.limit : 12;

  const result = await getItemsWithCache(params.source);
  return buildInfografisApiPayload(result.items, result.sourceUsed, safePage, safeLimit);
}

export const INFOGRAFIS_EXTERNAL_SOURCE = EXTERNAL_INFOGRAFIS_SOURCE;
