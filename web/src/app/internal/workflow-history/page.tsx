import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { DataToolbar } from "@/components/internal/data-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedAuditLogs, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalWorkflowHistoryPage() {
  const session = await requireInternalSession("workflowHistory");
  const store = await loadInternalPortalStore();
  const logs = getScopedAuditLogs(store, session);

  // Mock grouping by date
  const groupedLogs = [
    {
      date: "Hari Ini",
      items: logs.slice(0, 3)
    },
    {
      date: "Kemarin",
      items: logs.slice(3, 8)
    },
    {
      date: "Minggu Lalu",
      items: logs.slice(8)
    }
  ].filter(group => group.items.length > 0);

  return (
    <InternalShell session={session} activeKey="workflowHistory">
      <InternalPageHeader
        title="Riwayat Workflow"
        description="Telusuri perubahan status dataset dari draft hingga publikasi secara lengkap."
        badges={
          <>
            <Badge variant="outline">{logs.length} event terekam</Badge>
          </>
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <div className="border-b border-[var(--color-border)] px-4">
          <DataToolbar 
            searchPlaceholder="Cari riwayat dataset atau user..."
            showExport={true}
            filters={
              <>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">OPD</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Status Awal</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Status Akhir</Badge>
                <Badge variant="secondary" className="font-normal cursor-pointer hover:bg-[var(--color-border)]">Tanggal</Badge>
              </>
            }
          />
        </div>
        
        <div className="p-6">
          <div className="max-w-4xl space-y-8">
            {groupedLogs.map((group, groupIdx) => (
              <div key={groupIdx}>
                <h3 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-4 pl-8">{group.date}</h3>
                <div className="space-y-0 pl-2">
                  {group.items.map((log, idx) => {
                    const isLast = idx === group.items.length - 1;
                    return (
                      <div key={log.id} className="relative flex gap-4 items-start group hover:bg-[var(--color-surface-soft)]/30 rounded-lg p-2 transition-colors cursor-pointer">
                        {/* Timeline line */}
                        {!isLast && <div className="absolute left-[15px] top-8 bottom-[-8px] w-px bg-[var(--color-border)]" />}
                        
                        {/* Timeline dot */}
                        <div className="relative mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-white ring-4 ring-white z-10" />
                        
                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text)]">
                                Dataset <span className="text-[var(--color-primary)] cursor-pointer">#{log.datasetSlug || log.id.split('-')[0]}</span> {log.summary.toLowerCase()}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                                <span className="font-medium text-[var(--color-text)]">{log.actorName}</span>
                                <span>•</span>
                                <span>{formatIndonesianDate(log.createdAt)}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 text-xs transition-opacity">Detail</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </InternalShell>
  );
}
