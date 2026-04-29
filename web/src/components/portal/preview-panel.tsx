import type { DatasetPreview } from "@/lib/types/dataset";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";

interface PreviewPanelProps {
  preview: DatasetPreview;
}

export function PreviewPanel({ preview }: PreviewPanelProps) {
  const maxValue = Math.max(...preview.points.map((point) => point.value), 1);

  return (
    <section>
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Preview Data & Visualisasi"
          description="Pratinjau visual membantu pengguna membaca pola data sebelum mengunduh resource lengkap."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <article className="rounded-2xl border border-[#d6ddea] bg-[#f7f9fd] p-4">
            <div
              className="grid min-h-44 grid-cols-8 items-end gap-2 border-b border-[#d6deed] px-2 py-3 sm:min-h-56"
              aria-label="Grafik tren data"
            >
              {preview.points.map((point) => (
                <div key={point.label} className="grid justify-items-center gap-2">
                  <div
                    className="w-full max-w-9 rounded-t-full bg-gradient-to-b from-[#2f66d2] to-[#8db0ef]"
                    style={{ height: `${Math.round((point.value / maxValue) * 100)}%` }}
                  />
                  <span className="text-xs text-[var(--color-muted)]">{point.label}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="mt-3 w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#dce3ef] px-2 py-2 text-left font-semibold">Kecamatan</th>
                    <th className="border-b border-[#dce3ef] px-2 py-2 text-left font-semibold">Laki-laki</th>
                    <th className="border-b border-[#dce3ef] px-2 py-2 text-left font-semibold">Perempuan</th>
                    <th className="border-b border-[#dce3ef] px-2 py-2 text-left font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.area}>
                      <td className="border-b border-[#dce3ef] px-2 py-2">{row.area}</td>
                      <td className="border-b border-[#dce3ef] px-2 py-2">{formatCompactNumber(row.male)}</td>
                      <td className="border-b border-[#dce3ef] px-2 py-2">{formatCompactNumber(row.female)}</td>
                      <td className="border-b border-[#dce3ef] px-2 py-2">{formatCompactNumber(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-[#d6ddea] bg-[#f8fafd] p-4">
            <h3 className="m-0 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight">
              Ringkasan Insight
            </h3>
            <ul className="mt-3 grid list-none gap-2 p-0">
              {preview.insights.map((insight) => (
                <li
                  key={`${insight.label}-${insight.value}`}
                  className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-xl border border-[#d6deea] bg-white p-3"
                >
                  <strong className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-primary)]">
                    {insight.value}
                  </strong>
                  <div>
                    <h4 className="m-0 text-sm font-semibold sm:text-base">{insight.label}</h4>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{insight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Card>
    </section>
  );
}
