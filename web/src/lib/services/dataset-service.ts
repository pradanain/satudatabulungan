import { CkanDatasetAdapter } from "@/lib/adapters/ckan-dataset-adapter";
import type { DatasetAdapter } from "@/lib/adapters/dataset-adapter";
import { MockDatasetAdapter } from "@/lib/adapters/mock-dataset-adapter";
import { getRuntimeConfig } from "@/lib/config";
import {
  getDatasetOrganizationOptions,
  getDatasetTopicOptions,
  getDatasetYearOptions,
} from "@/lib/services/dataset-filter-config";
import type {
  Dataset,
  DatasetFilterOptions,
  DatasetFilters,
  DatasetSort,
  PortalStats,
} from "@/lib/types/dataset";
import { normalizeOrganizationName } from "@/lib/utils/organization";

const config = getRuntimeConfig();

/**
 * Mengembalikan adapter dataset sesuai mode.
 * Mode "ckan" → CkanDatasetAdapter (langsung ke CKAN, tanpa fallback mock).
 * Mode "mock" → MockDatasetAdapter (untuk development lokal saja).
 */
function getAdapter(): DatasetAdapter {
  if (config.dataSourceMode === "ckan") {
    return new CkanDatasetAdapter(config.ckanBaseUrl);
  }

  return new MockDatasetAdapter();
}

function normalizeDatasetOrganization(dataset: Dataset): Dataset {
  const normalizedOrganization = normalizeOrganizationName(dataset.organization);

  if (
    normalizedOrganization === dataset.organization &&
    normalizedOrganization === dataset.metadata.opd
  ) {
    return dataset;
  }

  return {
    ...dataset,
    organization: normalizedOrganization,
    metadata: {
      ...dataset.metadata,
      opd: normalizedOrganization,
    },
  };
}

function toPublishedOnly(datasets: Dataset[]): Dataset[] {
  return datasets.filter((dataset) => dataset.status === "Published");
}

function buildPublicFilterOptionsFromDatasets(datasets: Dataset[]): DatasetFilterOptions {
  const countOccurrences = (values: string[]) => {
    const map = new Map<string, number>();
    values.forEach((v) => {
      if (!v) return;
      map.set(v, (map.get(v) || 0) + 1);
    });
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "id-ID"));
  };

  const years = countOccurrences(
    datasets.flatMap((item) => {
      const fromUpdated = item.lastUpdated.slice(0, 4);
      const fromPeriod = item.metadata.period.match(/\d{4}/g) ?? [];
      return [fromUpdated, ...fromPeriod];
    }),
  ).filter((item) => /^\d{4}$/.test(item.value));

  const foundTopics = countOccurrences(datasets.map((item) => item.topic));
  const fullTopicLabels = getDatasetTopicOptions();
  const allTopics = fullTopicLabels.map((label: string) => {
    const found = foundTopics.find((t) => t.value === label);
    return found || { value: label, count: 0 };
  }).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "id-ID"));

  const foundOrgs = countOccurrences(datasets.map((item) => item.organization));
  const fullOrgNames = getDatasetOrganizationOptions();
  const allOrgs = fullOrgNames.map((name: string) => {
    const found = foundOrgs.find((o) => o.value === name);
    return found || { value: name, count: 0 };
  }).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "id-ID"));

  return {
    topics: allTopics,
    organizations: allOrgs,
    formats: countOccurrences(datasets.flatMap((item) => item.formats)),
    frequencies: countOccurrences(datasets.map((item) => item.frequency)),
    statuses: ["Published"],
    years: years.length > 0 ? years : getDatasetYearOptions(2020).map((v) => ({ value: v, count: 0 })),
    tags: countOccurrences(datasets.flatMap((item) => item.metadata.tags)),
  };
}

export function normalizeDatasetFilters(
  filters: Partial<Record<keyof DatasetFilters, string | string[] | undefined>>,
): DatasetFilters {
  const pick = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
      return value[0]?.trim() || undefined;
    }

    return value?.trim() || undefined;
  };

  const sortCandidate = pick(filters.sort);
  const sort: DatasetSort =
    sortCandidate === "populer" || sortCandidate === "az" ? sortCandidate : "terbaru";

  return {
    q: pick(filters.q),
    topic: pick(filters.topic),
    organization: pick(filters.organization)
      ? normalizeOrganizationName(pick(filters.organization) ?? "")
      : undefined,
    format: pick(filters.format),
    frequency: pick(filters.frequency),
    status: pick(filters.status),
    year: pick(filters.year),
    tag: pick(filters.tag),
    sort,
  };
}

export function normalizePositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
  allowed?: number[],
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  const normalized = Math.floor(parsed);
  if (!allowed || allowed.includes(normalized)) {
    return normalized;
  }

  return fallback;
}

export async function getDatasets(filters?: DatasetFilters): Promise<Dataset[]> {
  const adapter = getAdapter();
  let datasets: Dataset[] = [];
  
  // Ambil data dari CKAN. Jika gagal, akan throw error agar halaman menampilkan error (tidak diam-diam kosong).
  datasets = await adapter.listDatasets(filters);

  // Gabungkan dataset dari internal-store (workflow internal) yang belum ada di CKAN
  if (config.dataSourceMode === "ckan") {
    try {
      const mockAdapter = new MockDatasetAdapter();
      const mockDatasets = await mockAdapter.listDatasets(filters);
      const existingSlugs = new Set(datasets.map((d) => d.slug));
      const newLocal = mockDatasets.filter((d) => !existingSlugs.has(d.slug));
      datasets = [...datasets, ...newLocal];
    } catch (err) {
      console.warn("[dataset-service] Gagal menggabungkan dataset lokal dari internal-store:", err);
    }
  }

  return datasets.map(normalizeDatasetOrganization);
}

export async function getDatasetBySlug(slug: string): Promise<Dataset | null> {
  const adapter = getAdapter();
  let dataset = await adapter.getDatasetBySlug(slug).catch((err) => {
    // Jika bukan network error, bisa jadi 404. Untuk network error, lebih baik throw.
    if (err.message?.includes("gagal") || err.message?.includes("unavailable")) {
      throw err;
    }
    return null;
  });

  // Jika tidak ditemukan di CKAN, cari di internal-store
  if (!dataset && config.dataSourceMode === "ckan") {
    try {
      const mockAdapter = new MockDatasetAdapter();
      dataset = await mockAdapter.getDatasetBySlug(slug);
    } catch (err) {
      console.warn(`[dataset-service] Gagal memuat fallback data lokal untuk slug: ${slug}`, err);
    }
  }

  return dataset ? normalizeDatasetOrganization(dataset) : null;
}

export async function getPublicDatasets(filters?: DatasetFilters): Promise<Dataset[]> {
  const datasets = await getDatasets(filters);
  return toPublishedOnly(datasets);
}

export async function getPublicDatasetBySlug(slug: string): Promise<Dataset | null> {
  const dataset = await getDatasetBySlug(slug);
  if (!dataset || dataset.status !== "Published") {
    return null;
  }

  return dataset;
}

export async function getDatasetFilterOptions(): Promise<DatasetFilterOptions> {
  const adapter = getAdapter();
  const options = await adapter.getFilterOptions();
  const years =
    options.years.length > 0
      ? options.years
      : getDatasetYearOptions(2020).map((v) => ({ value: v, count: 0 }));

  return {
    ...options,
    years,
  };
}

export async function getPublicDatasetFilterOptions(filters?: DatasetFilters): Promise<DatasetFilterOptions> {
  const datasets = await getPublicDatasets(filters);
  return buildPublicFilterOptionsFromDatasets(datasets);
}

export async function getPortalStats(): Promise<PortalStats> {
  const adapter = getAdapter();
  return adapter.getPortalStats();
}

export function getActiveConfig() {
  return config;
}
