export type DatasetFormat = "CSV" | "XLSX" | "PDF" | "API" | "JSON";

export type DatasetFrequency =
  | "Harian"
  | "Bulanan"
  | "Triwulanan"
  | "Semesteran"
  | "Tahunan";

export type DatasetStatus =
  | "Draft"
  | "Submitted"
  | "Need Revision"
  | "Approved"
  | "Published"
  | "Archived";

export type DatasetSort = "terbaru" | "populer" | "az";

export interface DatasetResource {
  id: string;
  name: string;
  description: string;
  format: DatasetFormat;
  url: string;
  sizeLabel: string;
  lastUpdated?: string;
}

export interface DatasetMetadata {
  identifier: string;
  opd: string;
  walidata: string;
  coverage: string;
  period: string;
  license: string;
  status: DatasetStatus;
  frequency: DatasetFrequency;
  lastUpdated: string;
  tags: string[];
}

export interface DatasetPreviewPoint {
  label: string;
  value: number;
}

export interface DatasetPreviewRow {
  area: string;
  male: number;
  female: number;
  total: number;
}

export interface DatasetInsight {
  label: string;
  value: string;
  description: string;
}

export interface DatasetPreview {
  points: DatasetPreviewPoint[];
  rows: DatasetPreviewRow[];
  insights: DatasetInsight[];
}

export interface Dataset {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  topic: string;
  organization: string;
  formats: DatasetFormat[];
  frequency: DatasetFrequency;
  status: DatasetStatus;
  lastUpdated: string;
  resources: DatasetResource[];
  metadata: DatasetMetadata;
  preview: DatasetPreview;
  relatedSlugs: string[];
  popularityScore: number;
  viewCount: number;
  downloadCount: number;
}

export interface DatasetFilters {
  q?: string;
  topic?: string;
  organization?: string;
  format?: string;
  frequency?: string;
  status?: string;
  year?: string;
  tag?: string;
  sort?: DatasetSort;
}

export interface DatasetFilterOptions {
  topics: string[];
  organizations: string[];
  formats: string[];
  frequencies: string[];
  statuses: string[];
  years: string[];
  tags: string[];
}

export interface PortalStats {
  datasetCount: number;
  organizationCount: number;
  resourceCount: number;
  metadataCompletionRate: number;
}
