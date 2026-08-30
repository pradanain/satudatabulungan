import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { getDatasets } from "@/lib/services/dataset-service";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";

const metadataChecklist = [
  { field: "Judul", rule: "Wajib, 10-150 karakter" },
  { field: "Identifier/Slug", rule: "Wajib, unik, huruf kecil, angka, tanda hubung" },
  { field: "Deskripsi singkat", rule: "Wajib, 30-500 karakter" },
  { field: "Topik", rule: "Wajib, pilih dari master topik" },
  { field: "Frekuensi pembaruan", rule: "Wajib, referensi resmi" },
  { field: "Tanggal update terakhir", rule: "Tidak boleh melebihi hari ini" },
  { field: "Resource/API", rule: "Minimal satu resource atau endpoint valid" },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Standar Metadata",
  description:
    "Pelajari standar metadata Satu Data Bulungan agar data yang digunakan konsisten, jelas, dan mudah dipertanggungjawabkan.",
  path: "/metadata",
  keywords: ["standar metadata", "kualitas data", "Satu Data Bulungan", "panduan metadata"],
});

export const dynamic = "force-dynamic";

export default async function MetadataPage() {
  const datasets = await getDatasets({ sort: "terbaru" });
  const sample = datasets[0];

  return (
    <PortalPageShell>
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Standar Metadata"
            description="Panduan metadata ini membantu publik memahami struktur informasi dan kualitas data yang dipublikasikan."
          />
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading title="Checklist Metadata Wajib" titleClassName="text-2xl sm:text-3xl" />
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#d6deea] bg-[#f7f9fc]">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#dce3ef] px-3 py-2 text-left font-semibold">Field</th>
                  <th className="border-b border-[#dce3ef] px-3 py-2 text-left font-semibold">Aturan</th>
                </tr>
              </thead>
              <tbody>
                {metadataChecklist.map((item) => (
                  <tr key={item.field}>
                    <td className="border-b border-[#dce3ef] px-3 py-2">{item.field}</td>
                    <td className="border-b border-[#dce3ef] px-3 py-2">{item.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {sample ? (
        <section>
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Contoh Metadata Dataset"
              description={`Contoh dari dataset terbaru: ${sample.title}`}
              titleClassName="text-2xl sm:text-3xl"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">Identifier</h3>
                <p className="mt-1 font-semibold">{sample.metadata.identifier}</p>
              </article>
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">OPD</h3>
                <p className="mt-1 font-semibold">{sample.metadata.opd}</p>
              </article>
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">Walidata</h3>
                <p className="mt-1 font-semibold">{sample.metadata.walidata}</p>
              </article>
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">Frekuensi</h3>
                <p className="mt-1 font-semibold">{sample.metadata.frequency}</p>
              </article>
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">Lisensi</h3>
                <p className="mt-1 font-semibold">{sample.metadata.license}</p>
              </article>
              <article className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3">
                <h3 className="m-0 text-sm text-[#6b6463]">Pembaruan</h3>
                <p className="mt-1 font-semibold">{formatIndonesianDate(sample.metadata.lastUpdated)}</p>
              </article>
            </div>
            <Button asChild variant="secondary" className="mt-4 rounded-lg">
              <Link href={`/dataset/${sample.slug}`}>Buka Halaman Detail Dataset</Link>
            </Button>
          </Card>
        </section>
      ) : null}
    </PortalPageShell>
  );
}
