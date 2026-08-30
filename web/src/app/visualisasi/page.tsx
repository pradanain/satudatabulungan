import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { getDatasets } from "@/lib/services/dataset-service";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Visualisasi Data",
  description:
    "Jelajahi visualisasi indikator prioritas Kabupaten Bulungan untuk mempercepat pemahaman tren data lintas sektor.",
  path: "/visualisasi",
  keywords: ["visualisasi data", "indikator Bulungan", "grafik statistik", "Satu Data Bulungan"],
});

export const dynamic = "force-dynamic";

export default async function VisualisasiPage() {
  const datasets = await getDatasets({ sort: "populer" });
  const highlights = datasets.slice(0, 6);

  return (
    <PortalPageShell activeMenu="visualisasi">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Visualisasi Data"
            description="Ringkasan visual indikator prioritas untuk membantu masyarakat, peneliti, dan OPD membaca tren dengan cepat."
          />
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {highlights.map((dataset) => (
          <Card key={dataset.id} className="flex h-full flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-xl font-semibold leading-tight">
                {dataset.title}
              </h2>
              <Badge variant="secondary">{dataset.formats.join(", ")}</Badge>
            </div>
            <p className="m-0 text-sm text-[var(--color-muted)]">
              Topik {dataset.topic} • Update {formatIndonesianDate(dataset.lastUpdated)}
            </p>
            <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">{dataset.summary}</p>
            <Button asChild variant="secondary" className="mt-auto w-fit rounded-lg">
              <Link href={`/dataset/${dataset.slug}`}>Buka Visualisasi Dataset</Link>
            </Button>
          </Card>
        ))}
      </section>
    </PortalPageShell>
  );
}
