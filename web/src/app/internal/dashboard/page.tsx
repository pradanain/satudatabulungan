import Link from "next/link";
import { Activity, ClipboardCheck, Database, Zap } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboard, getDatasets } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";
import { validateDatasetQuality } from "@/lib/utils/data-validator";

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

  // Kalkulasi Skor Kualitas Riil
  const qualityScores = scopedDatasets.map(ds => validateDatasetQuality(ds).score);
  const avgQuality = qualityScores.length 
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) 
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden border-transparent bg-gradient-to-br from-white to-[#f5f8ff] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(58,110,190,0.08)]">
          <div className="absolute -right-2 -top-2 size-20 text-[#3a6ebe]/5 transition-transform group-hover:scale-110">
            <Database className="size-full" />
          </div>
          <p className="m-0 text-sm font-bold uppercase tracking-wider text-[#3a6ebe]/70">Dataset Terkelola</p>
          <p className="mb-0 mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">{formatCompactNumber(dashboard.visibleDatasetCount)}</p>
        </Card>

        <Card className="group relative overflow-hidden border-transparent bg-gradient-to-br from-white to-[#fff9f2] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(213,133,45,0.08)]">
          <div className="absolute -right-2 -top-2 size-20 text-[#d5852d]/5 transition-transform group-hover:scale-110">
            <ClipboardCheck className="size-full" />
          </div>
          <p className="m-0 text-sm font-bold uppercase tracking-wider text-[#d5852d]/70">Perlu Review</p>
          <p className="mb-0 mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">{formatCompactNumber(dashboard.reviewQueueCount)}</p>
        </Card>

        <Card className="group relative overflow-hidden border-transparent bg-gradient-to-br from-white to-[#f3fbf7] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(49,148,106,0.08)]">
          <div className="absolute -right-2 -top-2 size-20 text-[#31946a]/5 transition-transform group-hover:scale-110">
            <Zap className="size-full" />
          </div>
          <p className="m-0 text-sm font-bold uppercase tracking-wider text-[#31946a]/70">Sudah Publish</p>
          <p className="mb-0 mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">{formatCompactNumber(dashboard.publishedCount)}</p>
        </Card>

        {session.role !== "operator" && (
          <Card className="group relative overflow-hidden border-transparent bg-gradient-to-br from-white to-[#f8f5ff] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(117,85,173,0.08)]">
            <div className="absolute -right-2 -top-2 size-20 text-[#7555ad]/5 transition-transform group-hover:scale-110">
              <Activity className="size-full" />
            </div>
            <p className="m-0 text-sm font-bold uppercase tracking-wider text-[#7555ad]/70">Quality Score</p>
            <p className="mb-0 mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">{avgQuality}%</p>
          </Card>
        )}
      </section>

      <section>
        <Card className="overflow-hidden border-transparent bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-r from-white to-[var(--color-surface-soft)]/30 px-5 py-5">
            <div>
              <h2 className="m-0 text-xl font-bold tracking-tight">Prioritas Dataset</h2>
              <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">
                Daftar singkat dataset backend CKAN yang paling baru diperbarui.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="rounded-full bg-white shadow-sm hover:shadow-md">
              <Link href="/internal/datasets">Lihat Semua</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)]/50 text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Dataset</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Tipe</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Terakhir Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {scopedDatasets.slice(0, 8).map((dataset) => (
                  <tr key={dataset.slug} className="group transition-colors hover:bg-[var(--color-surface-soft)]/30">
                    <td className="px-6 py-4">
                      <Link href={`/internal/datasets/${dataset.slug}`} className="font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                        {dataset.title}
                      </Link>
                      <p className="mb-0 mt-1 text-xs font-medium text-[var(--color-muted)]">{dataset.organizationName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <InternalStatusBadge status={dataset.status as any} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-[var(--color-surface-soft)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        {dataset.contentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--color-muted)]">{formatIndonesianDate(dataset.metadataModified)}</td>
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

