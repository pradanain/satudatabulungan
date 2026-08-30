import type { Metadata } from "next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { loadKabarDataItems } from "@/lib/services/news-service";
import { PublikasiContent } from "@/app/publikasi/publikasi-content";
import {
  normalizePositiveInteger,
  normalizePublicationSort,
  pickQueryValue,
  PUBLICATION_PAGE_SIZE,
} from "@/lib/utils/publication-query";

type PublikasiBeritaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Berita",
  description: "Daftar berita resmi Satu Data Bulungan terkait pemutakhiran data dan agenda statistik daerah.",
  path: "/publikasi-berita",
  keywords: ["publikasi berita", "berita satu data", "berita data Bulungan"],
});

export const revalidate = 21_600;

export default async function PublikasiBeritaPage({ searchParams }: PublikasiBeritaPageProps) {
  const rawParams = await searchParams;
  const searchQuery = pickQueryValue(rawParams.q) ?? "";
  const sort = normalizePublicationSort(pickQueryValue(rawParams.sort));
  const pageSize = PUBLICATION_PAGE_SIZE;
  const requestedPage = normalizePositiveInteger(rawParams.page, 1);

  const kabarDataItems = await loadKabarDataItems();
  const normalizedKeyword = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedKeyword
    ? kabarDataItems.filter((item) =>
        `${item.title} ${item.description} ${item.organization}`.toLowerCase().includes(normalizedKeyword),
      )
    : kabarDataItems;

  const sortedItems = [...filteredItems].sort((left, right) => {
    if (sort === "terlama") {
      return left.date.localeCompare(right.date);
    }

    if (sort === "az") {
      return left.title.localeCompare(right.title, "id-ID", { sensitivity: "base" });
    }

    return right.date.localeCompare(left.date);
  });

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = sortedItems.slice(startIndex, startIndex + pageSize);

  return (
    <PortalPageShell activeMenu="publikasi">
      <PublikasiContent
        view="berita"
        basePath="/publikasi-berita"
        sort={sort}
        searchQuery={searchQuery}
        itemsPerPage={pageSize}
        currentPage={currentPage}
        totalItems={totalItems}
        kabarDataItems={pageItems}
      />
    </PortalPageShell>
  );
}
