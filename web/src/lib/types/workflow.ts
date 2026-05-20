import type { DatasetStatus } from "@/lib/types/dataset";
import type { DatasetNote } from "@/lib/types/internal";

export interface WorkflowAuditEntry {
  slug: string;
  actor: string;
  at: string;
  fromStatus: string;
  toStatus: DatasetStatus;
  persistedTo: "ckan" | "mock-api";
  reviewNote?: string;
}

export interface WorkflowItem {
  id: string;
  slug: string;
  title: string;
  organization: string;
  status: DatasetStatus;
  lastUpdated: string;
  resourceCount: number;
  reviewNote?: string;
  auditTrail?: WorkflowAuditEntry[];
  notes?: DatasetNote[];
}

export const workflowLaneOrder: DatasetStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Need Revision",
  "Approved",
  "Published",
  "Archived",
];

export const workflowTransitions: Record<DatasetStatus, DatasetStatus[]> = {
  Draft: ["Submitted"],
  Submitted: ["Under Review"],
  "Under Review": ["Need Revision", "Approved"],
  "Need Revision": ["Submitted"],
  Approved: ["Published"],
  Published: ["Archived"],
  Archived: ["Published"],
};

export function getNextStatuses(status: DatasetStatus): DatasetStatus[] {
  return workflowTransitions[status] ?? [];
}

export function canTransition(from: DatasetStatus, to: DatasetStatus): boolean {
  return getNextStatuses(from).includes(to);
}

export function isDatasetStatus(value: string): value is DatasetStatus {
  return workflowLaneOrder.includes(value as DatasetStatus);
}

// ---------------------------------------------------------------------------
// Status labels (Indonesian) & normalizer
// ---------------------------------------------------------------------------

/** Indonesian UI label for each dataset status */
export const datasetStatusLabel: Record<DatasetStatus, string> = {
  Draft: "Draft",
  Submitted: "Diajukan ke Walidata",
  "Under Review": "Pemeriksaan Walidata",
  "Need Revision": "Perlu Revisi",
  Approved: "Layak Publikasi",
  Published: "Dipublikasikan",
  Archived: "Diarsipkan",
};

/** Get the Indonesian label for a dataset status */
export function getStatusLabel(status: DatasetStatus): string {
  return datasetStatusLabel[status] ?? status;
}

/** Normalize legacy status strings to canonical DatasetStatus values */
export function normalizeDatasetStatus(raw: string): DatasetStatus {
  const lower = raw.toLowerCase().trim();
  switch (lower) {
    case "draft":
      return "Draft";
    case "submitted":
    case "diajukan":
    case "diajukan ke walidata":
      return "Submitted";
    case "under review":
    case "under_review":
    case "pemeriksaan walidata":
    case "sedang diperiksa":
      return "Under Review";
    case "need revision":
    case "need_revision":
    case "revision_required":
    case "perlu revisi":
      return "Need Revision";
    case "approved":
    case "layak publikasi":
      return "Approved";
    case "published":
    case "dipublikasikan":
      return "Published";
    case "archived":
    case "diarsipkan":
      return "Archived";
    default:
      return "Draft";
  }
}
