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

const defaultFrequency: DatasetFrequency = "Tahunan";
const defaultStatus: DatasetStatus = "Published";

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

function mapPackageToDataset(pkg: CkanPackage): Dataset {
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
    preview: {
      points: [
        { label: "Jan", value: 10 },
        { label: "Feb", value: 15 },
        { label: "Mar", value: 21 },
        { label: "Apr", value: 18 },
      ],
      rows: [
        { area: "Sample", male: 1200, female: 1244, total: 2444 },
        { area: "Sample 2", male: 1040, female: 998, total: 2038 },
      ],
      insights: [
        { label: "Sumber", value: "CKAN", description: "Data diambil dari API CKAN." },
        {
          label: "Resource",
          value: `${resources.length}`,
          description: "Jumlah resource yang tersedia pada paket ini.",
        },
      ],
    },
    relatedSlugs: [],
    popularityScore: 75,
    viewCount: 0,
    downloadCount: 0,
  };
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
    const endpoint = `${this.ckanBaseUrl}/api/3/action/${action}${query ? `?${query}` : ""}`;
    const response = await fetch(endpoint, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });

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
    const mapped = result.results.map(mapPackageToDataset);
    const filtered = filterCkanDatasets(mapped, filters);
    return sortDatasets(filtered, filters.sort ?? "terbaru");
  }

  async getDatasetBySlug(slug: string): Promise<Dataset | null> {
    const result = await this.fetchAction<CkanPackage>("package_show", `id=${encodeURIComponent(slug)}`);
    if (!result) {
      return null;
    }

    return mapPackageToDataset(result);
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
