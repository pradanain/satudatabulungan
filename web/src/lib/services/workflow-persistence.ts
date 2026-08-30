import type { DatasetFormat, DatasetFrequency, DatasetStatus, DatasetPreview, DatasetResource } from "@/lib/types/dataset";
import {
  createInternalDatasetDraft as createWorkflowDraftInStore,
  loadInternalPortalStore,
  transitionInternalDataset,
} from "@/lib/services/internal-store";
import type { InternalSession } from "@/lib/types/internal";

export type WorkflowOverrideEntry = {
  status: DatasetStatus;
  updatedAt: string;
  reviewNote?: string;
};

export type WorkflowOverrides = Record<string, WorkflowOverrideEntry>;

export type WorkflowAuditEntry = {
  slug: string;
  actor: string;
  at: string;
  fromStatus: string;
  toStatus: DatasetStatus;
  persistedTo: "ckan" | "mock-api";
  reviewNote?: string;
};

export type WorkflowAuditTrail = Record<string, WorkflowAuditEntry[]>;

export type MockDraftEntry = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  status: DatasetStatus;
  lastUpdated: string;
  resourceCount: number;
};

export type MockDrafts = Record<string, MockDraftEntry>;

export type TransitionInput = {
  slug: string;
  fromStatus: DatasetStatus;
  toStatus: DatasetStatus;
  actor: string;
  session: InternalSession;
  reviewNote?: string;
};

export type TransitionResult = {
  persistedTo: "ckan" | "mock-api";
  updatedAt: string;
};

export type DraftCreateInput = {
  title: string;
  slug: string;
  summary: string;
  description?: string;
  organization: string;
  ownerOrgSlug?: string;
  topic: string;
  frequency: DatasetFrequency;
  period: string;
  walidata: string;
  coverage?: string;
  resourceName: string;
  resourceFormat: DatasetFormat;
  resourceUrl: string;
  preview?: DatasetPreview;
  resources?: DatasetResource[];
  tags?: string[];
  unit?: string;
};

export type DraftCreateResult = {
  slug: string;
  persistedTo: "ckan" | "mock-api";
  createdAt: string;
};

export async function loadWorkflowOverrides(): Promise<WorkflowOverrides> {
  const store = await loadInternalPortalStore();
  return Object.fromEntries(
    store.datasets.map((item) => [
      item.slug,
      {
        status: item.status,
        updatedAt: item.lastUpdated,
        reviewNote: item.reviewSummary,
      },
    ]),
  );
}

export async function loadMockWorkflowDrafts(): Promise<MockDrafts> {
  const store = await loadInternalPortalStore();
  return Object.fromEntries(
    store.datasets
      .filter((item) => item.status !== "Published")
      .map((item) => [
        item.slug,
        {
          id: item.id,
          slug: item.slug,
          title: item.title,
          organization: item.organization,
          status: item.status,
          lastUpdated: item.lastUpdated,
          resourceCount: item.resources.length,
        },
      ]),
  );
}

export async function loadWorkflowAuditTrail(): Promise<WorkflowAuditTrail> {
  const store = await loadInternalPortalStore();
  return Object.fromEntries(
    store.datasets.map((item) => [
      item.slug,
      item.workflowHistory.map((event) => ({
        slug: item.slug,
        actor: event.actorName,
        at: event.at,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        persistedTo: event.persistedTo,
        reviewNote: event.reviewNote,
      })),
    ]),
  );
}

export async function persistWorkflowTransition(input: TransitionInput): Promise<TransitionResult> {
  return transitionInternalDataset(
    input.slug,
    input.fromStatus,
    input.toStatus,
    input.session,
    input.reviewNote,
  );
}

export async function createWorkflowDraft(
  input: DraftCreateInput,
  _actor: string,
  session?: InternalSession,
): Promise<DraftCreateResult> {
  if (!session) {
    throw new Error("Sesi internal dibutuhkan untuk membuat draft.");
  }

  return createWorkflowDraftInStore(input, session);
}
