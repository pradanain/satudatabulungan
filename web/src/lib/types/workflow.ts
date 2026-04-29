import type { DatasetStatus } from "@/lib/types/dataset";

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
}

export const workflowLaneOrder: DatasetStatus[] = [
  "Draft",
  "Submitted",
  "Need Revision",
  "Approved",
  "Published",
  "Archived",
];

export const workflowTransitions: Record<DatasetStatus, DatasetStatus[]> = {
  Draft: ["Submitted"],
  Submitted: ["Need Revision", "Approved"],
  "Need Revision": ["Submitted"],
  Approved: ["Published"],
  Published: ["Archived"],
  Archived: [],
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
