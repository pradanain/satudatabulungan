import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Database, FileText, Inbox } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboard, getDatasets } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

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
    getDatasets({ contentType: "dataset" }).catch(() => []),
  ]);

  const scopedDatasets =
    hasPermission(session, "dataset.view_all")
      ? datasets
      : datasets.filter((item) => item.organizationId === session.organizationId);

  const needRevisionDatasets = scopedDatasets.filter(ds => ds.status === "Need Revision");
  const submittedDatasets = scopedDatasets.filter(ds => ds.status === "Submitted");
  const underReviewDatasets = scopedDatasets.filter(ds => ds.status === "Under Review");
  const approvedDatasets = scopedDatasets.filter(ds => ds.status === "Approved");
  const publishedDatasets = scopedDatasets.filter(ds => ds.status.toLowerCase() === "published");

  const hasData = scopedDatasets.length > 0;

  // Tugas Prioritas
  let prioritasDatasets: Array<typeof scopedDatasets[number] & { alasan: string; cta: string; href: string }> = [];
  if (hasPermission(session, "dataset.review")) {
    const reviewQueue = [...submittedDatasets, ...underReviewDatasets];
    prioritasDatasets = reviewQueue.slice(0, 5).map(ds => ({
      ...ds,
      alasan: ds.status === "Submitted" ? "Menunggu pemeriksaan Anda" : "Sedang dalam pemeriksaan",
      cta: ds.status === "Submitted" ? "Mulai Pemeriksaan" : "Lanjutkan Pemeriksaan",
      href: `/internal/workflow`
    }));
  } else {
    prioritasDatasets = (needRevisionDatasets as typeof scopedDatasets).slice(0, 5).map(ds => ({
      ...ds,
      alasan: "Dikembalikan dengan catatan",
      cta: "Perbaiki Dataset",
      href: `/internal/datasets/${ds.slug}`
    }));
  }

  return (
    <InternalShell session={session} activeKey="dashboard">
      <InternalPageHeader
        title="Dashboard"
        description={
          session.role === "produsen" 
            ? "Ringkasan kontribusi dataset dan status pengajuan OPD Anda."
            : session.role === "walidata"
              ? "Ringkasan pengelolaan, verifikasi dataset, dan aktivitas portal."
              : "Ringkasan pengawasan dataset dan aktivitas portal internal."
        }
      />

      {/* KPI Summary Cards */}
      {hasData ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Database className="size-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Total Dataset</p>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-text)]">{scopedDatasets.length}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Dataset dalam cakupan Anda</p>
          </Card>
          
          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardCheck className="size-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Menunggu Verifikasi</p>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-text)]">{submittedDatasets.length + underReviewDatasets.length}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Diajukan + sedang diperiksa</p>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <AlertTriangle className="size-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Perlu Revisi</p>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-text)]">{needRevisionDatasets.length}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Dikembalikan untuk perbaikan</p>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Dipublikasikan</p>
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-text)]">{publishedDatasets.length}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Tersedia di portal publik</p>
          </Card>
        </section>
      ) : (
        <Card className="p-8 shadow-sm text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Belum Ada Dataset</h3>
            <p className="text-sm text-[var(--color-muted)] max-w-md">
              Data statistik akan muncul setelah dataset mulai dikelola melalui portal internal. Mulai dengan menambahkan dataset pertama Anda.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Tugas Prioritas Hari Ini */}
        <section>
          <Card className="flex h-full flex-col overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-lg font-bold">Tugas Prioritas</h2>
              <Badge variant="secondary" className="font-semibold">{prioritasDatasets.length} Tugas</Badge>
            </div>
            <div className="flex-1 divide-y divide-[var(--color-border)] overflow-y-auto">
              {prioritasDatasets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <CheckCircle2 className="size-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-[var(--color-text)]">Tidak ada tugas prioritas</p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">Semua tugas sudah ditangani saat ini.</p>
                </div>
              ) : (
                prioritasDatasets.map((ds) => (
                  <div key={ds.slug} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--color-surface-soft)]/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <Link href={`/internal/datasets/${ds.slug}`} className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] truncate block">
                        {ds.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-medium text-[var(--color-muted)]">{ds.organizationName}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--color-border)]"></span>
                        <span className="text-orange-600 font-semibold">{ds.alasan}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5 h-8">
                      <Link href={ds.href}>
                        {ds.cta} <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Ringkasan Status */}
        <section>
          <Card className="flex h-full flex-col overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-lg font-bold">Ringkasan Status</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" asChild>
                <Link href="/internal/datasets">Lihat Semua</Link>
              </Button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              {hasData ? (
                <>
                  {[
                    { label: "Siap Publish", count: approvedDatasets.length, color: "bg-emerald-500", desc: "Sudah disetujui, menunggu publikasi" },
                    { label: "Sedang Diperiksa", count: underReviewDatasets.length, color: "bg-blue-500", desc: "Sedang diperiksa oleh Walidata" },
                    { label: "Diajukan", count: submittedDatasets.length, color: "bg-amber-500", desc: "Diajukan dan menunggu pemeriksaan" },
                    { label: "Perlu Revisi", count: needRevisionDatasets.length, color: "bg-orange-500", desc: "Dikembalikan untuk perbaikan" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${item.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--color-text)]">{item.label}</span>
                          <span className="text-lg font-extrabold text-[var(--color-text)]">{item.count}</span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="size-8 text-slate-300 mb-2" />
                  <p className="text-sm text-[var(--color-muted)]">Data status akan tampil setelah dataset tersedia.</p>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </InternalShell>
  );
}
