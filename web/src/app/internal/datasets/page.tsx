import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalDatasetsPage() {
  const session = await requireInternalSession("datasets");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session);

  const draftCount = datasets.filter((item) => item.status === "Draft").length;
  const publishedCount = datasets.filter((item) => item.status === "Published").length;
  const reviewCount = datasets.filter((item) => item.status === "Submitted" || item.status === "Need Revision").length;

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title="Dataset Internal"
        description="Kelola daftar dataset lintas OPD, buka form detail, dan pastikan setiap entri siap diproses pada workflow internal."
        badges={
          <>
            <Badge variant="outline">{formatCompactNumber(datasets.length)} dataset</Badge>
            <Badge variant="outline">{draftCount} draft</Badge>
            <Badge variant="outline">{publishedCount} publish</Badge>
          </>
        }
        actions={
          <Button asChild className="rounded-full px-5">
            <Link href="/internal/datasets/new">Tambah Dataset</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Draft</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{draftCount}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Perlu Tindak Lanjut</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{reviewCount}</p>
        </Card>
        <Card className="p-5">
          <p className="m-0 text-sm font-semibold text-[var(--color-muted)]">Sudah Publish</p>
          <p className="mb-0 mt-3 text-4xl font-semibold">{publishedCount}</p>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="m-0 text-xl font-semibold">Daftar Dataset</h2>
            <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">
              Seluruh aksi edit memanfaatkan shared local store yang sama dengan halaman publik.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Dataset</th>
                <th className="px-5 py-3 font-semibold">OPD</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Metadata</th>
                <th className="px-5 py-3 font-semibold">Update</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.slug} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-4">
                    <Link href={`/internal/datasets/${dataset.slug}`} className="font-semibold hover:text-[var(--color-primary)]">
                      {dataset.title}
                    </Link>
                    <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{dataset.topic}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{dataset.organization}</td>
                  <td className="px-5 py-4">
                    <InternalStatusBadge status={dataset.status} />
                  </td>
                  <td className="px-5 py-4 font-semibold">{dataset.metadataScore}%</td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{formatIndonesianDate(dataset.lastUpdated)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="secondary" size="sm" className="rounded-full">
                        <Link href={`/internal/datasets/${dataset.slug}`}>Form</Link>
                      </Button>
                      {dataset.status === "Published" ? (
                        <Button asChild variant="secondary" size="sm" className="rounded-full">
                          <Link href={`/dataset/${dataset.slug}`}>Publik</Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </InternalShell>
  );
}
