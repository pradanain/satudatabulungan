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
import { summarizeUpstreamError } from "@/lib/utils/upstream-error";
import { normalizeOrganizationName } from "@/lib/utils/organization";

const config = getRuntimeConfig();
const mockAdapter = new MockDatasetAdapter();

function getPrimaryAdapter(): DatasetAdapter {
  if (config.dataSourceMode === "ckan") {
    return new CkanDatasetAdapter(config.ckanBaseUrl);
  }

  return mockAdapter;
}

async function withFallback<T>(fn: (adapter: DatasetAdapter) => Promise<T>): Promise<T> {
  const primary = getPrimaryAdapter();

  try {
    return await fn(primary);
  } catch (error) {
    if (config.dataSourceMode !== "ckan") {
      throw error;
    }

    const reason = summarizeUpstreamError(error);
    console.warn(`[dataset-service] CKAN unavailable, fallback ke mock dataset. reason=${reason}`);
    return fn(mockAdapter);
  }
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
  const datasets = await withFallback((adapter) => adapter.listDatasets(filters));
  return datasets.map(normalizeDatasetOrganization);
}

export async function getDatasetBySlug(slug: string): Promise<Dataset | null> {
  const dataset = await withFallback((adapter) => adapter.getDatasetBySlug(slug));
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
  const options = await withFallback((adapter) => adapter.getFilterOptions());
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
  return withFallback((adapter) => adapter.getPortalStats());
}

export function getActiveConfig() {
  return config;
}
