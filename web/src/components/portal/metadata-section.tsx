import type { DatasetMetadata } from "@/lib/types/dataset";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";

interface MetadataSectionProps {
  metadata: DatasetMetadata;
}

export function MetadataSection({ metadata }: MetadataSectionProps) {
  const blocks = [
    { label: "OPD", value: metadata.opd },
    { label: "Walidata", value: metadata.walidata },
    { label: "Cakupan Wilayah", value: metadata.coverage },
    { label: "Periode Data", value: metadata.period },
    { label: "Lisensi", value: metadata.license },
    { label: "Status", value: metadata.status },
    { label: "Frekuensi", value: metadata.frequency },
    { label: "Update", value: formatIndonesianDate(metadata.lastUpdated) },
    { label: "ID Dataset", value: metadata.identifier },
    { label: "Kata Kunci", value: metadata.tags.join(", ") || "Tidak tersedia" },
  ];

  return (
    <section>
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Metadata Inti"
          description="Ringkasan metadata disusun agar cepat dipahami sebelum data digunakan."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {blocks.map((block) => (
            <article key={block.label} className="rounded-xl border border-[#d8deea] bg-[#f7f9fc] p-3">
              <h3 className="m-0 text-sm font-semibold text-[#696361]">{block.label}</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{block.value}</p>
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}
