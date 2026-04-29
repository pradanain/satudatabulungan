import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MetadataSection } from "@/components/portal/metadata-section";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { PreviewPanel } from "@/components/portal/preview-panel";
import { ResourceList } from "@/components/portal/resource-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDatasetBySlug, getDatasets } from "@/lib/services/dataset-service";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { selectApiResource, selectDownloadResource } from "@/lib/utils/resource-links";

type DatasetDetailPageProps = {
  params: Promise<{ slug: string }>;
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

export default async function DatasetDetailPage({ params }: DatasetDetailPageProps) {
  const { slug } = await params;
  const dataset = await getDatasetBySlug(slug);

  if (!dataset) {
    notFound();
  }

  const relatedDatasets = (await getDatasets({ topic: dataset.topic }))
    .filter((item) => item.slug !== dataset.slug)
    .slice(0, 3);
  const downloadResource = selectDownloadResource(dataset.resources);
  const apiResource = selectApiResource(dataset.resources);

  return (
    <PortalPageShell activeMenu="dataset" mainClassName="gap-5">
      <section>
        <Card className="grid gap-4 border-[var(--color-border)] p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="m-0 flex flex-wrap gap-2 text-sm text-[#6e6765]">
              <Link href="/" className="hover:text-[var(--color-primary)]">
                Beranda
              </Link>
              <span>&gt;</span>
              <Link href="/dataset" className="hover:text-[var(--color-primary)]">
                Dataset
              </Link>
              <span>&gt;</span>
              <span>{dataset.topic}</span>
            </p>
            <Badge variant="blue" className="mt-3">
              {dataset.topic}
            </Badge>
            <h1 className="mb-0 mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              {dataset.title}
            </h1>
            <p className="mb-0 mt-3 text-sm leading-relaxed text-[#625c5a] sm:text-lg">{dataset.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {downloadResource ? (
                <Button asChild className="rounded-xl">
                  <a href={downloadResource.url} target="_blank" rel="noreferrer">
                    Unduh Data
                  </a>
                </Button>
              ) : (
                <Button className="rounded-xl" disabled>
                  Unduh Data Belum Tersedia
                </Button>
              )}
              {apiResource ? (
                <Button asChild variant="secondary" className="rounded-xl">
                  <a href={apiResource.url} target="_blank" rel="noreferrer">
                    Gunakan API
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" className="rounded-xl" disabled>
                  API Belum Tersedia
                </Button>
              )}
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/organisasi">Hubungi OPD</Link>
              </Button>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-[#d7dcc5] bg-gradient-to-br from-[#f8f4e8] to-[#f0f4fb] p-5">
            <Image
              src="/assets/brand/logos/lambang-bulungan.png"
              alt="Lambang Kabupaten Bulungan"
              width={54}
              height={62}
              className="h-auto w-auto"
            />
            <h2 className="mb-0 mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight">
              Dataset resmi terhubung
            </h2>
            <p className="mb-0 mt-2 text-sm text-[#6e6865]">Metadata lengkap dan riwayat pembaruan tersedia.</p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                <dt className="font-semibold text-[#6c6564]">Frekuensi</dt>
                <dd className="m-0 font-semibold">{dataset.frequency}</dd>
              </div>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                <dt className="font-semibold text-[#6c6564]">Format</dt>
                <dd className="m-0 font-semibold">{dataset.formats.join(" | ")}</dd>
              </div>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                <dt className="font-semibold text-[#6c6564]">Update</dt>
                <dd className="m-0 font-semibold">{formatIndonesianDate(dataset.lastUpdated)}</dd>
              </div>
            </dl>
            <Image
              src="/assets/brand/landmarks/tugu-lemlai-suri-siluet.png"
              alt="Tugu Lemlai Suri"
              width={88}
              height={130}
              className="absolute bottom-2 right-2 h-auto w-16 opacity-90"
            />
          </aside>
        </Card>
      </section>

      <section>
        <Tabs defaultValue="metadata">
          <TabsList className="w-full">
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="resources">Resource</TabsTrigger>
            <TabsTrigger value="related">Terkait</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata">
            <MetadataSection metadata={dataset.metadata} />
          </TabsContent>
          <TabsContent value="preview">
            <PreviewPanel preview={dataset.preview} />
          </TabsContent>
          <TabsContent value="resources">
            <ResourceList resources={dataset.resources} />
          </TabsContent>
          <TabsContent value="related">
            <Card className="p-5 sm:p-6">
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-3xl font-semibold">Dataset Terkait</h2>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)] sm:text-base">
                Dataset bertopik serupa untuk mempercepat eksplorasi lintas indikator.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {relatedDatasets.map((related) => (
                  <Button key={related.id} asChild variant="secondary" size="sm" className="rounded-full">
                    <Link href={`/dataset/${related.slug}`}>{related.title}</Link>
                  </Button>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </PortalPageShell>
  );
}
