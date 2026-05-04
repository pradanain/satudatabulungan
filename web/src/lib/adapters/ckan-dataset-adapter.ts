import type {
  Dataset,
  DatasetFilterOptions,
  DatasetFilters,
  DatasetFormat,
  DatasetFrequency,
  DatasetStatus,
  PortalStats,
} from "@/lib/types/dataset";
import { matchesHomepageTopicFilter } from "@/lib/data/homepage-topics";
import {
  fetchWithTimeout,
  isUpstreamNetworkError,
  summarizeUpstreamError,
} from "@/lib/utils/upstream-error";
import type { DatasetAdapter } from "./dataset-adapter";

interface CkanOrganization {
  title?: string;
  name?: string;
}

interface CkanGroup {
  title?: string;
  name?: string;
}

interface CkanTag {
  display_name?: string;
  name?: string;
}

interface CkanExtra {
  key: string;
  value: string;
}

interface CkanResource {
  id?: string;
  name?: string;
  description?: string;
  format?: string;
  url?: string;
  size?: string | number;
  last_modified?: string;
}

interface CkanPackage {
  id: string;
  name: string;
  title?: string;
  notes?: string;
  metadata_modified?: string;
  organization?: CkanOrganization;
  groups?: CkanGroup[];
  tags?: CkanTag[];
  extras?: CkanExtra[];
  resources?: CkanResource[];
  license_title?: string;
}

interface CkanActionResponse<T> {
  success: boolean;
  result: T;
}

interface CkanSearchResult {
  count: number;
  results: CkanPackage[];
}

type RawRecord = Record<string, string | number>;

const defaultFrequency: DatasetFrequency = "Tahunan";
const defaultStatus: DatasetStatus = "Published";
const DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS = 30_000;

let ckanUnavailableUntil = 0;

function getCkanUnavailableCooldownMs(): number {
  const parsed = Number(
    process.env.CKAN_UNAVAILABLE_COOLDOWN_MS ?? DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS,
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS;
  }

  return Math.floor(parsed);
}

function isInUnavailableWindow(): boolean {
  return Date.now() < ckanUnavailableUntil;
}

function markCkanUnavailable(): void {
  ckanUnavailableUntil = Date.now() + getCkanUnavailableCooldownMs();
}

function clearCkanUnavailable(): void {
  ckanUnavailableUntil = 0;
}

function normalizeFormat(value?: string): DatasetFormat {
  const normalized = (value ?? "").trim().toUpperCase();

  if (normalized.includes("CSV")) return "CSV";
  if (normalized.includes("XLS")) return "XLSX";
  if (normalized.includes("JSON")) return "JSON";
  if (normalized.includes("PDF")) return "PDF";
  if (normalized.includes("API")) return "API";

  return "CSV";
}

function normalizeFrequency(value?: string): DatasetFrequency {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized.includes("hari")) return "Harian";
  if (normalized.includes("bulan")) return "Bulanan";
  if (normalized.includes("triwulan")) return "Triwulanan";
  if (normalized.includes("semester")) return "Semesteran";
  return "Tahunan";
}

function normalizeStatus(value?: string): DatasetStatus {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "draft") return "Draft";
  if (normalized.includes("submit")) return "Submitted";
  if (normalized.includes("revision") || normalized.includes("revisi")) return "Need Revision";
  if (normalized.includes("approve") || normalized.includes("disetujui")) return "Approved";
  if (normalized.includes("archive")) return "Archived";
  return "Published";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function parseSize(value?: string | number): string {
  if (typeof value === "number") {
    return formatBytes(value);
  }

  if (!value) return "N/A";
  return value;
}

function getExtra(extras: CkanExtra[] | undefined, keys: string[]): string | undefined {
  if (!extras) return undefined;

  for (const key of keys) {
    const found = extras.find((item) => item.key.toLowerCase() === key.toLowerCase());
    if (found && found.value) {
      return found.value;
    }
  }

  return undefined;
}

function parseNumericValue(value: string | number | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = (value ?? "").toString().trim();
  if (!normalized) {
    return null;
  }

  const indonesiaThousands = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/;
  if (indonesiaThousands.test(normalized)) {
    const parsed = Number(normalized.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const decimalComma = /^-?\d+(,\d+)?$/;
  if (decimalComma.test(normalized)) {
    const parsed = Number(normalized.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeColumnLabel(key: string): string {
  const normalizedKey = key.trim().toLowerCase();
  const labelMap: Record<string, string> = {
    mantap: "Bagus",
    mantap_km: "Bagus (km)",
    rusak_ringan: "Rusak Ringan",
    rusak_ringan_km: "Rusak Ringan (km)",
    rusak_berat: "Rusak Berat",
    rusak_berat_km: "Rusak Berat (km)",
    total_km: "Total (km)",
  };

  if (labelMap[normalizedKey]) {
    return labelMap[normalizedKey];
  }

  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const output: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      output.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  output.push(current.trim());
  return output;
}

function parseCsvRecords(text: string): RawRecord[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0];
  const delimiter =
    (headerLine.match(/;/g)?.length ?? 0) > (headerLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = parseCsvLine(headerLine, delimiter);

  const rows: RawRecord[] = [];
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line, delimiter);
    const row: RawRecord = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function parseJsonRecords(text: string): RawRecord[] {
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? (parsed as { data?: unknown; records?: unknown; items?: unknown }).data ??
        (parsed as { records?: unknown }).records ??
        (parsed as { items?: unknown }).items
      : [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const row: RawRecord = {};
      for (const [key, value] of Object.entries(item)) {
        row[key] =
          typeof value === "number" || typeof value === "string"
            ? value
            : value === null || value === undefined
              ? ""
              : JSON.stringify(value);
      }
      return row;
    });
}

function buildPreviewFromRecords(records: RawRecord[], topic: string): Dataset["preview"] | null {
  if (!records.length) {
    return null;
  }

  const firstRow = records[0];
  const keys = Object.keys(firstRow);
  if (!keys.length) {
    return null;
  }

  const areaKey =
    keys.find((key) => /^(kecamatan|wilayah|area|district|nama_kecamatan)$/i.test(key)) ??
    keys.find((key) => /(kecamatan|wilayah|area|district)/i.test(key)) ??
    keys.find((key) =>
      records.some((record) => {
        const value = `${record[key] ?? ""}`.toLowerCase();
        return value.includes("tanjung") || value.includes("sekatak") || value.includes("bunyu");
      }),
    ) ??
    keys[0];

  const numericKeys = keys.filter((key) => {
    const validCount = records.reduce((count, record) => {
      const parsed = parseNumericValue(record[key] as string | number | undefined);
      return parsed !== null ? count + 1 : count;
    }, 0);
    return validCount >= Math.ceil(records.length * 0.6);
  });

  if (!numericKeys.length) {
    return null;
  }

  const totalKey =
    numericKeys.find((key) => /^total$/i.test(key)) ??
    numericKeys.find((key) => /(total|jumlah|nilai)/i.test(key));

  const rows: Dataset["preview"]["rows"] = [];
  for (const record of records) {
    const area = `${record[areaKey] ?? ""}`.trim();
    if (!area) {
      continue;
    }

    const numericValues: Record<string, number> = {};
    for (const key of numericKeys) {
      const parsed = parseNumericValue(record[key] as string | number | undefined);
      if (parsed !== null) {
        numericValues[key] = parsed;
      }
    }

    const total =
      totalKey && numericValues[totalKey] !== undefined
        ? numericValues[totalKey]
        : Object.values(numericValues).reduce((sum, value) => sum + value, 0);

    rows.push({
      area,
      total,
      values: numericValues,
    });
  }

  if (!rows.length) {
    return null;
  }

  const points = rows.slice(0, 24).map((row) => ({ label: row.area, value: row.total }));
  const columns: Dataset["preview"]["columns"] = [
    { key: "area", label: normalizeColumnLabel(areaKey), isNumeric: false },
    ...numericKeys.map((key) => ({ key, label: normalizeColumnLabel(key), isNumeric: true })),
  ];

  if (!columns.some((column) => column.key === "total")) {
    columns.push({ key: "total", label: "Total", isNumeric: true });
  }

  const districtCoverage = rows.filter((row) =>
    [
      "Tanjung Selor",
      "Tanjung Palas",
      "Tanjung Palas Barat",
      "Tanjung Palas Utara",
      "Tanjung Palas Timur",
      "Tanjung Palas Tengah",
      "Sekatak",
      "Peso",
      "Peso Hilir",
      "Bunyu",
    ].includes(row.area),
  ).length;

  const chartUnit = numericKeys.some((key) => /km/i.test(key))
    ? "Skala km"
    : numericKeys.some((key) => /(persen|pct|rasio|ratio)/i.test(key))
      ? "Skala %"
      : numericKeys.some((key) => /(penduduk|jiwa|populasi)/i.test(key))
        ? "Skala jiwa"
        : "Skala nilai";

  return {
    points,
    rows,
    columns,
    chartTitle: `Grafik ${topic}`,
    chartUnit,
    insights: [
      { label: "Sumber", value: "CKAN", description: "Visualisasi diambil dari resource data asli." },
      {
        label: "Baris Data",
        value: `${rows.length}`,
        description: "Jumlah baris data yang dipakai untuk visualisasi.",
      },
      {
        label: "Cakupan Kecamatan",
        value: `${districtCoverage}/10`,
        description: "Jumlah kecamatan Bulungan yang terdeteksi dari data resource.",
      },
    ],
  };
}

async function loadPreviewFromResources(
  ckanBaseUrl: string,
  resources: Array<{ format: DatasetFormat; url: string }>,
  topic: string,
): Promise<Dataset["preview"] | null> {
  const candidates = resources.filter((resource) => resource.url && (resource.format === "CSV" || resource.format === "JSON"));

  for (const resource of candidates) {
    const absoluteUrl = resource.url.startsWith("http")
      ? resource.url
      : `${ckanBaseUrl.replace(/\/+$/, "")}/${resource.url.replace(/^\/+/, "")}`;

    try {
      const response = await fetch(absoluteUrl, {
        headers: { Accept: "*/*" },
        next: { revalidate: 120 },
      });
      if (!response.ok) {
        continue;
      }

      const raw = await response.text();
      const records =
        resource.format === "JSON"
          ? parseJsonRecords(raw)
          : parseCsvRecords(raw);

      const preview = buildPreviewFromRecords(records, topic);
      if (preview) {
        return preview;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

async function mapPackageToDataset(
  pkg: CkanPackage,
  options?: { ckanBaseUrl?: string; buildPreviewFromResource?: boolean },
): Promise<Dataset> {
  const extras = pkg.extras ?? [];
  const frequency = normalizeFrequency(
    getExtra(extras, ["frekuensi_pembaruan", "frequency", "update_frequency"]),
  );
  const period = getExtra(extras, ["periode", "period", "coverage_period"]) ?? "Tidak disebutkan";
  const status = normalizeStatus(getExtra(extras, ["status", "dataset_status"])) ?? defaultStatus;
  const coverage = getExtra(extras, ["cakupan_wilayah", "spatial", "coverage"]) ?? "Kabupaten Bulungan";
  const walidata = getExtra(extras, ["walidata", "data_steward"]) ?? "DKIP / Bappedalitbang";

  const topic =
    pkg.groups?.[0]?.title ??
    pkg.groups?.[0]?.name ??
    getExtra(extras, ["topik", "topic"]) ??
    "Umum";

  const organization = pkg.organization?.title ?? pkg.organization?.name ?? "OPD Tidak Diketahui";
  const tags = (pkg.tags ?? []).map((tag) => tag.display_name ?? tag.name ?? "").filter(Boolean);

  const resources = (pkg.resources ?? []).map((resource, index) => {
    const format = normalizeFormat(resource.format);

    return {
      id: resource.id ?? `${pkg.id}-res-${index + 1}`,
      name: resource.name ?? `resource-${index + 1}`,
      description: resource.description ?? "Resource dataset",
      format,
      url: resource.url ?? "",
      sizeLabel: parseSize(resource.size),
      lastUpdated: resource.last_modified,
    };
  });

  const formats = [...new Set(resources.map((resource) => resource.format))] as DatasetFormat[];
  const lastUpdated = pkg.metadata_modified ?? new Date().toISOString();

  const fallbackPreview: Dataset["preview"] = {
    points: [],
    rows: [],
    columns: [
      { key: "area", label: "Wilayah", isNumeric: false },
      { key: "total", label: "Total", isNumeric: true },
    ],
    chartTitle: `Grafik ${topic}`,
    chartUnit: "Skala nilai",
    insights: [
      { label: "Sumber", value: "CKAN", description: "Data diambil dari API CKAN." },
      {
        label: "Resource",
        value: `${resources.length}`,
        description: "Jumlah resource yang tersedia pada paket ini.",
      },
    ],
  };

  const preview =
    options?.buildPreviewFromResource && options?.ckanBaseUrl
      ? (await loadPreviewFromResources(options.ckanBaseUrl, resources, topic)) ?? fallbackPreview
      : fallbackPreview;

  return {
    id: pkg.id,
    slug: pkg.name,
    title: pkg.title ?? pkg.name,
    summary: pkg.notes?.slice(0, 140) ?? "Dataset CKAN tanpa deskripsi ringkas.",
    description: pkg.notes ?? "Tidak ada deskripsi panjang.",
    topic,
    organization,
    formats: formats.length ? formats : ["CSV"],
    frequency: frequency ?? defaultFrequency,
    status: status ?? defaultStatus,
    lastUpdated,
    resources,
    metadata: {
      identifier: pkg.id,
      opd: organization,
      walidata,
      coverage,
      period,
      license: pkg.license_title ?? "Belum ditentukan",
      status: status ?? defaultStatus,
      frequency: frequency ?? defaultFrequency,
      lastUpdated,
      tags,
    },
    preview,
    relatedSlugs: [],
    popularityScore: 75,
    viewCount: 0,
    downloadCount: 0,
  };
}

function isMainDatasetPackage(pkg: CkanPackage): boolean {
  const extras = pkg.extras ?? [];
  const contentType = (getExtra(extras, ["content_type", "tipe_konten"]) ?? "dataset")
    .trim()
    .toLowerCase();

  if (contentType.includes("infografis")) return false;
  if (contentType.includes("publikasi")) return false;
  if (contentType.includes("akun") || contentType.includes("account")) return false;
  return true;
}

function filterCkanDatasets(datasets: Dataset[], filters: DatasetFilters = {}): Dataset[] {
  const q = (filters.q ?? "").trim().toLowerCase();

  return datasets.filter((dataset) => {
    const searchArea =
      `${dataset.title} ${dataset.summary} ${dataset.organization} ${dataset.topic} ${dataset.metadata.tags.join(" ")}`.toLowerCase();
    const searchPass = q.length === 0 || searchArea.includes(q);
    const topicPass = !filters.topic || matchesHomepageTopicFilter(dataset, filters.topic);
    const organizationPass = !filters.organization || dataset.organization === filters.organization;
    const formatPass = !filters.format || dataset.formats.includes(filters.format as DatasetFormat);
    const frequencyPass = !filters.frequency || dataset.frequency === filters.frequency;
    const statusPass = !filters.status || dataset.status === filters.status;
    const yearPass =
      !filters.year ||
      dataset.lastUpdated.startsWith(filters.year) ||
      dataset.metadata.period.includes(filters.year);
    const tagPass =
      !filters.tag ||
      dataset.metadata.tags.some((tag) => tag.toLowerCase() === filters.tag?.toLowerCase());

    return (
      searchPass &&
      topicPass &&
      organizationPass &&
      formatPass &&
      frequencyPass &&
      statusPass &&
      yearPass &&
      tagPass
    );
  });
}

function sortDatasets(datasets: Dataset[], sort = "terbaru"): Dataset[] {
  if (sort === "az") {
    return [...datasets].sort((a, b) => a.title.localeCompare(b.title, "id-ID"));
  }

  if (sort === "populer") {
    return [...datasets].sort((a, b) => b.popularityScore - a.popularityScore);
  }

  return [...datasets].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
}

export class CkanDatasetAdapter implements DatasetAdapter {
  constructor(private readonly ckanBaseUrl: string) {}

  private async fetchAction<T>(action: string, query = ""): Promise<T> {
    if (isInUnavailableWindow()) {
      throw new Error("CKAN upstream sementara tidak tersedia.");
    }

    const endpoint = `${this.ckanBaseUrl}/api/3/action/${action}${query ? `?${query}` : ""}`;
    let response: Response;
    try {
      response = await fetchWithTimeout(endpoint, {
        next: { revalidate: 120 },
        headers: { Accept: "application/json" },
      });
      clearCkanUnavailable();
    } catch (error) {
      if (isUpstreamNetworkError(error)) {
        markCkanUnavailable();
      }

      const reason = summarizeUpstreamError(error);
      throw new Error(`CKAN request gagal: ${reason}`);
    }

    if (!response.ok) {
      throw new Error(`CKAN request gagal: ${response.status}`);
    }

    const data = (await response.json()) as CkanActionResponse<T>;
    if (!data.success) {
      throw new Error("CKAN mengembalikan status gagal.");
    }

    return data.result;
  }

  async listDatasets(filters: DatasetFilters = {}): Promise<Dataset[]> {
    const result = await this.fetchAction<CkanSearchResult>("package_search", "rows=100&start=0");
    const mapped = await Promise.all(
      result.results
        .filter((pkg) => isMainDatasetPackage(pkg))
        .map((pkg) => mapPackageToDataset(pkg)),
    );
    const filtered = filterCkanDatasets(mapped, filters);
    return sortDatasets(filtered, filters.sort ?? "terbaru");
  }

  async getDatasetBySlug(slug: string): Promise<Dataset | null> {
    const result = await this.fetchAction<CkanPackage>("package_show", `id=${encodeURIComponent(slug)}`);
    if (!result) {
      return null;
    }
    if (!isMainDatasetPackage(result)) {
      return null;
    }

    return mapPackageToDataset(result, {
      ckanBaseUrl: this.ckanBaseUrl,
      buildPreviewFromResource: true,
    });
  }

  async getFilterOptions(): Promise<DatasetFilterOptions> {
    const datasets = await this.listDatasets();
    const years = [
      ...new Set(
        datasets.flatMap((item) => {
          const fromUpdated = item.lastUpdated.slice(0, 4);
          const fromPeriod = item.metadata.period.match(/\d{4}/g) ?? [];
          return [fromUpdated, ...fromPeriod];
        }),
      ),
    ]
      .filter((value) => value && /^\d{4}$/.test(value))
      .sort((a, b) => Number(b) - Number(a));

    return {
      topics: [...new Set(datasets.map((dataset) => dataset.topic))].sort((a, b) =>
        a.localeCompare(b, "id-ID"),
      ),
      organizations: [...new Set(datasets.map((dataset) => dataset.organization))].sort((a, b) =>
        a.localeCompare(b, "id-ID"),
      ),
      formats: [...new Set(datasets.flatMap((dataset) => dataset.formats))].sort((a, b) =>
        a.localeCompare(b, "id-ID"),
      ),
      frequencies: [...new Set(datasets.map((dataset) => dataset.frequency))],
      statuses: [...new Set(datasets.map((dataset) => dataset.status))],
      years,
      tags: [...new Set(datasets.flatMap((dataset) => dataset.metadata.tags))].sort((a, b) =>
        a.localeCompare(b, "id-ID"),
      ),
    };
  }

  async getPortalStats(): Promise<PortalStats> {
    const datasets = await this.listDatasets();
    const resources = datasets.reduce((acc, item) => acc + item.resources.length, 0);
    const completeMeta = datasets.filter((item) => item.metadata.tags.length > 0).length;
    const completion = datasets.length ? Math.round((completeMeta / datasets.length) * 100) : 0;

    return {
      datasetCount: datasets.length,
      organizationCount: new Set(datasets.map((item) => item.organization)).size,
      resourceCount: resources,
      metadataCompletionRate: completion,
    };
  }
}
