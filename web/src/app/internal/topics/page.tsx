import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalTopicsPage() {
  const session = await requireInternalSession("topics");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="topics">
      <InternalPageHeader
        title="Topik & Kode Referensi"
        description="Master data topik menjaga konsistensi naming, format yang direkomendasikan, dan steward organisasi pada setiap dataset."
        badges={<Badge variant="outline">{store.topics.length} topik referensi</Badge>}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Topik</th>
                  <th className="px-5 py-3 font-semibold">Kode</th>
                  <th className="px-5 py-3 font-semibold">Format</th>
                  <th className="px-5 py-3 font-semibold">Frekuensi</th>
                </tr>
              </thead>
              <tbody>
                {store.topics.map((topic) => (
                  <tr key={topic.id} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-4">
                      <p className="m-0 font-semibold">{topic.name}</p>
                      <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{topic.description}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold">{topic.code}</td>
                    <td className="px-5 py-4 text-[var(--color-muted)]">{topic.recommendedFormat}</td>
                    <td className="px-5 py-4 text-[var(--color-muted)]">{topic.defaultFrequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="m-0 text-xl font-semibold">Panduan Master Data</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
            <p className="m-0">Gunakan kode topik konsisten untuk menjaga pencarian publik tetap rapi.</p>
            <p className="m-0">Ikuti format dan frekuensi rekomendasi agar validasi metadata lebih cepat.</p>
            <p className="m-0">Steward organisasi bertanggung jawab menjaga definisi topik lintas OPD.</p>
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}
