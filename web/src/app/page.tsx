import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Database,
  Image as ImageIcon,
  LayoutGrid,
  Users,
} from "lucide-react";
import { HeroSection } from "@/components/portal/hero-section";
import { IntegrationBanner } from "@/components/portal/integration-banner";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { PortalStatsCards } from "@/components/portal/portal-stats";
import { SearchBar } from "@/components/portal/search-bar";
import { TopicCarousel } from "@/components/portal/topic-carousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { homepageTopics, matchesHomepageTopic } from "@/lib/data/homepage-topics";
import { getDatasets } from "@/lib/services/dataset-service";
import { getInfografisApiPayload } from "@/lib/services/infografis-service";
import { loadKabarDataItems } from "@/lib/services/news-service";
import type { Dataset } from "@/lib/types/dataset";
import { formatCompactNumber, formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { buildDatasetQuery } from "@/lib/utils/query";

export const metadata: Metadata = buildPageMetadata({
  title: "Beranda | Satu Data Bulungan",
  description:
    "Akses portal resmi Satu Data Bulungan untuk menemukan dataset prioritas, statistik data, dan layanan API publik.",
  path: "/",
  keywords: ["Satu Data Bulungan", "dataset Bulungan", "data terbuka Bulungan", "portal data Bulungan"],
});

export const dynamic = "force-dynamic";

function countDatasetsForHomepageTopic(
  datasets: Dataset[],
  definition: (typeof homepageTopics)[number],
) {
  return datasets.filter((dataset) => matchesHomepageTopic(dataset, definition)).length;
}

function buildHomepageTopicHref(definition: (typeof homepageTopics)[number]) {
  if (definition.filterTopic) {
    return `/dataset${buildDatasetQuery({ topic: definition.filterTopic, sort: "terbaru" })}`;
  }

  return `/dataset${buildDatasetQuery({ q: definition.searchTerm ?? definition.label, sort: "terbaru" })}`;
}

export default async function Home() {
  const [datasets, kabarDataItems, infografisPayload] = await Promise.all([
    getDatasets({ sort: "terbaru" }),
    loadKabarDataItems(3),
    getInfografisApiPayload({
      page: 1,
      limit: 6,
      source: "auto",
    }).catch(() => ({
      success: true as const,
      data: [],
      meta: {
        page: 1,
        limit: 6,
        total: 0,
        hasNextPage: false,
        sourceUsed: "html_scrape" as const,
        externalSource: "https://diskominfo.bulungan.go.id/wp/infografis/",
      },
    })),
  ]);

  const totalTopicCount = homepageTopics.length;
  const totalVisitorCount = datasets.reduce((total, dataset) => total + dataset.viewCount, 0);
  const organizationCount = new Set(datasets.map((dataset) => dataset.organization)).size;

  const latestInfografis = infografisPayload.data;
  const totalInfografis = infografisPayload.meta.total;

  const topicItems = homepageTopics.map((item) => ({
    label: item.label,
    datasetCount: countDatasetsForHomepageTopic(datasets, item),
    href: buildHomepageTopicHref(item),
    iconKey: item.iconKey,
    accentColor: item.accentColor,
  }));

  const portalStatItems = [
    {
      label: "Total Dataset",
      value: formatCompactNumber(datasets.length),
      icon: Database,
      accentColor: "#bf3a3a",
      surfaceClassName: "bg-gradient-to-br from-[#fff8f6] via-white to-[#fff4f1]",
    },
    {
      label: "Total Topik",
      value: formatCompactNumber(totalTopicCount),
      icon: LayoutGrid,
      accentColor: "#3a6ebe",
      surfaceClassName: "bg-gradient-to-br from-[#f5f8ff] via-white to-[#eff4ff]",
    },
    {
      label: "Total Organisasi",
      value: formatCompactNumber(organizationCount),
      icon: Building2,
      accentColor: "#d5852d",
      surfaceClassName: "bg-gradient-to-br from-[#fff9f2] via-white to-[#fff4ea]",
    },
    {
      label: "Total Infografis",
      value: formatCompactNumber(totalInfografis),
      icon: ImageIcon,
      accentColor: "#31946a",
      surfaceClassName: "bg-gradient-to-br from-[#f3fbf7] via-white to-[#edf8f2]",
    },
    {
      label: "Total Pengunjung",
      value: formatCompactNumber(totalVisitorCount),
      icon: Users,
      accentColor: "#7555ad",
      surfaceClassName: "bg-gradient-to-br from-[#f8f5ff] via-white to-[#f3eeff]",
    },
  ];

  const beritaIndexHref = "/publikasi#berita";

  return (
    <PortalPageShell activeMenu="beranda">
      <HeroSection
        eyebrow="PORTAL SATU DATA"
        title="SATU DATA BULUNGAN"
        description="Portal resmi Pemerintah Kabupaten Bulungan untuk menyediakan data sektoral yang akurat, mutakhir, terpadu, dan dapat dipertanggungjawabkan sebagai dasar perencanaan, evaluasi, dan layanan publik."
        slogan="Merudung Pebatun de Benuanta"
        highlights={["Akurat", "Mutakhir", "Terpadu", "Akuntabel"]}
        actionHref="/dataset"
        actionLabel="Jelajahi Dataset"
        secondaryHref="/api"
        secondaryLabel="Akses API"
      />

      <SearchBar
        action="/dataset"
        placeholder="Cari dataset, indikator, organisasi, atau kata kunci..."
        className="-mt-1"
      />

      <PortalStatsCards items={portalStatItems} />

      <section aria-hidden="true" className="-mt-1">
        <div className="h-px bg-linear-to-r from-transparent via-[#ead79a] to-transparent" />
      </section>

      <TopicCarousel
        title="Topik Satu Data"
        description="Jelajahi dataset berdasarkan topik untuk memudahkan pencarian, pengelompokan, dan pemanfaatan data sesuai sektor."
        items={topicItems}
      />

      <section className="rounded-[28px] bg-[#f1f4f8] p-4 sm:p-6 xl:p-8" aria-label="Berita Satu Data">
        <div className="grid gap-5 xl:grid-cols-[clamp(280px,27vw,420px)_minmax(0,1fr)] xl:items-stretch">
          <div className="flex h-full flex-col justify-center gap-4 p-3 text-left sm:p-4">
            <div className="w-full">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-4xl">
                Berita Satu Data
              </h2>
              <div className="mt-3 h-1.5 w-19 rounded-full bg-(--color-primary)" />
              <p className="mb-0 mt-4 text-base leading-relaxed text-(--color-muted)">
                Informasi terbaru seputar pemutakhiran dataset, tata kelola data, kegiatan statistik sektoral, dan
                pemanfaatan data untuk pengambilan keputusan.
              </p>
            </div>

            <Button asChild size="lg" className="hidden w-fit gap-2 rounded-2xl px-6 xl:inline-flex">
              <Link href={beritaIndexHref}>
                Lihat Semua Berita
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kabarDataItems.length > 0 ? (
              kabarDataItems.map((item) => {
                return (
                  <Card
                    key={item.title}
                    className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e5eaf1] bg-white p-0 shadow-[0_12px_28px_rgba(29,40,57,0.08)]"
                  >
                    <Link href={item.href} target="_blank" rel="noreferrer" className="block">
                      <div className="relative h-48 sm:h-52">
                        <Image
                          src={item.imageSrc}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                        />
                      </div>
                    </Link>

                    <div className="flex h-full flex-col p-5 sm:p-6">
                      <div className="mb-4 h-1 w-10 rounded-full bg-[#d9272e]" />
                      <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-2xl font-semibold leading-tight tracking-tight text-(--color-text)">
                        <Link
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-[#ab171e]"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mb-0 mt-3 line-clamp-2 text-base leading-relaxed text-(--color-muted)">
                        {item.description}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-medium text-(--color-muted)">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" />
                          {formatIndonesianDate(item.date)}
                        </span>
                        <span className="text-(--color-border)">|</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-4" />
                          {item.organization}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="rounded-3xl border-dashed border-(--color-border) bg-white/70 p-6 md:col-span-2 xl:col-span-3">
                <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold text-(--color-text)">
                  Berita terbaru belum tersedia
                </h3>
                <p className="mb-0 mt-2 text-sm leading-relaxed text-(--color-muted) sm:text-base">
                  Konten berita akan ditampilkan kembali setelah sumber publikasi tersedia.
                </p>
              </Card>
            )}
          </div>

          <div className="flex justify-center xl:hidden">
            <Button asChild size="lg" className="w-fit gap-2 rounded-2xl px-5">
              <Link href={beritaIndexHref}>
                Lihat Semua Berita
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-[#f1f4f8] p-4 sm:p-6 xl:p-8" aria-label="Infografis Satu Data">
        <div className="mb-5 text-center md:mb-6">
          <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-4xl">
            Infografis Satu Data
          </h2>
          <div className="mx-auto mt-3 h-1.5 w-19 rounded-full bg-(--color-primary)" />
          <p className="mb-0 mt-4 w-full max-w-none text-base leading-relaxed text-(--color-muted)">
            Visualisasi data dan informasi ringkas untuk membantu masyarakat memahami capaian, perkembangan, dan isu
            strategis daerah.
          </p>
        </div>

        <div className="w-full">
          {latestInfografis.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {latestInfografis.slice(0, 4).map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-(--color-border) bg-white p-3 shadow-[0_12px_26px_rgba(29,40,57,0.08)]"
                >
                  <Link href={item.postUrl} target="_blank" rel="noreferrer" className="block">
                    <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-[#eff3f8]">
                      <Image
                        src={item.imageOriginalUrl ?? item.imageUrl}
                        alt={item.alt || item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 25vw"
                      />
                    </div>
                  </Link>

                  <h3 className="m-0 mt-3 line-clamp-2 font-(family-name:--font-heading) text-2xl font-semibold leading-tight text-(--color-text)">
                    {item.title}
                  </h3>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-(--color-border) bg-[#f8fbff] p-5">
              <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold text-(--color-text)">
                Belum ada infografis terbaru
              </h3>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Data infografis akan tampil otomatis saat sumber DKIP Bulungan tersedia.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="w-fit gap-2 rounded-full px-6">
            <Link href="/publikasi/infografis">
              Lihat Semua Infografis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <IntegrationBanner />
    </PortalPageShell>
  );
}
