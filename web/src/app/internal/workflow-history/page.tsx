import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalWorkflowHistoryPage() {
  const session = await requireInternalSession("workflowHistory");
  const store = await loadInternalPortalStore();
  const events = getScopedDatasets(store, session)
    .flatMap((dataset) =>
      dataset.workflowHistory.map((event) => ({
        ...event,
        title: dataset.title,
      })),
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <InternalShell session={session} activeKey="workflowHistory">
      <InternalPageHeader
        title="Riwayat Workflow"
        description="Telusuri jejak perubahan status dataset dari draft hingga publikasi atau arsip dalam satu timeline yang konsisten."
        badges={<Badge variant="outline">{events.length} event workflow</Badge>}
      />

      <Card className="internal-surface border-transparent p-5 shadow-none">
        <div className="grid gap-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-[var(--color-border)] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/internal/datasets/${event.slug}`} className="text-sm font-semibold hover:text-[var(--color-primary)]">
                    {event.title}
                  </Link>
                  <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
                    {event.actorName} memindahkan status dari {event.fromStatus} ke {event.toStatus}
                  </p>
                </div>
                <p className="m-0 text-xs text-[var(--color-muted)]">{formatIndonesianDate(event.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </InternalShell>
  );
}


