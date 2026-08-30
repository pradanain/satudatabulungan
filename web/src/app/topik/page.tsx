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
import { buildDatasetQuery } from "@/lib/utils/query";

export const metadata: Metadata = buildPageMetadata({
  title: "Topik Dataset",
  description:
    "Eksplorasi dataset Kabupaten Bulungan berdasarkan topik prioritas untuk mempercepat analisis lintas sektor.",
  path: "/topik",
  keywords: ["topik dataset", "isu prioritas Bulungan", "data sektoral", "Satu Data Bulungan"],
});

export const dynamic = "force-dynamic";

export default async function TopikPage() {
  const datasets = await getDatasets({ sort: "terbaru" });
  const grouped = new Map<
    string,
    {
      count: number;
      latestTitle: string;
      latestDate: string;
      organizations: string[];
    }
  >();

  datasets.forEach((dataset) => {
    const current = grouped.get(dataset.topic);
    const organizations = current?.organizations ?? [];
    if (!organizations.includes(dataset.organization)) {
      organizations.push(dataset.organization);
    }

    if (!current) {
      grouped.set(dataset.topic, {
        count: 1,
        latestTitle: dataset.title,
        latestDate: dataset.lastUpdated,
        organizations,
      });
      return;
    }

    const latestDate =
      new Date(dataset.lastUpdated).getTime() > new Date(current.latestDate).getTime()
        ? dataset.lastUpdated
        : current.latestDate;

    const latestTitle = latestDate === dataset.lastUpdated ? dataset.title : current.latestTitle;

    grouped.set(dataset.topic, {
      count: current.count + 1,
      latestTitle,
      latestDate,
      organizations,
    });
  });

  const topicCards = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <PortalPageShell activeMenu="dataset">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Topik Dataset"
            description="Halaman topik membantu pengguna menelusuri data berdasarkan kelompok isu prioritas Bulungan secara ringkas dan terstruktur."
          />
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {topicCards.map(([topic, data]) => (
          <Card key={topic} className="flex h-full flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight">
                {topic}
              </h2>
              <Badge variant="secondary">{data.count} dataset</Badge>
            </div>

            <p className="m-0 text-sm text-[var(--color-muted)]">
              Update terbaru: {formatIndonesianDate(data.latestDate)}
            </p>
            <p className="m-0 text-sm font-semibold leading-relaxed">{data.latestTitle}</p>

            <div className="flex flex-wrap gap-2">
              {data.organizations.slice(0, 4).map((organization) => (
                <Badge key={organization} variant="outline">
                  {organization}
                </Badge>
              ))}
            </div>

            <Button asChild variant="secondary" className="mt-auto w-fit rounded-lg">
              <Link href={`/dataset${buildDatasetQuery({ topic, sort: "terbaru" })}`}>
                Lihat Semua Dataset Topik Ini
              </Link>
            </Button>
          </Card>
        ))}
      </section>
    </PortalPageShell>
  );
}
