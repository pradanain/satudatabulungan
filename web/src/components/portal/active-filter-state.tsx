import Link from "next/link";
import type { DatasetFilters } from "@/lib/types/dataset";
import { buildDatasetQuery } from "@/lib/utils/query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ActiveFilterStateProps {
  filters: DatasetFilters;
  pageSize: number;
  totalResults: number;
}

const labels: Record<string, string> = {
  q: "Kata kunci",
  topic: "Topik",
  organization: "Organisasi",
  year: "Tahun",
};

export function ActiveFilterState({ filters, pageSize, totalResults }: ActiveFilterStateProps) {
  const activeKeys: Array<keyof DatasetFilters> = ["q", "topic", "organization", "year"];
  const entries = (Object.entries(filters) as Array<[keyof DatasetFilters, string | undefined]>).filter(
    ([key, value]) => activeKeys.includes(key) && Boolean(value),
  );

  return (
    <Card className="border-dashed bg-[var(--color-surface)] p-4 sm:p-5" aria-label="Status filter aktif">
      <p className="m-0 text-sm text-[var(--color-muted)]">
        {totalResults.toLocaleString("id-ID")} hasil - {pageSize} per halaman
      </p>

      {entries.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map(([key, value]) => {
            const nextFilters = { ...filters, [key]: undefined };
            const query = buildDatasetQuery({ ...nextFilters, page: 1, pageSize });
            return (
              <Link key={`${key}-${value}`} href={`/dataset${query}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {labels[key]}: {value} x
                </Badge>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted)]">Tidak ada filter aktif.</p>
      )}
    </Card>
  );
}
