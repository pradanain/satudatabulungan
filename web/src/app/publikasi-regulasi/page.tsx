import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { PublikasiContent, type PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getDataGoIdNationalRegulations } from "@/lib/services/data-go-id-regulation-service";
import {
  normalizePositiveInteger,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Regulasi",
  description: "Daftar regulasi dan kebijakan resmi terkait tata kelola data pada Portal Satu Data Bulungan.",
  path: "/publikasi-regulasi",
  keywords: ["publikasi regulasi", "regulasi satu data", "kebijakan data Bulungan"],
});

export const revalidate = 21_600;

type PublikasiRegulasiPageProps = {
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

export default async function PublikasiRegulasiPage({ searchParams }: PublikasiRegulasiPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const nationalRegulations = await getDataGoIdNationalRegulations().catch(() => []);

  const allItems: PublicationCatalogItem[] = nationalRegulations.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    organization: item.organization,
    lastUpdated: item.publishedDate,
    href: item.detailUrl,
    hrefLabel: "Buka Regulasi",
    openInNewTab: true,
  }));

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
        view="regulasi"
        basePath="/publikasi-regulasi"
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
