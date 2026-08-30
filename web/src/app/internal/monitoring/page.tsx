import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { getScopedAuditLogs, getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { MonitoringTabs } from "./monitoring-tabs";

export const dynamic = "force-dynamic";

export default async function InternalMonitoringPage() {
  const session = await requireInternalSession("monitoring");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session);
  const auditLogs = getScopedAuditLogs(store, session);

  const unresolvedNotes = datasets.flatMap(ds => 
    (ds.notes || []).map(note => ({
      ...note,
      datasetTitle: ds.title,
      datasetSlug: ds.slug,
    }))
  ).filter(note => !note.isResolved);

  const issueDatasets = datasets
    .filter(item => item.status === "Need Revision" || (item.metadataScore || 0) < 80 || item.resources.length === 0)
    .map(ds => {
      let masalah = "Unknown";
      let severity: "Critical" | "High" | "Medium" | "Low" = "Low";

      if (ds.resources.length === 0) {
        masalah = "Tidak ada resource";
        severity = "Critical";
      } else if ((ds.metadataScore || 0) < 50) {
        masalah = "Metadata < 50%";
        severity = "High";
      } else if (ds.status === "Need Revision") {
        masalah = "Perlu Revisi";
        severity = "Medium";
      } else {
        masalah = "Metadata Rendah";
        severity = "Low";
      }

      return { ...ds, masalah, severity };
    })
    .sort((a, b) => {
      const order = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
      return order[b.severity] - order[a.severity];
    });

  return (
    <InternalShell session={session} activeKey="monitoring">
      <InternalPageHeader
        title="Monitoring"
        description={
          session.role === "produsen" 
            ? "Pantau catatan tindak lanjut dan perbaikan kualitas data OPD Anda."
            : session.role === "sekretariat"
              ? "Pantau kualitas data, catatan evaluasi, dan koordinasi antar OPD."
              : "Pantau kualitas data, aktivitas user, dan dataset yang perlu perhatian."
        }
      />

      <MonitoringTabs 
        issueDatasets={issueDatasets}
        auditLogs={auditLogs}
        unresolvedNotes={unresolvedNotes}
        totalDatasets={datasets.length}
      />
    </InternalShell>
  );
}
