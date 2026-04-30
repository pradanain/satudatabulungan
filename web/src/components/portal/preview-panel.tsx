import type { DatasetPreview } from "@/lib/types/dataset";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";

interface PreviewPanelProps {
  preview: DatasetPreview;
}

export function PreviewPanel({ preview }: PreviewPanelProps) {
  const hasRows = preview.rows.length > 0;
  const hasInsights = preview.insights.length > 0;

  const chartSeries = hasRows
    ? preview.rows.map((row) => ({ label: row.area, value: row.total }))
    : preview.points.map((point) => ({ label: point.label, value: point.value }));

  const maxValue = Math.max(...chartSeries.map((item) => item.value), 1);
  const totalPopulation = preview.rows.reduce((acc, row) => acc + row.total, 0);
  const rankedRows = [...preview.rows].sort((a, b) => b.total - a.total);

  return (
    <section>
      <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
        <SectionHeading
          title="Eksplorasi Dataset"
          description="Statistik deskriptif dan visualisasi dataset untuk memudahkan pemahaman."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <article className="rounded-2xl border border-[#d6deed] bg-white p-4 shadow-[0_10px_24px_rgba(41,59,94,0.06)]">
            {chartSeries.length ? (
              <div className="rounded-2xl border border-[#dce4f1] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)] px-2.5 py-3 sm:px-3">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7398]">
                  <span>Grafik Populasi</span>
                  <span>Skala Jiwa</span>
                </div>
                <div className="grid min-h-52 grid-cols-[repeat(auto-fit,minmax(72px,1fr))] items-end gap-2 sm:min-h-64">
                  {chartSeries.map((item) => {
                    const ratio = Math.max(10, Math.round((item.value / maxValue) * 100));

                    return (
                      <div key={item.label} className="grid justify-items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#5d7295] sm:text-xs">
                          {formatCompactNumber(item.value)}
                        </span>
                        <div className="flex h-32 items-end sm:h-40">
                          <div
                            className="w-7 rounded-full border border-[#2f66d2]/40 bg-linear-to-t from-[#2459c1] via-[#4c7fda] to-[#88acee] shadow-[0_8px_14px_rgba(36,89,193,0.3)]"
                            style={{ height: `${ratio}%` }}
                          />
                        </div>
                        <span className="max-w-22.5 text-center text-xs font-medium leading-tight text-(--color-muted)">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#d6deed] bg-[#f8fafd] p-4 text-sm text-(--color-muted)">
                Visualisasi belum tersedia untuk dataset ini.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="mt-4 w-full min-w-105 border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-y border-[#dce3ef] bg-[#f5f8ff] px-2 py-2 text-left font-semibold">Kecamatan</th>
                    <th className="border-y border-[#dce3ef] bg-[#f5f8ff] px-2 py-2 text-left font-semibold">Laki-laki</th>
                    <th className="border-y border-[#dce3ef] bg-[#f5f8ff] px-2 py-2 text-left font-semibold">Perempuan</th>
                    <th className="border-y border-[#dce3ef] bg-[#f5f8ff] px-2 py-2 text-left font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {hasRows ? (
                    preview.rows.map((row) => (
                      <tr key={row.area}>
                        <td className="border-b border-[#e2e8f3] px-2 py-2.5 font-medium">{row.area}</td>
                        <td className="border-b border-[#e2e8f3] px-2 py-2.5">{formatCompactNumber(row.male)}</td>
                        <td className="border-b border-[#e2e8f3] px-2 py-2.5">{formatCompactNumber(row.female)}</td>
                        <td className="border-b border-[#e2e8f3] px-2 py-2.5 font-semibold">{formatCompactNumber(row.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border-b border-[#e2e8f3] px-2 py-4 text-center text-(--color-muted)">
                        Data tabel belum tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid content-start gap-3">
            <article className="rounded-2xl border border-[#d6deed] bg-[linear-gradient(180deg,#f9fbff_0%,#f4f8ff_100%)] p-4 shadow-[0_10px_24px_rgba(41,59,94,0.06)]">
              <h3 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight">
                Ringkasan Insight
              </h3>
              {hasInsights ? (
                <ul className="mt-3 grid list-none gap-2.5 p-0">
                  {preview.insights.map((insight) => (
                    <li
                      key={`${insight.label}-${insight.value}`}
                      className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-xl border border-[#d6deea] bg-white p-3.5"
                    >
                      <strong className="font-(family-name:--font-heading) text-2xl font-semibold text-[#c32525]">
                        {insight.value}
                      </strong>
                      <div>
                        <h4 className="m-0 text-sm font-semibold sm:text-base">{insight.label}</h4>
                        <p className="mt-1 text-sm text-(--color-muted)">{insight.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 mt-3 rounded-xl border border-dashed border-[#d6deea] bg-white p-3 text-sm text-(--color-muted)">
                  Insight belum tersedia.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-[#d6deed] bg-white p-4 shadow-[0_8px_20px_rgba(41,59,94,0.05)]">
              <h3 className="m-0 text-lg font-semibold text-[#1e2f52]">Distribusi Kontribusi</h3>
              {hasRows && totalPopulation > 0 ? (
                <ul className="mt-3 grid list-none gap-2.5 p-0">
                  {rankedRows.map((row) => {
                    const percent = Math.round((row.total / totalPopulation) * 1000) / 10;
                    return (
                      <li key={`share-${row.area}`} className="grid gap-1.5">
                        <div className="flex items-center justify-between text-xs text-[#566b93]">
                          <span className="font-medium">{row.area}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#e8eef9]">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#2f66d2_0%,#88acee_100%)]" style={{ width: `${percent}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mb-0 mt-3 text-sm text-(--color-muted)">Distribusi belum tersedia.</p>
              )}
            </article>

            <article className="rounded-2xl border border-[#d6deed] bg-white p-4 shadow-[0_8px_20px_rgba(41,59,94,0.05)]">
              <h3 className="m-0 text-lg font-semibold text-[#1e2f52]">Top Wilayah</h3>
              {hasRows ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-65 border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-[#deE5f2] py-1.5 text-left font-semibold">Wilayah</th>
                        <th className="border-b border-[#deE5f2] py-1.5 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedRows.slice(0, 3).map((row) => (
                        <tr key={`top-${row.area}`}>
                          <td className="border-b border-[#e7edf7] py-1.5 font-medium">{row.area}</td>
                          <td className="border-b border-[#e7edf7] py-1.5 text-right font-semibold">{formatCompactNumber(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-0 mt-3 text-sm text-(--color-muted)">Data ranking belum tersedia.</p>
              )}
            </article>
          </div>
        </div>
      </Card>
    </section>
  );
}

