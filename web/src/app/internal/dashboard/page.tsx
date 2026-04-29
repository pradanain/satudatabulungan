import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedAuditLogs, getScopedDatasets, getScopedNotifications, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalDashboardPage() {
  const session = await requireInternalSession("dashboard");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session);
  const notifications = getScopedNotifications(store, session).slice(0, 4);
  const auditLogs = getScopedAuditLogs(store, session).slice(0, 5);

  const publishedCount = datasets.filter((item) => item.status === "Published").length;
  const reviewCount = datasets.filter((item) => item.status === "Submitted" || item.status === "Need Revision").length;
  const avgQuality = datasets.length
    ? Math.round(datasets.reduce((total, item) => total + item.qualityScore, 0) / datasets.length)
    : 0;

  return (
    <InternalShell session={session} activeKey="dashboard">
      <InternalPageHeader
        title={
          session.role === "admin"
            ? "Dashboard Admin"
            : session.role === "walidata"
              ? "Dashboard Walidata"
              : "Dashboard Operator OPD"
        }
        description={
          session.role === "admin"
            ? "Pantau seluruh operasional portal, kontrol publikasi, dan kesehatan modul internal dalam satu tempat."
            : session.role === "walidata"
              ? "Fokus pada kualitas metadata, antrian review, dan percepatan publikasi lintas OPD."
              : "Kelola draft dataset OPD, respons catatan revisi, dan lihat progres publikasi dataset Anda."
        }
        badges={
          <>
            <Badge variant="outline">{formatCompactNumber(datasets.length)} dataset terlihat</Badge>
            <Badge variant="outline">{notifications.length} notifikasi aktif</Badge>
            <Badge variant="outline">Shared source dengan portal publik</Badge>
          </>
        }
        actions={
          <>
            <Button asChild className="rounded-full px-5">
              <Link href="/internal/datasets/new">Tambah Draft Dataset</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full px-5">
              <Link href="/internal/workflow">Buka Review Workflow</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Dataset Terkelola</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{formatCompactNumber(datasets.length)}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Perlu Review</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{formatCompactNumber(reviewCount)}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Sudah Publish</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{formatCompactNumber(publishedCount)}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Rata-rata Quality</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{avgQuality}%</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h2 className="m-0 text-xl font-semibold">Prioritas Dataset</h2>
              <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">
                Daftar singkat dataset yang paling relevan untuk tindak lanjut hari ini.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="/internal/datasets">Lihat Semua</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Dataset</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Quality</th>
                  <th className="px-5 py-3 font-semibold">Update</th>
                </tr>
              </thead>
              <tbody>
                {datasets.slice(0, 6).map((dataset) => (
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
                    <td className="px-5 py-4 font-semibold">{dataset.qualityScore}%</td>
                    <td className="px-5 py-4 text-[var(--color-muted)]">{formatIndonesianDate(dataset.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="m-0 text-xl font-semibold">Catatan Aktivitas</h2>
            <div className="mt-4 grid gap-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                  <p className="m-0 text-sm font-semibold">{notification.title}</p>
                  <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">{notification.message}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="m-0 text-xl font-semibold">Audit Terkini</h2>
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
        </div>
      </section>
    </InternalShell>
  );
}
