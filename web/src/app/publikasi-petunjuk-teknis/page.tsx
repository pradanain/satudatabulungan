import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { PublikasiContent, type PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getBappedaDigitalPublications } from "@/lib/services/bappeda-publication-service";
import { getDataGoIdNationalRegulations } from "@/lib/services/data-go-id-regulation-service";
import { getDatasets } from "@/lib/services/dataset-service";
import { normalizeOrganizationName } from "@/lib/utils/organization";
import {
  normalizePositiveInteger,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Petunjuk Teknis",
  description: "Daftar pedoman teknis, implementasi, dan referensi operasional terkait tata kelola data.",
  path: "/publikasi-petunjuk-teknis",
  keywords: ["petunjuk teknis", "pedoman data", "publikasi teknis Bulungan"],
});

export const revalidate = 21_600;

type PublikasiPetunjukTeknisPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TECHNICAL_GUIDE_PATTERN = /\b(petunjuk|teknis|pedoman|manual|sop|standar operasional)\b/i;

function sortPublicationItems(items: PublicationCatalogItem[], sort: "terbaru" | "terlama" | "az"): PublicationCatalogItem[] {
  return [...items].sort((left, right) => {
    if (sort === "az") {
      return left.title.localeCompare(right.title, "id-ID", { sensitivity: "base" });
    }

    const comparison = left.lastUpdated.localeCompare(right.lastUpdated);
    return sort === "terlama" ? comparison : -comparison;
  });
}

export default async function PublikasiPetunjukTeknisPage({ searchParams }: PublikasiPetunjukTeknisPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const bappedaOfficialName = normalizeOrganizationName("Bappedalitbang Kabupaten Bulungan");

  const [bappedaItems, nationalRegulations] = await Promise.all([
    getBappedaDigitalPublications().catch(() => []),
    getDataGoIdNationalRegulations().catch(() => []),
  ]);

  let fromInternal: PublicationCatalogItem[] = [];
  try {
    const store = await (await import("@/lib/services/internal-store")).loadInternalPortalStore();
    fromInternal = (store.publications || [])
      .filter((pub) => pub.type === "technical_guide" && pub.status === "Published")
      .map((pub) => ({
        id: `internal-${pub.id}`,
        title: pub.title,
        summary: pub.description || "Petunjuk Teknis Satu Data Bulungan",
        organization: pub.organizationName,
        lastUpdated: pub.publishedAt || pub.updatedAt || "1970-01-01",
        href: pub.fileUrl || "#",
        hrefLabel: "Buka Dokumen",
        downloadHref: pub.fileUrl || "#",
        downloadLabel: "Unduh Dokumen",
        openInNewTab: true,
      }));
  } catch {
    // Ignore
  }

  let allItems: PublicationCatalogItem[] = [
    ...bappedaItems.map((item) => ({
      id: `bappeda-${item.id}`,
      title: item.title,
      summary:
        item.downloadCount !== null
          ? `${item.downloadCount.toLocaleString("id-ID")}x diunduh - Sumber Bappeda Bulungan`
          : "Sumber Bappeda Bulungan",
      organization: bappedaOfficialName,
      lastUpdated: item.publishedDate,
      href: item.viewUrl,
      hrefLabel: "Lihat Dokumen",
      downloadHref: item.downloadUrl,
      downloadLabel: "Unduh Dokumen",
      openInNewTab: true,
    })),
    ...nationalRegulations.map((item) => ({
      id: `regulasi-${item.id}`,
      title: item.title,
      summary: item.summary,
      organization: item.organization,
      lastUpdated: item.publishedDate,
      href: item.detailUrl,
      hrefLabel: "Buka Regulasi",
      openInNewTab: true,
    })),
  ].filter((item) => TECHNICAL_GUIDE_PATTERN.test(`${item.title} ${item.summary}`));

  allItems = [...allItems, ...fromInternal];

  if (allItems.length === 0) {
    const datasets = await getDatasets({ sort: "terbaru" });
    allItems = datasets
      .filter((dataset) => TECHNICAL_GUIDE_PATTERN.test(`${dataset.title} ${dataset.summary}`))
      .map((dataset) => ({
        id: `dataset-${dataset.id}`,
        title: dataset.title,
        summary: `${dataset.summary} - fallback katalog internal`,
        organization: dataset.organization,
        lastUpdated: dataset.lastUpdated,
        href: `/dataset/${dataset.slug}`,
      }))
      .slice(0, 24);
  }

  const normalizedKeyword = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedKeyword
    ? allItems.filter((item) =>
        `${item.title} ${item.summary} ${item.organization}`.toLowerCase().includes(normalizedKeyword),
      )
    : allItems;

  const sortedItems = sortPublicationItems(filteredItems, sort);
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = sortedItems.slice(startIndex, startIndex + pageSize);

  return (
    <PortalPageShell activeMenu="publikasi">
      <PublikasiContent
        view="petunjuk-teknis"
        basePath="/publikasi-petunjuk-teknis"
        sort={sort}
        searchQuery={searchQuery}
        itemsPerPage={pageSize}
        currentPage={currentPage}
        totalItems={totalItems}
        publicationItems={pageItems}
      />
    </PortalPageShell>
  );
}
