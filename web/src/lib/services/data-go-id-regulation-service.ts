import { URL } from "node:url";

const DATA_GO_ID_REGULATION_BASE_URL = "https://data.go.id/regulation";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_BACKOFF_MS = 500;
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_ITEMS = 24;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface DataGoIdRegulationRecord {
  id: number;
  judul: string;
  tanggalPublish: string;
  deskripsi: string;
  label?: string | null;
  subjek?: string | null;
  status?: boolean;
}

interface DataGoIdRegulationResponse {
  page: number;
  size: number;
  totalPages: number;
  totalRecords: number;
  records: DataGoIdRegulationRecord[];
}

export interface NationalRegulationItem {
  id: string;
  title: string;
  summary: string;
  organization: string;
  publishedDate: string;
  detailUrl: string;
}

type CacheEntry = {
  items: NationalRegulationItem[];
  cachedAt: number;
};

const cacheStore = new Map<string, CacheEntry>();

const LOCAL_SCOPE_PATTERNS: RegExp[] = [
  /\b(peraturan|keputusan)\s+(gubernur|bupati|wali\s*kota|walikota)\b/i,
  /\bprovinsi\b/i,
  /\bkabupaten\b/i,
  /\bkota\b/i,
  /\btingkat\s+daerah\b/i,
  /\bsatu\s+data\s+daerah\b/i,
];

const INTERNAL_INSTITUTION_PATTERNS: RegExp[] = [
  /\b(di|pada|lingkup)\s+(kementerian|kementrian|lembaga|badan|sekretariat|dpr|kejaksaan|perpustakaan)\b/i,
  /\b(kementerian|kementrian|lembaga|badan|sekretariat|dpr|kejaksaan|perpustakaan)\s+(yang|di|pada|lingkup)\b/i,
  /\bprodusen\s+data\s+bidang\b/i,
  /\bsatu\s+data\s+bidang\b/i,
  /\bsatu\s+data\s+(kementerian|kementrian|lembaga|badan|dpr)\b/i,
  /\bnational\s+data\s+repository\b/i,
];

const NATIONAL_ALLOWED_PATTERNS: RegExp[] = [
  /^undang-undang\b/i,
  /^peraturan\s+pemerintah\b/i,
  /^peraturan\s+presiden\b/i,
  /^keputusan\s+presiden\b/i,
  /^instruksi\s+presiden\b/i,
  /^peraturan\s+menteri\s+ppn\/kepala\s+bappenas\b/i,
  /^keputusan\s+menteri\s+ppn\/kepala\s+bappenas\b/i,
  /^keputusan\s+menteri\s+ppn\s+kepala\s+bappenas\b/i,
];

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
  return parseIntWithFallback(process.env.DATA_GO_ID_REGULATION_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
}

function getPageSize(): number {
  return parseIntWithFallback(process.env.DATA_GO_ID_REGULATION_PAGE_SIZE, DEFAULT_PAGE_SIZE);
}

function getMaxItems(limit: number | undefined): number {
  if (typeof limit === "number") {
    return Math.max(1, Math.floor(limit));
  }

  return parseIntWithFallback(process.env.DATA_GO_ID_REGULATION_MAX_ITEMS, DEFAULT_MAX_ITEMS);
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

function buildRegulationPageUrl(page: number, size: number): string {
  const url = new URL(DATA_GO_ID_REGULATION_BASE_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  return url.toString();
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
      lastError =
        error instanceof Error ? error : new Error("Gagal mengambil halaman regulasi data.go.id.");

      if (attempt === DEFAULT_RETRY_COUNT) {
        break;
      }
    }

    await delay(DEFAULT_BACKOFF_MS * 2 ** attempt);
  }

  throw lastError ?? new Error("Gagal mengambil halaman regulasi data.go.id.");
}

function parseEmbeddedResponse(html: string): DataGoIdRegulationResponse {
  const match = html.match(/\\"response\\":(\{[\s\S]*?\}),\\"listData\\":/);
  if (!match) {
    throw new Error("Struktur response regulasi data.go.id tidak dikenali.");
  }

  const normalizedJson = match[1].replace(/\\"/g, '"');
  const parsed = JSON.parse(normalizedJson) as Partial<DataGoIdRegulationResponse>;

  if (!Array.isArray(parsed.records) || typeof parsed.totalPages !== "number") {
    throw new Error("Payload regulasi data.go.id tidak valid.");
  }

  return {
    page: typeof parsed.page === "number" ? parsed.page : 1,
    size: typeof parsed.size === "number" ? parsed.size : parsed.records.length,
    totalPages: parsed.totalPages,
    totalRecords: typeof parsed.totalRecords === "number" ? parsed.totalRecords : parsed.records.length,
    records: parsed.records,
  } satisfies DataGoIdRegulationResponse;
}

function buildDetailUrl(record: DataGoIdRegulationRecord): string {
  const slug = record.judul
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${DATA_GO_ID_REGULATION_BASE_URL}/${slug}/${record.id}`;
}

function isNationalScaleRegulation(record: DataGoIdRegulationRecord): boolean {
  const title = normalizeText(record.judul);
  const summary = normalizeText(record.deskripsi);
  const subject = normalizeText(record.subjek);
  const searchableText = `${title} ${summary} ${subject}`.toLowerCase();

  if (!NATIONAL_ALLOWED_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }

  if (LOCAL_SCOPE_PATTERNS.some((pattern) => pattern.test(searchableText))) {
    return false;
  }

  if (INTERNAL_INSTITUTION_PATTERNS.some((pattern) => pattern.test(searchableText))) {
    if (/forum\s+satu\s+data\s+indonesia/i.test(searchableText)) {
      return true;
    }

    return false;
  }

  return true;
}

function toNationalRegulationItem(record: DataGoIdRegulationRecord): NationalRegulationItem {
  const publishedDate = /^\d{4}-\d{2}-\d{2}$/.test(record.tanggalPublish)
    ? record.tanggalPublish
    : "1970-01-01";

  return {
    id: String(record.id),
    title: normalizeText(record.judul),
    summary: normalizeText(record.deskripsi),
    organization: "Portal Satu Data Indonesia",
    publishedDate,
    detailUrl: buildDetailUrl(record),
  };
}

async function fetchAllRegulationRecords(): Promise<DataGoIdRegulationRecord[]> {
  const size = getPageSize();
  const firstHtml = await fetchTextWithRetry(buildRegulationPageUrl(1, size));
  const firstPage = parseEmbeddedResponse(firstHtml);

  const allRecords = [...firstPage.records];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageHtml = await fetchTextWithRetry(buildRegulationPageUrl(page, size));
    const parsedPage = parseEmbeddedResponse(pageHtml);
    allRecords.push(...parsedPage.records);
  }

  return allRecords;
}

export async function getDataGoIdNationalRegulations(limit?: number): Promise<NationalRegulationItem[]> {
  const maxItems = getMaxItems(limit);
  const cacheKey = `data-go-id:national-regulation:${maxItems}`;
  const cached = cacheStore.get(cacheKey);
  const ttl = getCacheTtlMs();

  if (cached && Date.now() - cached.cachedAt <= ttl) {
    return cached.items;
  }

  const records = await fetchAllRegulationRecords();
  const items = records
    .filter((record) => isNationalScaleRegulation(record))
    .map((record) => toNationalRegulationItem(record))
    .sort((left, right) => right.publishedDate.localeCompare(left.publishedDate))
    .slice(0, maxItems);

  cacheStore.set(cacheKey, {
    items,
    cachedAt: Date.now(),
  });

  return items;
}
