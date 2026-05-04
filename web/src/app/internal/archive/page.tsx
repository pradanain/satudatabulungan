import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalArchivePage() {
  const session = await requireInternalSession("archive");
  const store = await loadInternalPortalStore();
  const archived = getScopedDatasets(store, session).filter((item) => item.status === "Archived");

  return (
    <InternalShell session={session} activeKey="archive">
      <InternalPageHeader
        title="Arsip Dataset"
        description="Lihat dataset yang sudah diarsipkan beserta alasan arsip agar jejak perubahan tetap terdokumentasi."
        badges={<Badge variant="outline">{archived.length} dataset arsip</Badge>}
      />

      <Card className="internal-surface overflow-hidden border-transparent shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Dataset</th>
                <th className="px-5 py-3 font-semibold">OPD</th>
                <th className="px-5 py-3 font-semibold">Tanggal Arsip</th>
                <th className="px-5 py-3 font-semibold">Alasan</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((dataset) => (
                <tr key={dataset.slug} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-4">
                    <Link href={`/internal/datasets/${dataset.slug}`} className="font-semibold hover:text-[var(--color-primary)]">
                      {dataset.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{dataset.organization}</td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">
                    {dataset.archivedAt ? formatIndonesianDate(dataset.archivedAt) : "-"}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">
                    {dataset.archiveReason ?? "Dataset digantikan seri terbaru."}
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


