"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface InternalTablePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

export function InternalTablePagination({
  totalItems,
  currentPage,
  pageSize,
}: InternalTablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    params.set("pageSize", pageSize.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman">
      <Button
        asChild
        variant="secondary"
        size="icon"
        className={cn("rounded-full", currentPage === 1 && "pointer-events-none opacity-45")}
      >
        <Link href={createPageUrl(prevPage)} aria-disabled={currentPage === 1} aria-label="Sebelumnya">
          <ChevronLeft className="size-5" />
        </Link>
      </Button>

      <div className="flex items-center gap-1.5">
        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`dots-${index}`} className="px-1 text-sm font-medium text-[var(--color-muted)]">...</span>
          ) : (
            <Button
              key={page}
              asChild
              variant={page === currentPage ? "default" : "secondary"}
              size="sm"
              className={cn("min-w-9 rounded-full", page === currentPage && "pointer-events-none")}
            >
              <Link href={createPageUrl(page)}>{page}</Link>
            </Button>
          )
        )}
      </div>

      <Button
        asChild
        variant="secondary"
        size="icon"
        className={cn("rounded-full", currentPage === totalPages && "pointer-events-none opacity-45")}
      >
        <Link href={createPageUrl(nextPage)} aria-disabled={currentPage === totalPages} aria-label="Berikutnya">
          <ChevronRight className="size-5" />
        </Link>
      </Button>
    </nav>
  );
}
