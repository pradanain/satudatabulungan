import type {
  Dataset,
  DatasetFilterOptions,
  DatasetFilters,
  PortalStats,
} from "@/lib/types/dataset";
import {
  getPublicDatasetBySlug,
  getPublicFilterOptions,
  getPublicPortalStats,
  listPublicDatasets,
} from "@/lib/services/internal-store";
import type { DatasetAdapter } from "./dataset-adapter";

export class MockDatasetAdapter implements DatasetAdapter {
  async listDatasets(filters: DatasetFilters = {}): Promise<Dataset[]> {
    return listPublicDatasets(filters);
  }

  async getDatasetBySlug(slug: string): Promise<Dataset | null> {
    return getPublicDatasetBySlug(slug);
  }

  async getFilterOptions(): Promise<DatasetFilterOptions> {
    return getPublicFilterOptions();
  }

  async getPortalStats(): Promise<PortalStats> {
    return getPublicPortalStats();
  }
}
