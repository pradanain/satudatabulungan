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
import { Badge } from "@/components/ui/badge";
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
      "Informasi terbaru seputar pemutakhiran dataset, tata kelola data, kegiatan statistik sektoral, dan pemanfaatan data di Kabupaten Bulungan.",
    listTitle: "Semua Berita Satu Data",
    emptyTitle: "Berita belum tersedia",
    emptyDescription: "Belum ada berita yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi/infografis",
    emptyCtaLabel: "Lihat infografis terbaru",
  },
  "buku-digital": {
    icon: BookOpenText,
    title: "Publikasi Buku Digital",
    description: "Daftar buku digital dan dokumen terbitan resmi yang tersedia dalam format digital.",
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
      "Daftar infografis resmi DKIP Bulungan yang ditarik otomatis melalui endpoint internal dengan fallback sumber terkelola.",
    listTitle: "Semua Infografis",
    emptyTitle: "Infografis belum tersedia",
    emptyDescription: "Belum ada infografis yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi-berita",
    emptyCtaLabel: "Lihat publikasi berita",
  },
  regulasi: {
    icon: Scale,
    title: "Publikasi Regulasi",
    description: "Daftar regulasi dan kebijakan resmi terkait tata kelola data pada Portal Satu Data Bulungan.",
    listTitle: "Semua Regulasi",
    emptyTitle: "Regulasi belum tersedia",
    emptyDescription: "Belum ada regulasi yang dapat ditampilkan untuk pilihan saat ini.",
    emptyCtaHref: "/publikasi-petunjuk-teknis",
    emptyCtaLabel: "Lihat petunjuk teknis",
  },
  "petunjuk-teknis": {
    icon: FileText,
    title: "Publikasi Petunjuk Teknis",
    description: "Daftar pedoman teknis, implementasi, dan referensi operasional terkait tata kelola data.",
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
        <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-2xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-3xl">
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
  const imageHeightClassName = isInfografis ? "h-56" : "h-48";
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
          <div className={`relative ${imageHeightClassName}`}>
            <Image
              src={item.imageSrc}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            />
          </div>
        </Link>
      ) : (
        <div className="h-0" />
      )}

      <div className="p-5">
        <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-2xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-3xl">
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
                <Button asChild variant="secondary" size="sm" className="h-9 w-9 rounded-lg p-0">
                  <Link
                    href={item.downloadHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={downloadLabel}
                    title={downloadLabel}
                  >
                    <Download className="size-4" />
                  </Link>
                </Button>
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
        <Card className="relative overflow-hidden rounded-[28px] border-(--color-border) bg-white p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]">
          <div className="grid min-h-70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative z-2 flex flex-col justify-center overflow-hidden bg-[linear-gradient(96deg,#ffffff_0%,#fffefb_44%,#f9f5e9_78%,#f5efdd_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.78)_1px,transparent_0)] bg-size-[3px_3px]"
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
                  {config.title}
                </h1>
                <p className="mb-0 mt-4 max-w-2xl text-base leading-relaxed text-[#5f5957] sm:text-[1.05rem]">
                  {config.description}
                </p>
              </div>
            </div>

            <aside className="relative min-h-55 overflow-hidden border-t border-(--color-border) bg-[#f7f5ef] lg:min-h-70 lg:border-t-0">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(128deg,#f6f3ea_0%,#f2eee4_26%,#ebedf2_58%,#e3ebf8_79%,#dce7f7_100%)]" />
                <div
                  className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] bg-size-[3px_3px]"
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
                <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-(--color-primary)">KONTEN TERINDEKS</p>
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
                  sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 16rem, (min-width: 640px) 14rem, 12rem"
                  className="object-contain object-bottom drop-shadow-[0_14px_28px_rgba(40,46,56,0.22)]"
                />
              </div>
            </aside>
          </div>
        </Card>
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
              className={`mt-5 rounded-2xl border border-dashed border-[#cbd3e2] bg-[#f8fbff] p-5 ${
                hasSearchQuery ? "text-center" : ""
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
