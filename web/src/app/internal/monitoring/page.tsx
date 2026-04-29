import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedAuditLogs, getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalMonitoringPage() {
  const session = await requireInternalSession("monitoring");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session);
  const auditLogs = getScopedAuditLogs(store, session).slice(0, 8);

  const issueDatasets = datasets.filter(
    (item) => item.status === "Need Revision" || item.metadataScore < 80 || item.qualityScore < 80,
  );

  return (
    <InternalShell session={session} activeKey="monitoring">
      <InternalPageHeader
        title="Monitoring & Audit"
        description="Pantau dataset yang memerlukan perhatian, audit aktivitas pengguna, dan kesehatan data lintas modul internal."
        badges={
          <>
            <Badge variant="outline">{formatCompactNumber(auditLogs.length)} audit terbaru</Badge>
            <Badge variant="outline">{issueDatasets.length} dataset perlu perhatian</Badge>
          </>
        }
        actions={
          <Button asChild variant="secondary" className="rounded-full px-5">
            <Link href="/internal/workflow-history">Buka Riwayat Workflow</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Total Dataset</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{datasets.length}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Need Revision</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">
            {datasets.filter((item) => item.status === "Need Revision").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Published</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">
            {datasets.filter((item) => item.status === "Published").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Metadata Lengkap</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">
            {datasets.length ? Math.round(datasets.reduce((sum, item) => sum + item.metadataScore, 0) / datasets.length) : 0}%
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="m-0 text-xl font-semibold">Dataset Perlu Perhatian</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Dataset</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Metadata</th>
                  <th className="px-5 py-3 font-semibold">Quality</th>
                </tr>
              </thead>
              <tbody>
                {issueDatasets.slice(0, 8).map((dataset) => (
                  <tr key={dataset.slug} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-4">
                      <Link href={`/internal/datasets/${dataset.slug}`} className="font-semibold hover:text-[var(--color-primary)]">
                        {dataset.title}
                      </Link>
                      <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{dataset.organization}</p>
                    </td>
                    <td className="px-5 py-4">
                      <InternalStatusBadge status={dataset.status} />
                    </td>
                    <td className="px-5 py-4 font-semibold">{dataset.metadataScore}%</td>
                    <td className="px-5 py-4 font-semibold">{dataset.qualityScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="m-0 text-xl font-semibold">Audit Log Terbaru</h2>
          <div className="mt-4 grid gap-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[var(--color-border)] p-4">
                <p className="m-0 text-sm font-semibold">{log.summary}</p>
                <p className="mb-0 mt-2 text-xs text-[var(--color-muted)]">
                  {log.actorName} • {formatIndonesianDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}
