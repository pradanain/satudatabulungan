"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Newspaper,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/portal/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { NewsDisplayControls } from "@/components/portal/news-display-controls";
import { NewsPaginationControls } from "@/components/portal/news-pagination-controls";
import { SearchBar } from "@/components/portal/search-bar";
import type { PortalNewsItem } from "@/lib/services/news-service";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import type { PublicationSort } from "@/lib/utils/query";

export interface PublicationCatalogItem {
  id: string;
  title: string;
  summary: string;
  organization: string;
  lastUpdated: string;
  href: string;
  hrefLabel?: string;
  downloadHref?: string;
  downloadLabel?: string;
  openInNewTab?: boolean;
  imageSrc?: string;
}

interface PublikasiContentProps {
  view: PublicationView;
  basePath: string;
  sort?: PublicationSort;
  searchQuery?: string;
  itemsPerPage?: number;
  currentPage?: number;
  totalItems?: number;
  kabarDataItems?: PortalNewsItem[];
  publicationItems?: PublicationCatalogItem[];
}

export type PublicationView = "berita" | "buku-digital" | "infografis" | "regulasi" | "petunjuk-teknis";

const VIEW_CONFIG: Record<
  PublicationView,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    listTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyCtaHref: string;
    emptyCtaLabel: string;
  }
> = {
  berita: {
    icon: Newspaper,
    title: "Publikasi Berita",
    description:
      "Kumpulan berita dan artikel terbaru seputar kegiatan, rilis data, dan informasi terkini dari Pemerintah Kabupaten Bulungan.",
    listTitle: "Semua Berita Satu Data",
    emptyTitle: "Berita belum tersedia",
    emptyDescription: "Belum ada berita yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi/infografis",
    emptyCtaLabel: "Lihat infografis terbaru",
  },
  "buku-digital": {
    icon: BookOpenText,
    title: "Publikasi Buku Digital",
    description:
      "Dokumen publikasi statistik dalam format elektronik (PDF) yang menyajikan data komprehensif berbagai sektor pembangunan.",
    listTitle: "Semua Buku Digital",
    emptyTitle: "Buku digital belum tersedia",
    emptyDescription: "Belum ada buku digital yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/dataset?sort=terbaru",
    emptyCtaLabel: "Lihat katalog dataset",
  },
  infografis: {
    icon: ImageIcon,
    title: "Publikasi Infografis",
    description:
      "Visualisasi data statistik yang disajikan secara menarik dan mudah dipahami untuk memberikan gambaran cepat fakta daerah.",
    listTitle: "Semua Infografis",
    emptyTitle: "Infografis belum tersedia",
    emptyDescription: "Belum ada infografis yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi-berita",
    emptyCtaLabel: "Lihat publikasi berita",
  },
  regulasi: {
    icon: Scale,
    title: "Publikasi Regulasi",
    description: "Daftar payung hukum dan kebijakan terkait pengelolaan data, statistik sektoral, dan Satu Data Indonesia di tingkat daerah.",
    listTitle: "Semua Regulasi",
    emptyTitle: "Regulasi belum tersedia",
    emptyDescription: "Belum ada regulasi yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi-petunjuk-teknis",
    emptyCtaLabel: "Lihat petunjuk teknis",
  },
  "petunjuk-teknis": {
    icon: FileText,
    title: "Publikasi Petunjuk Teknis",
    description: "Panduan operasional dan standar prosedur teknis untuk produsen data dalam mengelola dan mengunggah data ke portal.",
    listTitle: "Semua Petunjuk Teknis",
    emptyTitle: "Petunjuk teknis belum tersedia",
    emptyDescription: "Belum ada petunjuk teknis yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi-regulasi",
    emptyCtaLabel: "Lihat regulasi",
  },
};

function shouldPrefetchInternal(href: string, openInNewTab?: boolean): boolean {
  return href.startsWith("/") && !openInNewTab;
}

function PublicationNewsCard({ item }: { item: PortalNewsItem }) {
  return (
    <Card className="overflow-hidden border-[#d2d9e4] bg-white p-0 shadow-none transition hover:border-[#bcc7d8] hover:shadow-[0_8px_24px_rgba(25,35,52,0.08)]">
      <div className="h-1.5 w-full bg-[#8fc8bb]" />
      <Link href={item.href} target="_blank" rel="noreferrer" className="block">
        <div className="relative h-48">
          <Image
            src={item.imageSrc}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="p-5">
        <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-2xl">
          {item.title}
        </h3>
        <p className="mb-0 mt-3 line-clamp-2 text-base leading-relaxed text-(--color-muted)">{item.description}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-(--color-muted)">
              <CalendarDays className="size-4" />
              {formatIndonesianDate(item.date)}
            </div>
            <p className="mb-0 mt-2 inline-flex max-w-full items-center gap-1.5 line-clamp-1 text-sm text-(--color-muted)">
              <Building2 className="size-4 shrink-0" />
              {item.organization}
            </p>
          </div>

          <Link
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-(--color-primary) transition hover:text-[#8f1717]"
          >
            Baca berita
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function PublicationCatalogCard({ item, view }: { item: PublicationCatalogItem; view: PublicationView }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const isInfografis = view === "infografis";
  const isBukuDigital = view === "buku-digital";
  const isRegulasi = view === "regulasi";
  const isPetunjukTeknis = view === "petunjuk-teknis";
  const useIconOnlyActions =
    Boolean(item.downloadHref || item.downloadLabel) || isInfografis || isRegulasi || isPetunjukTeknis;
  const accentBarClassName = isInfografis
    ? "bg-[#8fc8bb]"
    : isRegulasi
      ? "bg-[#c8ae72]"
      : isPetunjukTeknis
        ? "bg-[#8fb9a8]"
        : "bg-[#9fb7dd]";
  const imageHeightClassName = isInfografis ? "aspect-square" : "h-48";
  const openLabel = isRegulasi
    ? "Buka regulasi"
    : isPetunjukTeknis
      ? "Buka petunjuk teknis"
      : isBukuDigital
        ? "Lihat dokumen"
        : item.hrefLabel ?? "Buka detail";
  const downloadLabel = isPetunjukTeknis ? "Unduh petunjuk teknis" : item.downloadLabel ?? "Unduh dokumen";
  const canPrefetchPrimaryHref = shouldPrefetchInternal(item.href, item.openInNewTab);

  return (
    <Card className="overflow-hidden border-[#d2d9e4] bg-white p-0 shadow-none transition hover:border-[#bcc7d8] hover:shadow-[0_8px_24px_rgba(25,35,52,0.08)]">
      <div className={`h-1.5 w-full ${accentBarClassName}`} />
      {item.imageSrc ? (
        <Link
          href={item.href}
          prefetch={canPrefetchPrimaryHref ? true : undefined}
          target={item.openInNewTab ? "_blank" : undefined}
          rel={item.openInNewTab ? "noreferrer" : undefined}
          className="block"
        >
          <div className={`relative ${imageHeightClassName} bg-[#eff3f8]`}>
            <Image
              src={item.imageSrc}
              alt={item.title}
              fill
              unoptimized={item.imageSrc.startsWith("http")}
              className={isInfografis ? "object-contain" : "object-cover"}
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            />
          </div>
        </Link>
      ) : (
        <div className="h-0" />
      )}

      <div className="p-5">
        <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-2xl">
          {item.title}
        </h3>
        {item.summary ? (
          <p className="mb-0 mt-3 line-clamp-3 text-base leading-relaxed text-(--color-muted)">{item.summary}</p>
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-(--color-muted)">
              <CalendarDays className="size-4" />
              {formatIndonesianDate(item.lastUpdated)}
            </div>
            <p className="mb-0 mt-2 inline-flex max-w-full items-center gap-1.5 line-clamp-1 text-sm text-(--color-muted)">
              <Building2 className="size-4 shrink-0" />
              {item.organization}
            </p>
          </div>

          {useIconOnlyActions ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="secondary" size="sm" className="h-9 w-9 rounded-lg p-0">
                <Link
                  href={item.href}
                  prefetch={canPrefetchPrimaryHref ? true : undefined}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noreferrer" : undefined}
                  aria-label={openLabel}
                  title={openLabel}
                >
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
              {item.downloadHref && !isInfografis ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 rounded-lg p-0"
                    onClick={() => setShowConfirm(true)}
                    aria-label={downloadLabel}
                    title={downloadLabel}
                  >
                    <Download className="size-4" />
                  </Button>
                  <ConfirmationDialog
                    open={showConfirm}
                    onOpenChange={setShowConfirm}
                    title="Unduh Dokumen?"
                    description={`Anda akan mengunduh dokumen "${item.title}". Apakah Anda yakin ingin melanjutkan?`}
                    confirmLabel="Unduh"
                    cancelLabel="Batal"
                    onConfirm={() => {
                      const link = document.createElement("a");
                      link.href = item.downloadHref!;
                      link.setAttribute("download", "");
                      link.setAttribute("target", "_blank");
                      link.setAttribute("rel", "noreferrer");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setShowConfirm(false);
                    }}
                  />
                </>
              ) : null}
            </div>
          ) : (
            <Button asChild variant="secondary" className="shrink-0 rounded-lg">
              <Link
                href={item.href}
                prefetch={canPrefetchPrimaryHref ? true : undefined}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noreferrer" : undefined}
              >
                {item.hrefLabel ?? "Buka Detail"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PublikasiContent({
  view,
  basePath,
  sort = "terbaru",
  searchQuery = "",
  itemsPerPage = 12,
  currentPage = 1,
  totalItems,
  kabarDataItems = [],
  publicationItems = [],
}: PublikasiContentProps) {
  const config = VIEW_CONFIG[view];
  const totalCount = totalItems ?? (view === "berita" ? kabarDataItems.length : publicationItems.length);
  const visibleCount = view === "berita" ? kabarDataItems.length : publicationItems.length;
  const Icon = config.icon;
  const normalizedSearchQuery = searchQuery.trim();
  const hasSearchQuery = normalizedSearchQuery.length > 0;

  return (
    <>
      <section>
        <PortalHeroCard
          eyebrow="PORTAL SATU DATA"
          title={
            <>
              {config.title.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-(--color-primary)">
                {config.title.split(" ").slice(-1)}
              </span>
            </>
          }
          description={config.description}
          decoration={
            <>
              <div className="absolute left-4 top-4 z-10 rounded-2xl border border-[#d5dbe7] bg-white/95 px-4 py-2 shadow-[0_12px_24px_rgba(33,41,52,0.12)] sm:left-6 sm:top-6">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                  KONTEN TERINDEKS
                </p>
                <p className="m-0 mt-1 flex items-center gap-2 font-(family-name:--font-heading) text-2xl font-semibold text-(--color-text) sm:text-[1.75rem]">
                  <Icon className="size-5 text-(--color-primary)" />
                  {totalCount.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="absolute bottom-0 right-[clamp(0.9rem,1.4vw,1.4rem)] z-2 h-[clamp(9rem,16vw,14rem)] w-[clamp(12rem,24vw,18rem)]">
                <Image
                  src="/assets/brand/landmarks/perahu-naga.png"
                  alt="Perahu Naga sebagai aksen budaya"
                  fill
                  loading="eager"
                  sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 16rem, (min-width: 640px) 14rem, 12rem"
                  className="object-contain object-bottom drop-shadow-[0_14px_28px_rgba(40,46,56,0.22)]"
                />
              </div>
            </>
          }
        />
      </section>

      <section>
        <SearchBar
          action={basePath}
          placeholder={`Cari ${config.title.toLowerCase()}...`}
          defaultValue={searchQuery}
          srLabel={`Pencarian ${config.title.toLowerCase()}`}
          hiddenValues={{
            sort,
            page: "1",
          }}
          submitLabel="Cari Publikasi"
        />
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeading
              title={config.listTitle}
              description={`Menampilkan ${visibleCount.toLocaleString("id-ID")} dari ${totalCount.toLocaleString("id-ID")} konten (halaman ${currentPage}).`}
              className="min-w-0"
              titleClassName="text-2xl sm:text-3xl"
              descriptionClassName="text-sm sm:text-base"
            />
            <NewsDisplayControls basePath={basePath} sort={sort} query={searchQuery} />
          </div>

          {visibleCount > 0 ? (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {view === "berita"
                  ? kabarDataItems.map((item) => <PublicationNewsCard key={`${item.href}-${item.date}`} item={item} />)
                  : publicationItems.map((item) => <PublicationCatalogCard key={item.id} item={item} view={view} />)}
              </div>

              <NewsPaginationControls
                basePath={basePath}
                totalItems={totalCount}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                sort={sort}
                query={searchQuery}
                ariaLabel={`Navigasi halaman ${config.title.toLowerCase()}`}
              />
            </>
          ) : (
            <div
              className={`mt-5 rounded-2xl border border-dashed border-[#cbd3e2] bg-[#f8fbff] p-5 ${hasSearchQuery ? "text-center" : ""
                }`}
            >
              <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold">
                {hasSearchQuery ? `Tidak ada hasil untuk "${normalizedSearchQuery}"` : config.emptyTitle}
              </h3>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                {hasSearchQuery
                  ? "Coba kata kunci lain atau reset pencarian untuk melihat semua publikasi."
                  : config.emptyDescription}
              </p>
              {hasSearchQuery ? (
                <Button asChild variant="secondary" className="mt-4 rounded-lg">
                  <Link href={`${basePath}?sort=${sort}`} prefetch>
                    Reset pencarian
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" className="mt-4 rounded-lg">
                  <Link href={config.emptyCtaHref} prefetch>
                    {config.emptyCtaLabel}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
