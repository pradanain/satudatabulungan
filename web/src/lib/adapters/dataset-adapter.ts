import type {
  Dataset,
  DatasetFilterOptions,
  DatasetFilters,
  PortalStats,
} from "@/lib/types/dataset";

export interface DatasetAdapter {
  listDatasets(filters?: DatasetFilters): Promise<Dataset[]>;
  getDatasetBySlug(slug: string): Promise<Dataset | null>;
  getFilterOptions(): Promise<DatasetFilterOptions>;
  getPortalStats(): Promise<PortalStats>;
}
