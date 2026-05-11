import { notFound } from "next/navigation";
import Link from "next/link";
import { InternalDatasetForm } from "@/components/internal/internal-dataset-form";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInternalDatasetBySlug, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { InternalQualityScoreCard } from "@/components/internal/internal-quality-score-card";
import { validateDatasetQuality } from "@/lib/utils/data-validator";
import type { PortalDataset } from "@/lib/services/ckan-portal-api";
import ChoroplethMap from "@/components/shared/choropleth-map";

export const dynamic = "force-dynamic";

export default async function InternalDatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireInternalSession("datasets");
  const { slug } = await params;
  const store = await loadInternalPortalStore();
  const dataset = await getInternalDatasetBySlug(slug, session);

  if (!dataset) {
    notFound();
  }

  const canEdit = session.role === "admin" || session.role === "operator_opd";

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title={dataset.title}
        description={dataset.reviewSummary}
        badges={
          <>
            <InternalStatusBadge status={dataset.status} />
            <Badge variant="outline">Quality {validateDatasetQuality(dataset as unknown as PortalDataset).score}%</Badge>
          </>
        }
        actions={
          <>
            {dataset.status === "Published" ? (
              <Button asChild variant="secondary" className="rounded-full px-5">
                <Link href={`/dataset/${dataset.slug}`}>Buka Halaman Publik</Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary" className="rounded-full px-5">
              <Link href="/internal/workflow">Kembali ke Workflow</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="internal-surface border-transparent p-5 shadow-none">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Organisasi</p>
          <p className="mb-0 mt-3 text-xl font-semibold">{dataset.organization}</p>
        </Card>
        <Card className="internal-surface border-transparent p-5 shadow-none">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Frekuensi</p>
          <p className="mb-0 mt-3 text-xl font-semibold">{dataset.frequency}</p>
        </Card>
        <Card className="internal-surface border-transparent p-5 shadow-none">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Update Terakhir</p>
          <p className="mb-0 mt-3 text-xl font-semibold">{formatIndonesianDate(dataset.lastUpdated)}</p>
        </Card>
        <Card className="internal-surface border-transparent p-5 shadow-none">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Jumlah Resource</p>
          <p className="mb-0 mt-3 text-xl font-semibold">{dataset.resources.length}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {canEdit ? (
            <InternalDatasetForm
              mode="edit"
              session={session}
              dataset={dataset}
              organizations={store.organizations}
              topics={store.topics}
            />
          ) : (
            <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
              <h2 className="m-0 text-xl font-semibold">Ringkasan Dataset</h2>
              <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{dataset.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dataset.metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
        
        <div className="space-y-4">
          <InternalQualityScoreCard dataset={dataset as unknown as PortalDataset} />
          
          <Card className="internal-surface border-transparent p-5 shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">Pratinjau Geospasial</h3>
            <div className="mt-4 h-[300px] overflow-hidden rounded-xl border border-white/60 bg-slate-50">
              <ChoroplethMap data={dataset.preview.rows || []} className="h-full w-full" />
            </div>
            <p className="mt-3 text-[10px] leading-tight text-[var(--color-muted)]">
              Visualisasi otomatis berdasarkan kolom wilayah yang terdeteksi dalam dataset.
            </p>
          </Card>

          <Card className="internal-surface border-transparent p-5 shadow-none">
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">Topik</span>
                <span className="font-semibold">{dataset.topic}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">Periode</span>
                <span className="font-semibold">{dataset.metadata.period}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">Walidata</span>
                <span className="font-semibold">{dataset.metadata.walidata}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </InternalShell>
  );
}

