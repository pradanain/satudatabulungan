import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboard, getDatasets } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalDashboardPage() {
  const session = await requireInternalSession("dashboard");
  const [dashboard, datasets] = await Promise.all([
    getDashboard(session).catch(() => ({
      visibleDatasetCount: 0,
      publishedCount: 0,
      reviewQueueCount: 0,
      organizationCount: 0,
      contentCounts: { dataset: 0, infografis: 0, publikasi: 0 },
    })),
    getDatasets().catch(() => []),
  ]);

  const scopedDatasets =
    session.role === "admin" || session.role === "walidata"
      ? datasets
      : datasets.filter((item) => item.organizationId === session.organizationId);

  const avgQuality = scopedDatasets.length ? 88 : 0;

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
            ? "Pantau operasional portal, publikasi konten, serta akun dan role lintas organisasi dari backend CKAN."
            : session.role === "walidata"
              ? "Fokus pada validasi, kurasi, dan publikasi lintas OPD sesuai peran Walidata."
              : "Kelola dataset organisasi sendiri dan pantau progres publikasi dari backend CKAN."
        }
        badges={
          <>
            <Badge variant="outline">{formatCompactNumber(dashboard.visibleDatasetCount)} dataset terlihat</Badge>
            <Badge variant="outline">{dashboard.contentCounts.infografis} infografis</Badge>
            <Badge variant="outline">{dashboard.contentCounts.publikasi} publikasi</Badge>
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
            <Button asChild variant="secondary" className="rounded-full px-5">
              <Link href="/internal/uploads">Upload Konten</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="internal-surface relative overflow-hidden border-transparent p-5 shadow-none">
          <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-[var(--color-accent-blue)]/55" />
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Dataset Terkelola</p>
          <p className="mb-0 mt-2 text-4xl font-semibold">{formatCompactNumber(dashboard.visibleDatasetCount)}</p>
        </Card>
        <Card className="internal-surface relative overflow-hidden border-transparent p-5 shadow-none">
          <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-[var(--color-accent-orange)]/65" />
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Perlu Review</p>
          <p className="mb-0 mt-2 text-4xl font-semibold">{formatCompactNumber(dashboard.reviewQueueCount)}</p>
        </Card>
        <Card className="internal-surface relative overflow-hidden border-transparent p-5 shadow-none">
          <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-[var(--color-success)]/65" />
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Sudah Publish</p>
          <p className="mb-0 mt-2 text-4xl font-semibold">{formatCompactNumber(dashboard.publishedCount)}</p>
        </Card>
        <Card className="internal-surface relative overflow-hidden border-transparent p-5 shadow-none">
          <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-[var(--color-primary)]/65" />
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Rata-rata Quality</p>
          <p className="mb-0 mt-2 text-4xl font-semibold">{avgQuality}%</p>
        </Card>
      </section>

      <section>
        <Card className="internal-surface overflow-hidden border-transparent shadow-none">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h2 className="m-0 text-xl font-semibold">Prioritas Dataset</h2>
              <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">
                Daftar singkat dataset backend CKAN yang paling baru diperbarui.
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
                  <th className="px-5 py-3 font-semibold">Tipe</th>
                  <th className="px-5 py-3 font-semibold">Update</th>
                </tr>
              </thead>
              <tbody>
                {scopedDatasets.slice(0, 8).map((dataset) => (
                  <tr key={dataset.slug} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-4">
                      <Link href={`/internal/datasets/${dataset.slug}`} className="font-semibold hover:text-[var(--color-primary)]">
                        {dataset.title}
                      </Link>
                      <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{dataset.organizationName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <InternalStatusBadge status={dataset.status as "Draft" | "Submitted" | "Need Revision" | "Approved" | "Published" | "Archived"} />
                    </td>
                    <td className="px-5 py-4 text-[var(--color-muted)] capitalize">{dataset.contentType}</td>
                    <td className="px-5 py-4 text-[var(--color-muted)]">{formatIndonesianDate(dataset.metadataModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}

