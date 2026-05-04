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
            <Badge variant="outline">Metadata {dataset.metadataScore}%</Badge>
            <Badge variant="outline">Quality {dataset.qualityScore}%</Badge>
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
    </InternalShell>
  );
}

