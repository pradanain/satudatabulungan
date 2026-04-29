import Link from "next/link";
import type { Dataset } from "@/lib/types/dataset";
import { getTopicAccentColor } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface DatasetCardProps {
  dataset: Dataset;
  compact?: boolean;
}

const standardizedFormats = ["JSON", "CSV", "XLSX"] as const;

export function DatasetCard({ dataset, compact = false }: DatasetCardProps) {
  const accentColor = getTopicAccentColor(dataset.topic);

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
            "flex h-full min-h-[240px] flex-col gap-5 p-5 sm:p-6",
            compact && "min-h-[210px]",
          )}
        >
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="blue"
              className="rounded-full px-3 py-1 text-xs font-semibold sm:text-sm"
            >
              {dataset.topic}
            </Badge>
            {standardizedFormats.map((format) => (
              <Badge
                key={format}
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold sm:text-sm"
              >
                {format}
              </Badge>
            ))}
          </div>

          <h3
            className={cn(
              "m-0 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-tight text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]",
              compact && "text-3xl sm:text-4xl",
            )}
          >
            {dataset.title}
          </h3>

          <p className="m-0 max-w-[80ch] text-base leading-relaxed text-[#5f5957] sm:text-[1.1rem]">
            {dataset.summary}
          </p>

          <div className="mt-auto">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs font-semibold sm:text-sm"
            >
              {dataset.organization}
            </Badge>
          </div>
        </article>
      </Card>
    </Link>
  );
}
