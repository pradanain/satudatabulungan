import Link from "next/link";
import { Building2, CalendarDays } from "lucide-react";
import type { Dataset, DatasetFormat } from "@/lib/types/dataset";
import { getPrimaryDatasetDescription } from "@/lib/utils/dataset-description";
import { formatIndonesianDate, getTopicAccentColor } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface DatasetCardProps {
  dataset: Dataset;
  compact?: boolean;
}

function getFormatBadgeClass(format: DatasetFormat): string {
  if (format === "CSV") return "border-[#b9dec5] bg-[#edf9f1] text-[#1f7a48]";
  if (format === "XLSX") return "border-[#bde0cf] bg-[#ecfbf3] text-[#176b46]";
  if (format === "PDF") return "border-[#f0c7c7] bg-[#fff1f1] text-[#ad2b2b]";
  if (format === "API") return "border-[#c6d0f1] bg-[#eff3ff] text-[#3f57a8]";
  if (format === "JSON") return "border-[#ead9ba] bg-[#fff8ea] text-[#9a6a1a]";
  return "border-[#c8d2e7] bg-[#f2f6ff] text-[#3d5f96]";
}

const formatOrder: DatasetFormat[] = ["CSV", "XLSX", "JSON", "API", "PDF"];

export function DatasetCard({ dataset, compact = false }: DatasetCardProps) {
  const accentColor = getTopicAccentColor(dataset.topic);
  const orderedFormats = [...dataset.formats].sort(
    (a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b),
  );
  const descriptionText = getPrimaryDatasetDescription(dataset.description);

  return (
    <Link
      href={`/dataset/${dataset.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)] focus-visible:ring-offset-2"
      aria-label={`Buka detail dataset ${dataset.title}`}
    >
      <Card className="overflow-hidden border-[#d2d9e4] bg-white shadow-none transition group-hover:border-[#bcc7d8] group-hover:shadow-[0_8px_24px_rgba(25,35,52,0.08)]">
        <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

        <article
          className={cn(
            "flex h-full flex-col gap-3.5 p-4.5 sm:p-5",
            compact && "p-3.5 sm:p-4 gap-2.5",
          )}
        >
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="blue"
              className="rounded-full px-3 py-1 text-xs font-semibold sm:text-sm"
            >
              {dataset.topic}
            </Badge>
            {orderedFormats.map((format) => (
              <Badge
                key={format}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold sm:text-sm",
                  getFormatBadgeClass(format),
                )}
              >
                {format}
              </Badge>
            ))}
          </div>

          <h3
            className={cn(
              "m-0 font-[family-name:var(--font-heading)] text-base sm:text-lg font-semibold leading-snug tracking-tight text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]",
              compact && "text-sm sm:text-base",
            )}
          >
            {dataset.title}
          </h3>

          <p className="m-0 max-w-[85ch] text-xs sm:text-sm leading-relaxed text-[#5f5957]">
            {descriptionText}
          </p>

          <div className="mt-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-(--color-muted)">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {formatIndonesianDate(dataset.lastUpdated)}
              </span>
              <span className="text-(--color-border)">|</span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0" />
                {dataset.organization}
              </span>
            </div>
          </div>
        </article>
      </Card>
    </Link>
  );
}
