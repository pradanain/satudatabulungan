import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { PublikasiContent, type PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getCombinedInfografisPublications } from "@/lib/services/publication-aggregator-service";
import {
  normalizePositiveInteger,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";
import { parseIndonesianDateText } from "@/lib/utils/formatters";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Infografis",
  description:
    "Kumpulan infografis dari sumber live DKIP Bulungan dan tambahan upload operator internal (CKAN).",
  path: "/publikasi/infografis",
  keywords: ["infografis", "DKIP Bulungan", "Satu Data Bulungan", "publikasi data"],
});

export const revalidate = 0;

type PublikasiInfografisPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function sortPublicationItems(items: PublicationCatalogItem[], sort: "terbaru" | "terlama" | "az"): PublicationCatalogItem[] {
  return [...items].sort((left, right) => {
    if (sort === "az") {
      return left.title.localeCompare(right.title, "id-ID", { sensitivity: "base" });
    }

    const timeLeft = parseIndonesianDateText(left.lastUpdated);
    const timeRight = parseIndonesianDateText(right.lastUpdated);
    const comparison = timeLeft - timeRight;
    return sort === "terlama" ? comparison : -comparison;
  });
}

export default async function PublikasiInfografisPage({ searchParams }: PublikasiInfografisPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);
  const allItems: PublicationCatalogItem[] = await getCombinedInfografisPublications();

  const normalizedKeyword = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedKeyword
    ? allItems.filter((item) => `${item.title} ${item.organization}`.toLowerCase().includes(normalizedKeyword))
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
        view="infografis"
        basePath="/publikasi/infografis"
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

