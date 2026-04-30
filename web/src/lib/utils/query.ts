import type { DatasetFilters } from "@/lib/types/dataset";

export type DatasetQueryParams = DatasetFilters & {
  page?: number;
  pageSize?: number;
};

export type PublicationSort = "terbaru" | "terlama" | "az";

export interface PublicationQueryParams {
  q?: string;
  sort?: PublicationSort;
  page?: number;
}

export function buildDatasetQuery(filters: DatasetQueryParams): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.organization) params.set("organization", filters.organization);
  if (filters.format) params.set("format", filters.format);
  if (filters.frequency) params.set("frequency", filters.frequency);
  if (filters.status) params.set("status", filters.status);
  if (filters.year) params.set("year", filters.year);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", `${filters.page}`);
  if (filters.pageSize && filters.pageSize > 0) params.set("pageSize", `${filters.pageSize}`);

  const query = params.toString();
  return query.length ? `?${query}` : "";
}

export function buildPublicationQuery(filters: PublicationQueryParams): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "terbaru") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", `${filters.page}`);

  const query = params.toString();
  return query.length ? `?${query}` : "";
}

export type PublicationNewsSort = PublicationSort;
export type PublicationNewsQueryParams = PublicationQueryParams;
export const buildPublicationNewsQuery = buildPublicationQuery;
