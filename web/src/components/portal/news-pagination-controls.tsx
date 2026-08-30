import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { buildPublicationQuery, type PublicationSort } from "@/lib/utils/query";

interface NewsPaginationControlsProps {
  basePath: string;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  sort: PublicationSort;
  query?: string;
  ariaLabel?: string;
}

function getPages(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function NewsPaginationControls({
  basePath,
  totalItems,
  currentPage,
  itemsPerPage,
  sort,
  query,
  ariaLabel = "Navigasi halaman publikasi",
}: NewsPaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPages(currentPage, totalPages);
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="mt-7 border-t border-[var(--color-border)] pt-5" aria-label={ariaLabel}>
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#f8fbff] p-3 sm:p-4">
        <Button
          asChild
          variant="secondary"
          size="icon"
          className={cn("rounded-full", currentPage === 1 && "pointer-events-none opacity-45")}
        >
          <Link
            href={`${basePath}${buildPublicationQuery({ q: query, sort, page: prevPage })}`}
            aria-disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {pages.map((page, index) =>
            page === "..." ? (
              <span key={`dots-${index}`} className="px-1 text-sm font-medium text-[var(--color-muted)]">
                ...
              </span>
            ) : (
              <Button
                key={page}
                asChild
                variant={page === currentPage ? "default" : "secondary"}
                size="sm"
                className="min-w-10 rounded-full px-3"
              >
                <Link href={`${basePath}${buildPublicationQuery({ q: query, sort, page })}`}>{page}</Link>
              </Button>
            ),
          )}
        </div>

        <Button
          asChild
          variant="secondary"
          size="icon"
          className={cn("rounded-full", currentPage === totalPages && "pointer-events-none opacity-45")}
        >
          <Link
            href={`${basePath}${buildPublicationQuery({ q: query, sort, page: nextPage })}`}
            aria-disabled={currentPage === totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="size-5" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
