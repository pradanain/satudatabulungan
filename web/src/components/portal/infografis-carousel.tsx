"use client";

import { useEffect, useMemo, useState, type TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePublicationImageSrc, DEFAULT_PUBLICATION_IMAGE_SRC } from "@/lib/utils/publication-query";
import type { PublicationCatalogItem } from "@/app/publikasi/publikasi-content";

interface InfografisCarouselProps {
  items: PublicationCatalogItem[];
}

function resolveCardsPerPage(viewportWidth: number, totalItems: number) {
  if (viewportWidth >= 1280) return 4;
  if (viewportWidth >= 640) return 2;
  return 1;
}

export function InfografisCarousel({ items }: InfografisCarouselProps) {
  const [activePage, setActivePage] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const pageCount = Math.max(1, Math.ceil(items.length / cardsPerPage));
  const currentPage = ((activePage % pageCount) + pageCount) % pageCount;

  const pages = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, index) =>
        items.slice(index * cardsPerPage, index * cardsPerPage + cardsPerPage),
      ),
    [cardsPerPage, items, pageCount],
  );

  useEffect(() => {
    const handleResize = () => setCardsPerPage(resolveCardsPerPage(window.innerWidth, items.length));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items.length]);

  useEffect(() => {
    if (pageCount <= 1 || isAutoScrollPaused) return;
    const intervalId = window.setInterval(() => {
      setActivePage((prev) => (prev + 1) % pageCount);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [isAutoScrollPaused, pageCount]);

  const goToPreviousPage = () => setActivePage((prev) => (prev - 1 + pageCount) % pageCount);
  const goToNextPage = () => setActivePage((prev) => (prev + 1) % pageCount);
  const goToPage = (page: number) => setActivePage(Math.max(0, Math.min(page, pageCount - 1)));

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    setIsAutoScrollPaused(true);
    setTouchStartX(e.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartX;
    const swipeDist = touchEndX - touchStartX;
    if (swipeDist >= 50) goToPreviousPage();
    if (swipeDist <= -50) goToNextPage();
    setTouchStartX(null);
    window.setTimeout(() => setIsAutoScrollPaused(false), 1200);
  };

  if (!items.length) return null;

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsAutoScrollPaused(true)}
      onMouseLeave={() => setIsAutoScrollPaused(false)}
      onFocusCapture={() => setIsAutoScrollPaused(true)}
      onBlurCapture={() => setIsAutoScrollPaused(false)}
    >
      <div className="overflow-hidden rounded-3xl" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pageItems, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="min-w-full px-1"
              aria-hidden={pageIndex !== currentPage}
              inert={pageIndex !== currentPage ? true : undefined}
            >
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 pb-4 pt-1">
                {pageItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-3xl border border-(--color-border) bg-white p-3 shadow-[0_12px_26px_rgba(29,40,57,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(29,40,57,0.12)]"
                  >
                    <Link href={item.href} target="_blank" rel="noreferrer" className="block">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#eff3f8] flex items-center justify-center">
                        <Image
                          src={item.imageSrc || DEFAULT_PUBLICATION_IMAGE_SRC}
                          alt={item.title}
                          fill
                          unoptimized={item.imageSrc?.startsWith("http")}
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 25vw"
                        />
                      </div>
                    </Link>

                    <h3 className="m-0 mt-4 line-clamp-3 font-(family-name:--font-heading) text-base font-semibold leading-snug tracking-tight text-(--color-text) sm:text-lg">
                      {item.title}
                    </h3>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={goToPreviousPage}
            className="rounded-full"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center gap-2">
            {pages.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => goToPage(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentPage === index ? "w-10 bg-(--color-primary)" : "w-2.5 bg-[#c6cfdb]"
                }`}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={goToNextPage}
            className="rounded-full"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
