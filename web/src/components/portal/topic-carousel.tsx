"use client";

import { useEffect, useMemo, useState, type TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  BusFront,
  Camera,
  ChevronLeft,
  ChevronRight,
  Fish,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Landmark,
  Leaf,
  RadioTower,
  Sprout,
  Trophy,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/utils/formatters";

const topicIcons = {
  ekonomi: BarChart3,
  kependudukan: Users,
  kesehatan: HeartPulse,
  pendidikan: GraduationCap,
  infrastruktur: Building2,
  pemerintahan: Landmark,
  sosial: HandHeart,
  lingkungan: Leaf,
  ketenagakerjaan: Briefcase,
  pertanian: Sprout,
  perikanan: Fish,
  transportasi: BusFront,
  pariwisata: Camera,
  kebencanaan: TriangleAlert,
  kominfo: RadioTower,
  olahraga: Trophy,
} as const;

export type TopicCarouselIconKey = keyof typeof topicIcons;

export interface TopicCarouselItem {
  label: string;
  datasetCount: number;
  href: string;
  iconKey: TopicCarouselIconKey;
  accentColor: string;
}

interface TopicCarouselProps {
  title: string;
  description: string;
  items: TopicCarouselItem[];
}

function resolveCardsPerPage(viewportWidth: number, totalItems: number) {
  if (viewportWidth >= 1440) {
    return Math.max(1, Math.ceil(totalItems / 2));
  }

  if (viewportWidth >= 1000) {
    return 4;
  }

  if (viewportWidth >= 820) {
    return 3;
  }

  return 2;
}

export function TopicCarousel({ title, description, items }: TopicCarouselProps) {
  const [activePage, setActivePage] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(2);
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
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const compactLandscape = viewportWidth > viewportHeight && viewportHeight <= 760;
      const compactMobile = viewportWidth <= 480;

      setCardsPerPage(resolveCardsPerPage(viewportWidth, items.length));
      setIsCompactLandscape(compactLandscape);
      setIsCompactMobile(compactMobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [items.length]);

  useEffect(() => {
    if (pageCount <= 1 || isAutoScrollPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActivePage((previousPage) => (previousPage + 1) % pageCount);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAutoScrollPaused, pageCount]);

  const goToPreviousPage = () => {
    setActivePage((previousPage) => (previousPage - 1 + pageCount) % pageCount);
  };

  const goToNextPage = () => {
    setActivePage((previousPage) => (previousPage + 1) % pageCount);
  };

  const goToPage = (targetPage: number) => {
    const boundedPage = Math.max(0, Math.min(targetPage, pageCount - 1));
    setActivePage(boundedPage);
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    setIsAutoScrollPaused(true);
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 50;

    if (swipeDistance >= swipeThreshold) {
      goToPreviousPage();
    }

    if (swipeDistance <= -swipeThreshold) {
      goToNextPage();
    }

    setTouchStartX(null);
    window.setTimeout(() => setIsAutoScrollPaused(false), 1200);
  };

  if (!items.length) {
    return null;
  }

  const isCompactCard = isCompactLandscape || isCompactMobile;
  const pageGapClass = isCompactMobile ? "gap-2.5" : isCompactLandscape ? "gap-3" : "gap-4";
  const cardShapeClass = isCompactCard ? "rounded-[24px] p-4" : "rounded-[24px] p-5";
  const cardGapClass = isCompactCard ? "gap-3" : "gap-5";
  const iconWrapClass = isCompactCard ? "size-11 rounded-xl" : "size-14 rounded-2xl";
  const iconClass = isCompactCard ? "size-6" : "size-7";
  const arrowClass = isCompactCard ? "size-4" : "size-5";
  const titleClass = isCompactCard ? "text-xl" : "text-2xl";
  const countClass = isCompactCard ? "text-3xl" : "text-4xl";
  const countGapClass = isCompactCard ? "mt-3" : "mt-4";
  const navSpacingClass = isCompactMobile ? "mt-2" : isCompactLandscape ? "mt-3" : "mt-4";

  return (
    <section aria-label="Topik data prioritas" className="rounded-[28px] bg-[#f1f4f8] p-4 sm:p-6 xl:p-8">
      <div className="mb-5 text-center md:mb-6">
        <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight tracking-tight text-(--color-text) sm:text-4xl">
          {title}
        </h2>
        <div className="mx-auto mt-3 h-1.5 w-19 rounded-full bg-(--color-primary)" />
        <p className="mb-0 mt-4 w-full max-w-none text-base leading-relaxed text-(--color-muted)">
          {description}
        </p>
      </div>

      <div
        className="w-full"
        onMouseEnter={() => setIsAutoScrollPaused(true)}
        onMouseLeave={() => setIsAutoScrollPaused(false)}
        onFocusCapture={() => setIsAutoScrollPaused(true)}
        onBlurCapture={() => setIsAutoScrollPaused(false)}
      >
          <div className="overflow-hidden rounded-[24px]" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((pageItems, pageIndex) => (
                <div
                  key={`page-content-${pageIndex + 1}`}
                  className="min-w-full"
                  aria-hidden={pageIndex !== currentPage}
                  inert={pageIndex !== currentPage}
                >
                  <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${pageGapClass}`}>
                    {pageItems.map((item) => {
                      const Icon = topicIcons[item.iconKey];

                      return (
                        <Link key={item.label} href={item.href} className="group h-full">
                          <article
                            className={`relative flex h-full min-h-[232px] flex-col overflow-hidden border border-[rgba(191,199,214,0.72)] bg-linear-to-br from-white via-white to-[#f5f8ff] shadow-[0_10px_22px_rgba(33,41,52,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(33,41,52,0.11)] ${cardShapeClass} ${cardGapClass}`}
                          >
                            <div
                              className={`absolute inset-x-0 top-0 h-1.5 ${isCompactCard ? "rounded-t-3xl" : "rounded-t-[28px]"}`}
                              style={{
                                background: `linear-gradient(90deg, ${item.accentColor} 0%, ${item.accentColor}e6 58%, ${item.accentColor}4d 100%)`,
                                boxShadow: `0 8px 18px -12px ${item.accentColor}`,
                              }}
                            />
                            <div
                              className={`absolute inset-x-0 top-0 opacity-[0.14] ${isCompactCard ? "h-12" : "h-16"}`}
                              style={{
                                background: `linear-gradient(180deg, ${item.accentColor}2e 0%, rgba(255,255,255,0) 100%)`,
                              }}
                            />
                            <div
                              className={`absolute -right-6 bottom-4 rounded-full opacity-[0.1] ${isCompactCard ? "size-16" : "size-20"}`}
                              style={{ backgroundColor: item.accentColor }}
                            />

                            <div className="relative flex items-start justify-between gap-3">
                              <span
                                className={`inline-flex items-center justify-center shadow-sm ${iconWrapClass}`}
                                style={{
                                  backgroundColor: `${item.accentColor}16`,
                                  color: item.accentColor,
                                }}
                              >
                                <Icon className={iconClass} />
                              </span>
                              <ArrowUpRight
                                className={`${arrowClass} text-(--color-muted) transition group-hover:text-(--color-primary)`}
                              />
                            </div>

                            <div className="relative mt-auto">
                              <h3
                                className={`m-0 line-clamp-2 font-(family-name:--font-heading) font-semibold leading-snug tracking-tight text-(--color-text) ${titleClass}`}
                              >
                                {item.label}
                              </h3>
                              <div className={`flex items-end justify-between gap-4 ${countGapClass}`}>
                                <div>
                                  <strong
                                    className={`block font-(family-name:--font-heading) font-semibold leading-none text-(--color-text) ${countClass}`}
                                  >
                                    {formatCompactNumber(item.datasetCount)}
                                  </strong>
                                  <p
                                    className={`mb-0 font-medium text-(--color-muted) ${isCompactCard ? "mt-1.5 text-xs" : "mt-2 text-sm"}`}
                                  >
                                    Dataset tersedia
                                  </p>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-muted)">
                                  Buka topik
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-center gap-3 ${navSpacingClass}`}>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={goToPreviousPage}
              aria-label="Lihat halaman topik sebelumnya"
              className="rounded-full"
            >
              <ChevronLeft className="size-5" />
            </Button>

            <div className="flex items-center gap-2" aria-label="Navigasi halaman">
              {pages.map((_, index) => (
                <button
                  key={`page-${index + 1}`}
                  type="button"
                  onClick={() => goToPage(index)}
                  aria-label={`Tampilkan halaman ${index + 1}`}
                  aria-pressed={currentPage === index}
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
              aria-label="Lihat halaman topik berikutnya"
              className="rounded-full"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

      </div>
    </section>
  );
}
