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

    console.warn("Gagal mengambil data CKAN, fallback ke mock dataset.", error);
    return fn(mockAdapter);
  }
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
    organization: pick(filters.organization),
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
  return withFallback((adapter) => adapter.listDatasets(filters));
}

export async function getDatasetBySlug(slug: string): Promise<Dataset | null> {
  return withFallback((adapter) => adapter.getDatasetBySlug(slug));
}

export async function getDatasetFilterOptions(): Promise<DatasetFilterOptions> {
  const options = await withFallback((adapter) => adapter.getFilterOptions());

  return {
    ...options,
    topics: getDatasetTopicOptions(),
    organizations: getDatasetOrganizationOptions(),
    years: getDatasetYearOptions(2020),
  };
}

export async function getPortalStats(): Promise<PortalStats> {
  return withFallback((adapter) => adapter.getPortalStats());
}

export function getActiveConfig() {
  return config;
}
