import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database, FileText, Megaphone } from "lucide-react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { PreviewPanel } from "@/components/portal/preview-panel";
import { ResourceList } from "@/components/portal/resource-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDatasetBySlug, getDatasets } from "@/lib/services/dataset-service";
import type { Dataset } from "@/lib/types/dataset";
import { getPrimaryDatasetDescription } from "@/lib/utils/dataset-description";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";

type DatasetDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type ActivityType = "metadata" | "resource" | "publication";

type ActivityItem = {
  date: string;
  title: string;
  description: string;
  type: ActivityType;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: DatasetDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDatasetBySlug(slug);

  if (!dataset) {
    return buildPageMetadata({
      title: "Dataset Tidak Ditemukan",
      description: "Dataset yang Anda cari tidak tersedia atau sudah tidak dipublikasikan.",
      path: `/dataset/${slug}`,
      keywords: ["dataset", "Satu Data Bulungan"],
    });
  }

  return buildPageMetadata({
    title: dataset.title,
    description: dataset.summary,
    path: `/dataset/${dataset.slug}`,
    keywords: [
      dataset.topic,
      dataset.organization,
      ...dataset.metadata.tags,
      "dataset Bulungan",
      "Satu Data Bulungan",
    ],
  });
}

function buildActivityItems(dataset: Dataset): ActivityItem[] {
  const resourceWithDate = dataset.resources.find((resource) => resource.lastUpdated);
  const resourceDate = resourceWithDate?.lastUpdated ?? dataset.lastUpdated;

  const items: ActivityItem[] = [
    {
      date: dataset.lastUpdated,
      title: "Metadata diperbarui",
      description: "Perubahan deskripsi, klasifikasi, dan informasi utama dataset telah dipublikasikan.",
      type: "metadata",
    },
    {
      date: resourceDate,
      title: "Sumber data diperbarui",
      description: "File data terbaru dan endpoint akses diperiksa agar tetap siap unduh.",
      type: "resource",
    },
    {
      date: dataset.lastUpdated,
      title: "Informasi umum dipublikasikan",
      description: `Dataset tersedia untuk topik ${dataset.topic} oleh ${dataset.organization}.`,
      type: "publication",
    },
  ];

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function formatRelativeActivityDate(value: string): string {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return value;
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - target.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);

  if (days < 1) return "hari ini";
  if (days < 7) return `${days} hari yang lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu yang lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan yang lalu`;

  return `${Math.floor(days / 365)} tahun yang lalu`;
}

function dedupeDatasets(items: Dataset[]): Dataset[] {
  const map = new Map<string, Dataset>();
  for (const item of items) {
    map.set(item.slug, item);
  }
  return [...map.values()];
}

function inferDatasetUnit(dataset: Dataset): string {
  const context = `${dataset.title} ${dataset.summary} ${dataset.description} ${dataset.metadata.tags.join(" ")}`.toLowerCase();

  if (context.includes("penduduk") || context.includes("populasi") || context.includes("demografi")) {
    return "Jiwa";
  }
  if (context.includes("persen") || context.includes("rasio") || context.includes("indeks")) {
    return "Persen (%)";
  }
  if (context.includes("luas") || context.includes("wilayah")) {
    return "Kilometer persegi (km²)";
  }
  if (context.includes("anggaran") || context.includes("belanja") || context.includes("rupiah")) {
    return "Rupiah (Rp)";
  }
  if (context.includes("produksi") || context.includes("panen")) {
    return "Ton";
  }

  return "Sesuai metadata sumber";
}

function getActivityVisual(type: ActivityType) {
  if (type === "metadata") {
    return {
      icon: FileText,
      dotClassName: "bg-[#6280db] text-white shadow-[0_6px_14px_rgba(47,102,210,0.35)]",
      badgeClassName: "bg-[#eef2ff] text-[#4b5fb8]",
      badgeLabel: "Metadata",
    };
  }

  if (type === "resource") {
    return {
      icon: Database,
      dotClassName: "bg-[#2f9e62] text-white shadow-[0_6px_14px_rgba(35,133,80,0.35)]",
      badgeClassName: "bg-[#e8f7ef] text-[#1f7a48]",
      badgeLabel: "Sumber Data",
    };
  }

  return {
    icon: Megaphone,
    dotClassName: "bg-[#d9892d] text-white shadow-[0_6px_14px_rgba(185,109,26,0.35)]",
    badgeClassName: "bg-[#fff3e7] text-[#a25514]",
    badgeLabel: "Publikasi",
  };
}

export default async function DatasetDetailPage({ params }: DatasetDetailPageProps) {
  const { slug } = await params;
  const dataset = await getDatasetBySlug(slug);

  if (!dataset) {
    notFound();
  }

  const allDatasets = await getDatasets();
  const topicRelated = allDatasets.filter((item) => item.slug !== dataset.slug && item.topic === dataset.topic);
  const explicitRelated = allDatasets.filter((item) => dataset.relatedSlugs.includes(item.slug));
  const similarDatasets = dedupeDatasets([...explicitRelated, ...topicRelated]).slice(0, 6);
  const activityItems = buildActivityItems(dataset);
  const ukuran = [...new Set(dataset.resources.map((resource) => resource.sizeLabel).filter(Boolean))].join(" | ");
  const displayOrganization = dataset.organization;
  const definitionText = getPrimaryDatasetDescription(dataset.description);
  const unitLabel = inferDatasetUnit(dataset);

  const metadataMinimum = [
    { label: "Nama Data", value: dataset.title },
    { label: "Organisasi", value: displayOrganization },
    { label: "Definisi", value: definitionText },
    { label: "Ukuran", value: ukuran || "Belum tersedia" },
    { label: "Satuan", value: unitLabel },
    {
      label: "Klasifikasi",
      value: `${dataset.topic}${dataset.metadata.tags.length ? ` • ${dataset.metadata.tags.join(", ")}` : ""}`,
    },
  ];

  return (
    <PortalPageShell activeMenu="dataset" mainClassName="gap-5">
      <section>
        <Card className="overflow-hidden border-(--color-border) p-0">
          <div className="grid gap-4 bg-[linear-gradient(110deg,#ffffff_0%,#fffdfa_52%,#f3f6fb_100%)] p-5 sm:p-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="m-0 flex flex-wrap gap-2 text-sm text-[#6e6765]">
                <Link href="/" className="hover:text-(--color-primary)">
                  Beranda
                </Link>
                <span>&gt;</span>
                <Link href="/dataset" className="hover:text-(--color-primary)">
                  Dataset
                </Link>
                <span>&gt;</span>
                <span>{dataset.topic}</span>
              </p>
              <Badge variant="blue" className="mt-3">
                {dataset.topic}
              </Badge>
              <h1 className="mb-0 mt-3 font-(family-name:--font-heading) text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
                {dataset.title}
              </h1>
              <p className="mb-0 mt-3 text-sm leading-relaxed text-[#625c5a] sm:text-lg">{definitionText}</p>

            </div>

            <aside className="relative overflow-hidden rounded-2xl border border-[#d7dcc5] bg-linear-to-br from-[#f8f4e8] to-[#f0f4fb] p-5">
              <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
                <div className="grid place-items-center rounded-xl border border-[#d8dcc9] bg-white/70 p-3">
                  <Image
                    src="/assets/brand/logos/lambang-bulungan.png"
                    alt="Lambang Kabupaten Bulungan"
                    width={74}
                    height={84}
                    className="h-auto w-auto"
                  />
                </div>
                <div>
                  <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-(--color-text)">
                    Informasi Dataset
                  </h2>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-[#6c6564]">Frekuensi</dt>
                      <dd className="m-0 font-semibold">{dataset.frequency}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-[#6c6564]">Format</dt>
                      <dd className="m-0 font-semibold">{dataset.formats.join(" | ")}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-[#6c6564]">Pembaruan</dt>
                      <dd className="m-0 font-semibold">{formatIndonesianDate(dataset.lastUpdated)}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-[#6c6564]">Organisasi</dt>
                      <dd className="m-0 font-semibold">{displayOrganization}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </Card>
      </section>

      <section>
        <Tabs defaultValue="resource">
          <TabsList className="w-full rounded-2xl border-[#d6ddeb] bg-[linear-gradient(180deg,#f7faff_0%,#f2f6fc_100%)] p-2.5">
            <TabsTrigger value="resource" className="rounded-xl py-2.5 text-sm font-bold">Sumber Data</TabsTrigger>
            <TabsTrigger value="metadata" className="rounded-xl py-2.5 text-sm font-bold">Metadata</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl py-2.5 text-sm font-bold">Aktivitas</TabsTrigger>
            <TabsTrigger value="similar" className="rounded-xl py-2.5 text-sm font-bold">Data Serupa</TabsTrigger>
          </TabsList>

          <TabsContent value="resource" className="grid gap-4 pt-1">
            <ResourceList resources={dataset.resources} />
            <PreviewPanel preview={dataset.preview} />
          </TabsContent>

          <TabsContent value="metadata">
            <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold">Metadata</h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Informasi terstruktur untuk memudahkan pemahaman atau penggunaan dataset.
              </p>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce3ef] bg-white">
                <table className="w-full min-w-140 border-collapse text-sm">
                  <tbody>
                    {metadataMinimum.map((item, index) => (
                      <tr key={item.label} className={index % 2 === 0 ? "bg-[#f9fbff]" : "bg-white"}>
                        <th className="w-55 border-b border-[#e2e8f3] px-4 py-3 text-left text-sm font-semibold text-[#5f5856]">
                          {item.label}
                        </th>
                        <td className="border-b border-[#e2e8f3] px-4 py-3 text-[#2f2a28]">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold">Aktivitas</h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Riwayat pembaruan terkait dataset ini.
              </p>

              <div className="mt-5 rounded-2xl border border-[#d7ddeb] bg-white p-4 shadow-[0_10px_22px_rgba(40,52,82,0.05)] sm:p-5">
                <div className="relative grid gap-4">
                  <div
                    className="pointer-events-none absolute bottom-5 left-4.5 top-5 border-l-2 border-dashed border-[#d7deec]"
                    aria-hidden="true"
                  />
                  {activityItems.map((activity, index) => {
                    const visual = getActivityVisual(activity.type);
                    const Icon = visual.icon;

                    return (
                      <article key={`${activity.title}-${index}`} className="relative grid grid-cols-[auto_1fr] items-start gap-4">
                        <div className={`relative z-1 grid h-9 w-9 place-items-center rounded-full ${visual.dotClassName}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="grid gap-1 rounded-xl border border-[#e3e8f2] bg-[#fbfdff] px-4 py-3">
                          <p className="m-0 text-[13px] leading-relaxed text-[#26211f]">
                            <span className="font-medium text-[#44403e]">memperbarui dataset </span>
                            <Link href={`/dataset/${dataset.slug}`} className="text-[#3869d9] underline underline-offset-2">
                              {dataset.title}
                            </Link>
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${visual.badgeClassName}`}>
                              {visual.badgeLabel}
                            </span>
                            <span className="text-sm text-(--color-muted)">{formatRelativeActivityDate(activity.date)}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="similar">
            <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold">Data Serupa</h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Dataset dengan topik yang sama atau relasi langsung untuk eksplorasi lanjutan.
              </p>
              {similarDatasets.length ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {similarDatasets.map((related) => (
                    <article key={related.id} className="rounded-2xl border border-[#d7ddeb] bg-white p-4 shadow-[0_8px_20px_rgba(36,52,82,0.05)]">
                      <p className="m-0 text-xs font-semibold uppercase tracking-widest text-[#817977]">{related.topic}</p>
                      <h3 className="mb-0 mt-1 font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-(--color-text)">
                        {related.title}
                      </h3>
                      <p className="mb-0 mt-1 line-clamp-2 text-sm text-(--color-muted)">{related.summary}</p>
                      <div className="mt-3">
                        <Button asChild variant="secondary" size="sm" className="rounded-full">
                          <Link href={`/dataset/${related.slug}`}>Lihat Dataset</Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-0 mt-4 text-sm text-(--color-muted)">
                  Belum ada data serupa yang dipublikasikan untuk topik ini.
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </PortalPageShell>
  );
}
