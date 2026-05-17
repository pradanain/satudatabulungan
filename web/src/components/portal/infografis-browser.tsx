"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InfografisApiResponse, InfografisItem } from "@/lib/types/infografis";
import { formatIndonesianDate } from "@/lib/utils/formatters";

type InfografisBrowserProps = {
  initialLimit?: number;
};

type InfografisApiErrorResponse = {
  success: false;
  error?: string;
};

type InfografisFetchError = Error & {
  status?: number;
};

function buildVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

export function InfografisBrowser({ initialLimit = 12 }: InfografisBrowserProps) {
  const router = useRouter();
  const [items, setItems] = useState<InfografisItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceUsed, setSourceUsed] = useState<string>("-");
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      const response = await fetch(`/api/infografis?page=${targetPage}&limit=${initialLimit}&source=auto`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as InfografisApiResponse | InfografisApiErrorResponse;
      if (!response.ok || !payload || payload.success !== true) {
        const error = new Error((payload as InfografisApiErrorResponse)?.error ?? "Gagal memuat infografis.") as InfografisFetchError;
        error.status = response.status;
        throw error;
      }

      const safeTotalPages = Math.max(1, Math.ceil(payload.meta.total / payload.meta.limit));

      setItems(payload.data ?? []);
      setSourceUsed(payload.meta.sourceUsed);
      setTotalItems(payload.meta.total);
      setTotalPages(safeTotalPages);
      setPage(payload.meta.page);
    },
    [initialLimit],
  );

  const loadInitial = useCallback(async () => {
    setIsLoadingInitial(true);
    setErrorMessage(null);

    try {
      await fetchPage(1);
    } catch (error) {
      const status = typeof (error as InfografisFetchError).status === "number" ? (error as InfografisFetchError).status : null;
      if (status && status >= 400 && status <= 599) {
        router.replace(`/error/${status}`);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat data.");
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setPage(1);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [fetchPage, router]);

  const goToPage = useCallback(
    async (targetPage: number) => {
      if (isLoadingPage || isLoadingInitial || targetPage < 1 || targetPage > totalPages || targetPage === page) {
        return;
      }

      setIsLoadingPage(true);
      setErrorMessage(null);

      try {
        await fetchPage(targetPage);
      } catch (error) {
        const status = typeof (error as InfografisFetchError).status === "number" ? (error as InfografisFetchError).status : null;
        if (status && status >= 400 && status <= 599) {
          router.replace(`/error/${status}`);
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Gagal memuat halaman yang dipilih.");
      } finally {
        setIsLoadingPage(false);
      }
    },
    [fetchPage, isLoadingInitial, isLoadingPage, page, router, totalPages],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInitial();
  }, [loadInitial]);

  const isEmpty = useMemo(() => !isLoadingInitial && items.length === 0 && !errorMessage, [errorMessage, isLoadingInitial, items.length]);
  const visiblePages = useMemo(() => buildVisiblePages(page, totalPages), [page, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-(--color-muted)">
          Sumber aktif: <strong>{sourceUsed}</strong>
          {totalItems > 0 ? ` • ${totalItems.toLocaleString("id-ID")} item` : ""}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            void loadInitial();
          }}
          disabled={isLoadingInitial || isLoadingPage}
        >
          <RefreshCcw className="size-4" />
          Muat Ulang
        </Button>
      </div>

      {isLoadingInitial ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: initialLimit }).map((_, index) => (
            <Card key={`skeleton-${index + 1}`} className="overflow-hidden p-0">
              <div className="h-56 animate-pulse bg-[#e8edf5]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-10 animate-pulse rounded bg-[#e8edf5]" />
                <div className="h-6 w-5/6 animate-pulse rounded bg-[#e8edf5]" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-[#e8edf5]" />
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoadingInitial && errorMessage ? (
        <Card className="border border-[#f2c7c7] bg-[#fff7f7] p-5">
          <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold">Data infografis belum tersedia</h3>
          <p className="mb-0 mt-2 text-sm text-(--color-muted)">{errorMessage}</p>
          <Button
            type="button"
            className="mt-4 rounded-full"
            onClick={() => {
              void loadInitial();
            }}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : null}

      {isEmpty ? (
        <Card className="border border-dashed border-[#ccd5e5] bg-[#f8fbff] p-5">
          <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold">Belum ada infografis</h3>
          <p className="mb-0 mt-2 text-sm text-(--color-muted)">Sumber saat ini belum mengembalikan item infografis yang dapat ditampilkan.</p>
        </Card>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const dateLabel = item.publishedDateText || (item.publishedDate ? formatIndonesianDate(item.publishedDate) : "-");

              return (
                <Card key={item.id} className="overflow-hidden border-(--color-border) p-0">
                  <Link href={item.postUrl} target="_blank" rel="noreferrer" className="block">
                    <div className="relative h-56">
                      <Image
                        src={item.imageOriginalUrl ?? item.imageUrl}
                        alt={item.alt || item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  </Link>
                  <div className="space-y-3 p-4">
                    <h3 className="m-0 line-clamp-2 font-(family-name:--font-heading) text-xl font-semibold leading-tight sm:text-2xl">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-(--color-muted)">
                      <CalendarDays className="size-4" />
                      <span>{dateLabel}</span>
                    </div>
                    <Link
                      href={item.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:text-[#8f1717]"
                    >
                      Buka sumber asli
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                void goToPage(page - 1);
              }}
              disabled={isLoadingPage || page <= 1}
            >
              Sebelumnya
            </Button>

            {visiblePages.map((pageNumber) => (
              <Button
                key={`page-${pageNumber}`}
                type="button"
                variant={pageNumber === page ? "default" : "secondary"}
                className="min-w-10 rounded-full"
                onClick={() => {
                  void goToPage(pageNumber);
                }}
                disabled={isLoadingPage}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                void goToPage(page + 1);
              }}
              disabled={isLoadingPage || page >= totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

