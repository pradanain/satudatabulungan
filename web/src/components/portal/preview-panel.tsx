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
  const chartTitle = preview.chartTitle ?? "Grafik Distribusi";
  const chartUnit = preview.chartUnit ?? "Skala";

  const dynamicColumns = preview.columns ?? [];
  const fallbackColumns = [
    { key: "area", label: "Wilayah", isNumeric: false },
    { key: "male", label: "Laki-laki", isNumeric: true },
    { key: "female", label: "Perempuan", isNumeric: true },
    { key: "total", label: "Total", isNumeric: true },
  ];
  const tableColumns = dynamicColumns.length > 0 ? dynamicColumns : fallbackColumns;

  const chartSeries = hasRows
    ? preview.rows.map((row) => ({ label: row.area, value: row.total }))
    : preview.points.map((point) => ({ label: point.label, value: point.value }));

  const maxValue = Math.max(...chartSeries.map((item) => item.value), 1);
  const totalPopulation = preview.rows.reduce((acc, row) => acc + row.total, 0);
  const rankedRows = [...preview.rows].sort((a, b) => b.total - a.total);

  function readCellValue(
    row: (typeof preview.rows)[number],
    key: string,
  ): number | string | undefined {
    if (key === "area") return row.area;
    if (key === "total") return row.total;
    if (key === "male") return row.male;
    if (key === "female") return row.female;
    return row.values?.[key];
  }

  function renderCellValue(
    row: (typeof preview.rows)[number],
    column: (typeof tableColumns)[number],
  ): string {
    const value = readCellValue(row, column.key);
    if (typeof value === "number") {
      return formatCompactNumber(value);
    }
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return `${value}`;
  }

  const metricColumns = tableColumns.filter(
    (column) =>
      column.isNumeric &&
      column.key !== "total" &&
      preview.rows.some((row) => typeof readCellValue(row, column.key) === "number"),
  );
  const maxMetricValue = Math.max(
    1,
    ...preview.rows.flatMap((row) =>
      metricColumns.map((column) => {
        const value = readCellValue(row, column.key);
        return typeof value === "number" ? value : 0;
      }),
    ),
  );

  function metricColor(key: string) {
    const normalized = key.toLowerCase();
    if (normalized.includes("mantap") || normalized.includes("bagus")) {
      return {
        bar: "bg-[linear-gradient(90deg,#1f8f5f_0%,#41c98a_100%)]",
        badge: "bg-[#e9f9f1] text-[#1d7b52]",
      };
    }
    if (normalized.includes("ringan")) {
      return {
        bar: "bg-[linear-gradient(90deg,#d9a622_0%,#f1cb66_100%)]",
        badge: "bg-[#fff6e0] text-[#9d6e00]",
      };
    }
    if (normalized.includes("berat")) {
      return {
        bar: "bg-[linear-gradient(90deg,#c94848_0%,#e77878_100%)]",
        badge: "bg-[#fdecec] text-[#a22c2c]",
      };
    }
    return {
      bar: "bg-[linear-gradient(90deg,#2f66d2_0%,#88acee_100%)]",
      badge: "bg-[#edf2ff] text-[#2f66d2]",
    };
  }

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
            {hasRows && metricColumns.length > 0 ? (
              <div className="rounded-2xl border border-[#dce4f1] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)] px-3 py-3.5 sm:px-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7398]">
                  <span>{chartTitle}</span>
                  <span>{chartUnit}</span>
                </div>

                <div className="max-h-[460px] overflow-y-auto pr-1">
                  <div className="grid gap-2 lg:grid-cols-2">
                    {rankedRows.map((row) => (
                      <div key={`grouped-${row.area}`} className="rounded-xl border border-[#d9e1ef] bg-white p-2.5 shadow-[0_4px_12px_rgba(40,54,88,0.06)]">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="m-0 text-sm font-semibold text-[#213255]">{row.area}</p>
                          <span className="text-xs font-semibold text-[#6279a2]">Total {formatCompactNumber(row.total)}</span>
                        </div>

                        <div className="grid gap-1.5 sm:grid-cols-3">
                          {metricColumns.map((column) => {
                            const raw = readCellValue(row, column.key);
                            const value = typeof raw === "number" ? raw : 0;
                            const ratio = Math.max(4, Math.round((value / maxMetricValue) * 100));
                            const color = metricColor(column.key);
                            return (
                              <div key={`${row.area}-${column.key}`} className="grid gap-1">
                                <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${color.badge}`}>
                                  {column.label}
                                </span>
                                <div className="h-2 overflow-hidden rounded-full bg-[#e7edf8]">
                                  <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${ratio}%` }} />
                                </div>
                                <span className="text-[11px] font-semibold text-[#3d5278]">{formatCompactNumber(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : chartSeries.length ? (
              <div className="rounded-2xl border border-[#dce4f1] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)] px-2.5 py-3 sm:px-3">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7398]">
                  <span>{chartTitle}</span>
                  <span>{chartUnit}</span>
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
                    {tableColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`border-y border-[#dce3ef] bg-[#f5f8ff] px-2 py-2 font-semibold ${column.isNumeric ? "text-right" : "text-left"}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasRows ? (
                    preview.rows.map((row) => (
                      <tr key={row.area}>
                        {tableColumns.map((column) => (
                          <td
                            key={`${row.area}-${column.key}`}
                            className={`border-b border-[#e2e8f3] px-2 py-2.5 ${column.isNumeric ? "text-right" : "text-left"} ${column.key === "area" ? "font-medium" : ""} ${column.key === "total" ? "font-semibold" : ""}`}
                          >
                            {renderCellValue(row, column)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumns.length} className="border-b border-[#e2e8f3] px-2 py-4 text-center text-(--color-muted)">
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

