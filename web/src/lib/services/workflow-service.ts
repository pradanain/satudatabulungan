import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import type { InternalSession } from "@/lib/types/internal";
import type { WorkflowItem } from "@/lib/types/workflow";

function mapWorkflowItems(items: ReturnType<typeof getScopedDatasets>): WorkflowItem[] {
  return items
    .map((dataset) => ({
      id: dataset.id,
      slug: dataset.slug,
      title: dataset.title,
      organization: dataset.organization,
      status: dataset.status,
      lastUpdated: dataset.lastUpdated,
      resourceCount: dataset.resources.length,
      reviewNote: dataset.reviewSummary,
      notes: dataset.notes || [],
      auditTrail: dataset.workflowHistory.map((event) => ({
        slug: event.slug,
        actor: event.actorName,
        at: event.at,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        persistedTo: event.persistedTo,
        reviewNote: event.reviewNote,
      })),
    }))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
}

export async function getWorkflowItems(session: InternalSession): Promise<WorkflowItem[]> {
  const store = await loadInternalPortalStore();
  return mapWorkflowItems(getScopedDatasets(store, session));
}

export async function getWorkflowItemBySlug(slug: string, session: InternalSession): Promise<WorkflowItem | null> {
  const items = await getWorkflowItems(session);
  return items.find((item) => item.slug === slug) ?? null;
}

export function sortWorkflowAuditTimeline(item: WorkflowItem): WorkflowItem {
  const sortedAudit = [...(item.auditTrail ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return {
    ...item,
    auditTrail: sortedAudit,
  };
}
