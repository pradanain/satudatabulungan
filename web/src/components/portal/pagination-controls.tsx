import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DatasetFilters } from "@/lib/types/dataset";
import { buildDatasetQuery } from "@/lib/utils/query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface PaginationControlsProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  baseFilters: DatasetFilters;
}

function getPages(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
}

export function PaginationControls({
  totalItems,
  currentPage,
  pageSize,
  baseFilters,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPages(currentPage, totalPages);
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      className="mt-7 border-t border-[var(--color-border)] pt-5"
      aria-label="Navigasi halaman dataset"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#f8fbff] p-3 sm:p-4">
        <Button
          asChild
          variant="secondary"
          size="icon"
          className={cn(
            "rounded-full",
            currentPage === 1 && "pointer-events-none opacity-45",
          )}
        >
          <Link
            href={`/dataset${buildDatasetQuery({ ...baseFilters, page: prevPage, pageSize })}`}
            aria-disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {pages.map((page, index) =>
            page === "..." ? (
              <span
                key={`dots-${index}`}
                className="px-1 text-sm font-medium text-[var(--color-muted)]"
              >
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
                <Link href={`/dataset${buildDatasetQuery({ ...baseFilters, page, pageSize })}`}>
                  {page}
                </Link>
              </Button>
            ),
          )}
        </div>

        <Button
          asChild
          variant="secondary"
          size="icon"
          className={cn(
            "rounded-full",
            currentPage === totalPages && "pointer-events-none opacity-45",
          )}
        >
          <Link
            href={`/dataset${buildDatasetQuery({ ...baseFilters, page: nextPage, pageSize })}`}
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
