import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { PublikasiContent, type PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getBooks } from "@/lib/services/ckan-portal-api";
import {
  normalizePositiveInteger,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Buku Digital",
  description: "Daftar buku digital dan dokumen terbitan resmi yang tersedia di backend CKAN Portal Satu Data Bulungan.",
  path: "/publikasi-buku-digital",
  keywords: ["buku digital", "publikasi dokumen", "dokumen data Bulungan"],
});

export const revalidate = 600;

type PublikasiBukuDigitalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function sortPublicationItems(items: PublicationCatalogItem[], sort: "terbaru" | "terlama" | "az"): PublicationCatalogItem[] {
  return [...items].sort((left, right) => {
    if (sort === "az") {
      return left.title.localeCompare(right.title, "id-ID", { sensitivity: "base" });
    }

    const comparison = left.lastUpdated.localeCompare(right.lastUpdated);
    return sort === "terlama" ? comparison : -comparison;
  });
}

export default async function PublikasiBukuDigitalPage({ searchParams }: PublikasiBukuDigitalPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const allItems: PublicationCatalogItem[] = (await getBooks().catch(() => [])).map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary || item.description || "Publikasi resmi Bappeda Kabupaten Bulungan",
    organization: item.organizationName,
    lastUpdated: item.metadataModified.slice(0, 10),
    href: item.resources[0]?.url || `/dataset/${item.slug}`,
    hrefLabel: "Lihat Dokumen",
    downloadHref: item.resources.find((resource) => resource.format.toUpperCase().includes("PDF"))?.url,
    downloadLabel: "Unduh Dokumen",
    openInNewTab: Boolean(item.resources[0]?.url),
    imageSrc: undefined,
  }));

  const normalizedKeyword = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedKeyword
    ? allItems.filter((item) => `${item.title} ${item.summary} ${item.organization}`.toLowerCase().includes(normalizedKeyword))
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
        view="buku-digital"
        basePath="/publikasi-buku-digital"
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

