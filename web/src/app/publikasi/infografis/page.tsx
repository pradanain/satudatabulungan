import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { PublikasiContent, type PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getInfografisApiPayload } from "@/lib/services/infografis-service";
import { normalizeOrganizationName } from "@/lib/utils/organization";
import {
  DEFAULT_PUBLICATION_IMAGE_SRC,
  normalizePositiveInteger,
  normalizePublicationImageSrc,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Infografis",
  description:
    "Kumpulan infografis resmi DKIP Bulungan yang diambil dari backend CKAN Portal Satu Data.",
  path: "/publikasi/infografis",
  keywords: ["infografis", "DKIP Bulungan", "Satu Data Bulungan", "publikasi data"],
});

export const revalidate = 600;

type PublikasiInfografisPageProps = {
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

export default async function PublikasiInfografisPage({ searchParams }: PublikasiInfografisPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);
  const officialOrganizationName = normalizeOrganizationName("Dinas Komunikasi, Informatika dan Persandian");

  const payload = await getInfografisApiPayload({
    page: 1,
    limit: 500,
    source: "live",
  }).catch(() => ({
    success: true as const,
    data: [],
    meta: {
      page: 1,
      limit: 500,
      total: 0,
      hasNextPage: false,
      sourceUsed: "html_scrape" as const,
      externalSource: "https://diskominfo.bulungan.go.id/wp/infografis/",
    },
  }));

  const allItems: PublicationCatalogItem[] = payload.data.map((item) => ({
    id: item.id,
    title: item.title,
    summary: "",
    organization: officialOrganizationName,
    lastUpdated: item.publishedDate?.slice(0, 10) ?? "1970-01-01",
    href: item.postUrl,
    hrefLabel: "Buka Sumber",
    openInNewTab: true,
    imageSrc: normalizePublicationImageSrc(item.imageOriginalUrl ?? item.imageUrl, DEFAULT_PUBLICATION_IMAGE_SRC),
  }));

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

