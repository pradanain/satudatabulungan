import type { DatasetResource } from "@/lib/types/dataset";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { hasUsableResourceUrl } from "@/lib/utils/resource-links";

interface ResourceListProps {
  resources: DatasetResource[];
}

export function ResourceList({ resources }: ResourceListProps) {
  return (
    <section>
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Resource Data"
          description="Daftar resource disusun seperti tabel file agar cepat dipilih sesuai kebutuhan pengguna."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />

        <div className="mt-4 grid gap-3">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Badge variant="outline" className="min-w-[62px] justify-center px-2 py-1 text-xs font-semibold">
                  {resource.format}
                </Badge>
                <div>
                  <h3 className="m-0 text-base font-semibold text-[var(--color-text)]">{resource.name}</h3>
                  <p className="m-0 mt-1 text-sm text-[var(--color-muted)]">{resource.description}</p>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2 text-sm text-[#605a58]">
                <span>{resource.sizeLabel}</span>
                {resource.lastUpdated ? <span>{formatIndonesianDate(resource.lastUpdated)}</span> : null}
                {hasUsableResourceUrl(resource.url) ? (
                  <Button asChild variant="secondary" size="sm" className="rounded-lg">
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      Lihat
                    </a>
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="rounded-lg" disabled>
                    Belum tersedia
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}
