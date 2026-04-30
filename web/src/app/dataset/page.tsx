import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DatasetCard } from "@/components/portal/dataset-card";
import { DatasetDisplayControls } from "@/components/portal/dataset-display-controls";
import { FilterPanel, MobileFilterDrawer } from "@/components/portal/filter-panel";
import { PaginationControls } from "@/components/portal/pagination-controls";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SearchBar } from "@/components/portal/search-bar";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getDatasetFilterOptions,
  getDatasets,
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

  const [datasets, options] = await Promise.all([getDatasets(filters), getDatasetFilterOptions()]);

  const totalItems = datasets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageDatasets = datasets.slice(startIndex, startIndex + pageSize);
  const totalText = `${datasets.length.toLocaleString("id-ID")} dataset terindeks`;

  return (
    <PortalPageShell activeMenu="dataset">
      <section>
        <Card className="relative overflow-hidden rounded-[28px] border-(--color-border) bg-white p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]">
          <div className="grid min-h-70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative z-2 flex flex-col justify-center overflow-hidden bg-[linear-gradient(96deg,#ffffff_0%,#fffefb_44%,#f9f5e9_78%,#f5efdd_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.78)_1px,transparent_0)] [background-size:3px_3px]"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <Badge
                  variant="outline"
                  className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary) shadow-none"
                >
                  PORTAL SATU DATA
                </Badge>
                <h1 className="mt-3 font-(family-name:--font-heading) text-4xl font-semibold leading-[0.98] tracking-tight text-(--color-text) sm:text-5xl lg:text-6xl">
                  Katalog Dataset
                </h1>
                <p className="mb-0 mt-4 max-w-2xl text-base leading-relaxed text-[#5f5957] sm:text-[1.05rem]">
                  Kumpulan dataset resmi Kabupaten Bulungan yang dapat diakses dengan mudah untukmendukung layanan publik, inovasi daerah, perencanaan pembangunan, serta pengambilan keputusan berbasis data.
                </p>
              </div>
            </div>

            <aside className="relative min-h-55 overflow-hidden border-t border-(--color-border) bg-[#f7f5ef] lg:min-h-70 lg:border-t-0">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(128deg,#f6f3ea_0%,#f2eee4_26%,#ebedf2_58%,#e3ebf8_79%,#dce7f7_100%)]" />
                <div
                  className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:3px_3px]"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-[clamp(26px,4.2vw,72px)] bg-[linear-gradient(90deg,rgba(245,239,221,0.72)_0%,rgba(245,239,221,0.38)_45%,rgba(245,239,221,0)_100%)]"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-y-0 right-[-12%] w-[56%] opacity-[0.2]"
                  aria-hidden="true"
                  style={{
                    backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-optimized.webp')",
                    backgroundRepeat: "repeat",
                    backgroundPosition: "center top",
                    backgroundSize: "280px auto",
                  }}
                />
              </div>

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
            </aside>
          </div>
        </Card>
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
            <div className="mt-4 rounded-2xl border border-dashed border-[#c9ced8] bg-[#f8fbff] p-5">
              <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold">
                Tidak ada dataset yang cocok
              </h3>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Coba ubah kata kunci atau reset filter untuk melihat daftar dataset lainnya.
              </p>
              <Button asChild variant="secondary" className="mt-4 rounded-lg">
                <Link href="/dataset">Reset Filter</Link>
              </Button>
            </div>
          )}
        </Card>
      </section>
    </PortalPageShell>
  );
}
