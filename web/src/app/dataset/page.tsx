import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DatasetCard } from "@/components/portal/dataset-card";
import { DatasetDisplayControls } from "@/components/portal/dataset-display-controls";
import { FilterPanel, MobileFilterDrawer } from "@/components/portal/filter-panel";
import { PaginationControls } from "@/components/portal/pagination-controls";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SearchBar } from "@/components/portal/search-bar";
import { SectionHeading } from "@/components/portal/section-heading";
import { ArrowRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getPublicDatasetFilterOptions,
  getPublicDatasets,
  normalizeDatasetFilters,
  normalizePositiveInteger,
} from "@/lib/services/dataset-service";
import type { DatasetFilters } from "@/lib/types/dataset";
import { buildPageMetadata } from "@/lib/utils/metadata";

type DatasetPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Katalog Dataset",
  description:
    "Telusuri katalog dataset resmi Kabupaten Bulungan dengan pencarian, filter topik, organisasi, dan tahun pembaruan.",
  path: "/dataset",
  keywords: ["katalog dataset", "dataset Kabupaten Bulungan", "open data", "data OPD Bulungan"],
});

export const dynamic = "force-dynamic";

export default async function DatasetPage({ searchParams }: DatasetPageProps) {
  const rawParams = await searchParams;
  const normalizedFilters = normalizeDatasetFilters(rawParams);
  const filters: DatasetFilters = {
    ...normalizedFilters,
    format: undefined,
    frequency: undefined,
    status: undefined,
    tag: undefined,
  };
  const pageSize = normalizePositiveInteger(rawParams.pageSize, 10, [5, 10, 25]);
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const [datasets, options] = await Promise.all([
    getPublicDatasets(filters),
    getPublicDatasetFilterOptions({ q: filters.q }),
  ]);

  const totalItems = datasets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageDatasets = datasets.slice(startIndex, startIndex + pageSize);
  const totalText = `${datasets.length.toLocaleString("id-ID")} dataset terindeks`;

  return (
    <PortalPageShell activeMenu="dataset">
      <section>
        <PortalHeroCard
          eyebrow="PORTAL SATU DATA"
          title={
            <>
              Katalog <span className="text-(--color-primary)">Dataset</span>
            </>
          }
          description="Kumpulan dataset resmi Kabupaten Bulungan yang dapat diakses dengan mudah untuk mendukung layanan publik, inovasi daerah, perencanaan pembangunan, serta pengambilan keputusan berbasis data."
          decoration={
            <>
              <div className="absolute left-4 top-4 z-10 rounded-2xl border border-[#d5dbe7] bg-white/95 px-4 py-2 shadow-[0_12px_24px_rgba(33,41,52,0.12)] sm:left-6 sm:top-6">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                  DATA TERINDEKS
                </p>
                <p className="m-0 mt-1 font-(family-name:--font-heading) text-2xl font-semibold text-(--color-text) sm:text-[1.75rem]">
                  {totalText}
                </p>
              </div>

              <Image
                src="/assets/brand/landmarks/tugu-lemlai-suri.png"
                alt="Tugu Lemlai Suri sebagai aksen budaya"
                width={372}
                height={693}
                sizes="(min-width: 1280px) 21rem, (min-width: 1024px) 18rem, (min-width: 640px) 15rem, 12.75rem"
                className="absolute bottom-0 right-[clamp(0.9rem,1.4vw,1.4rem)] z-2 h-auto w-[clamp(12.75rem,22.5vw,21rem)] drop-shadow-[0_14px_28px_rgba(40,46,56,0.22)]"
              />
            </>
          }
        />
      </section>

      <SearchBar
        action="/dataset"
        defaultValue={filters.q}
        placeholder="Cari dataset, indikator, organisasi, atau kata kunci..."
        hiddenValues={{
          topic: filters.topic,
          organization: filters.organization,
          year: filters.year,
          sort: filters.sort,
          pageSize: `${pageSize}`,
        }}
      />

      <MobileFilterDrawer options={options} activeFilters={filters} pageSize={pageSize} />

      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <FilterPanel options={options} activeFilters={filters} pageSize={pageSize} />

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeading
              title="Semua Dataset"
              description={`Menampilkan ${pageDatasets.length} dari ${totalItems.toLocaleString("id-ID")} dataset (halaman ${currentPage} dari ${totalPages}).`}
              className="min-w-0"
              titleClassName="text-2xl sm:text-3xl"
              descriptionClassName="text-sm sm:text-base"
            />

            <DatasetDisplayControls filters={filters} pageSize={pageSize} />
          </div>

          {pageDatasets.length > 0 ? (
            <>
              <div className="mt-4 grid gap-3">
                {pageDatasets.map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} />
                ))}
              </div>

              <PaginationControls
                totalItems={totalItems}
                currentPage={currentPage}
                pageSize={pageSize}
                baseFilters={filters}
              />
            </>
          ) : (
            <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center rounded-[32px] border border-dashed border-[#d1d9e6] bg-[#f9fbff] px-6 py-10 text-center sm:py-12">
              <div className="mt-0">
                <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-bold text-[#2d2826] sm:text-3xl">
                  Tidak ada dataset yang cocok
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#5f5957] sm:text-base">
                  {filters.q ? (
                    <>
                      Pencarian untuk <span className="font-bold text-[#2d2826]">"{filters.q}"</span> tidak membuahkan hasil.
                    </>
                  ) : (
                    "Kami tidak dapat menemukan dataset yang sesuai dengan kombinasi filter Anda saat ini."
                  )}
                  {" "}Silakan coba ubah kata kunci atau hapus beberapa filter untuk melihat daftar dataset lainnya.
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Button asChild className="h-12 rounded-2xl bg-(--color-primary) px-8 font-bold text-white shadow-lg shadow-(--color-primary)/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Link href="/dataset">Reset Semua Filter</Link>
                </Button>
                <Button asChild variant="ghost" className="h-12 rounded-2xl px-6 font-bold text-[#5f5957] hover:bg-slate-100/50">
                  <Link href="/layanan/permintaan-data" className="flex items-center gap-2">
                    Belum menemukan data? Ajukan Permintaan
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </PortalPageShell>
  );
}
