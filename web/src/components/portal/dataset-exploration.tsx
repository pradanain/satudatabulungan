"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import {
  type DatasetSchema,
  formatNumber,
  formatMetricLabel,
} from "@/lib/utils/dataset-schema";

interface DatasetExplorationProps {
  data: Record<string, unknown>[];
  schema: DatasetSchema;
  selectedMetric: string;
  selectedPeriod: string;
  filteredData: Record<string, unknown>[];
}

export function DatasetExploration({
  data,
  schema,
  selectedMetric,
  selectedPeriod,
  filteredData,
}: DatasetExplorationProps) {
  const metricLabel = formatMetricLabel(selectedMetric);

  // Ambil nilai per wilayah dari filteredData
  const regionValues = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();

    for (const row of filteredData) {
      const name = schema.regionNameKey
        ? String(row[schema.regionNameKey] ?? "")
        : schema.regionCodeKey
        ? String(row[schema.regionCodeKey] ?? "")
        : "";
      if (!name) continue;

      let value: number;
      if (schema.format === "long" && schema.valueKey) {
        value = Number(row[schema.valueKey]);
      } else {
        value = Number(row[selectedMetric]);
      }

      if (!isFinite(value)) continue;

      const existing = map.get(name);
      if (!existing || value > existing.value) {
        map.set(name, { name, value });
      }
    }

    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [filteredData, schema, selectedMetric]);

  const hasData = regionValues.length > 0;
  const total = regionValues.reduce((s, r) => s + r.value, 0);
  const avg = hasData ? total / regionValues.length : 0;
  const maxItem = regionValues[0];
  const minItem = regionValues[regionValues.length - 1];
  const maxVal = maxItem?.value ?? 1;

  // Grafik batang horizontal
  const isSeries = schema.hasPeriod && data.length > 0;

  // Untuk dataset series: hitung tren per periode
  const periodTrend = useMemo(() => {
    if (!isSeries || !schema.periodKey) return [];
    const grouped = new Map<string, number[]>();
    for (const row of data) {
      const period = String(row[schema.periodKey!] ?? "");
      if (!period) continue;
      let value: number;
      if (schema.format === "long" && schema.valueKey && schema.indicatorKey) {
        if (String(row[schema.indicatorKey]) !== selectedMetric) continue;
        value = Number(row[schema.valueKey]);
      } else {
        value = Number(row[selectedMetric]);
      }
      if (!isFinite(value)) continue;
      if (!grouped.has(period)) grouped.set(period, []);
      grouped.get(period)!.push(value);
    }
    return [...grouped.entries()]
      .map(([period, vals]) => ({
        period,
        total: vals.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data, schema, selectedMetric, isSeries]);

  const trendMax = Math.max(...periodTrend.map((t) => t.total), 1);

  if (!hasData) {
    return (
      <section>
        <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
          <SectionHeading
            title="Eksplorasi Dataset"
            description="Statistik deskriptif dan visualisasi dataset."
            titleClassName="text-2xl sm:text-3xl"
            descriptionClassName="text-sm sm:text-base"
          />
          <div className="mt-5 grid min-h-40 place-items-center rounded-2xl border border-dashed border-[#d6deed] bg-[#f8fafd] p-4 text-sm text-[#9ca3af]">
            {schema.hasRegion
              ? "Pilih indikator dan periode untuk melihat eksplorasi dataset."
              : "Dataset ini tidak memiliki kolom wilayah untuk eksplorasi geospasial."}
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
        <SectionHeading
          title="Eksplorasi Dataset"
          description={`Distribusi ${metricLabel}${selectedPeriod ? ` — Periode ${selectedPeriod}` : ""}`}
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Grafik */}
          <article className="rounded-2xl border border-[#d6deed] bg-white p-4 shadow-[0_10px_24px_rgba(41,59,94,0.06)]">
            {/* Tren per periode jika ada */}
            {isSeries && periodTrend.length > 1 ? (
              <div className="rounded-2xl border border-[#dce4f1] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)] px-2.5 py-3 sm:px-3">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7398]">
                  <span>Tren {metricLabel}</span>
                  <span>Per Periode</span>
                </div>
                <div className="grid min-h-52 grid-cols-[repeat(auto-fit,minmax(64px,1fr))] items-end gap-1.5 sm:min-h-64">
                  {periodTrend.map((item) => {
                    const ratio = Math.max(8, Math.round((item.total / trendMax) * 100));
                    return (
                      <div key={item.period} className="grid justify-items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#5d7295]">
                          {item.total >= 1000
                            ? `${(item.total / 1000).toFixed(1)}k`
                            : item.total}
                        </span>
                        <div className="flex h-32 items-end sm:h-40">
                          <div
                            className="w-7 rounded-full border border-[#2f66d2]/40 bg-linear-to-t from-[#2459c1] via-[#4c7fda] to-[#88acee] shadow-[0_8px_14px_rgba(36,89,193,0.3)]"
                            style={{ height: `${ratio}%` }}
                          />
                        </div>
                        <span className="max-w-[88px] text-center text-[10px] font-medium leading-tight text-[#6b7280]">
                          {item.period}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Grafik distribusi per wilayah */
              <div className="rounded-2xl border border-[#dce4f1] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)] px-2.5 py-3 sm:px-3">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7398]">
                  <span>Distribusi {metricLabel}</span>
                  <span>Per Wilayah</span>
                </div>
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  <div className="grid gap-2">
                    {regionValues.map((item) => {
                      const ratio = Math.max(4, Math.round((item.value / maxVal) * 100));
                      return (
                        <div key={item.name} className="grid gap-1 rounded-xl border border-[#d9e1ef] bg-white p-2.5 shadow-[0_4px_12px_rgba(40,54,88,0.05)]">
                          <div className="flex items-center justify-between gap-2">
                            <p className="m-0 text-sm font-semibold text-[#213255]">{item.name}</p>
                            <span className="text-xs font-semibold text-[#6279a2]">
                              {formatNumber(item.value)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#e7edf8]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#2f66d2_0%,#88acee_100%)]"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Insight Cards */}
          <div className="grid content-start gap-3">
            {/* Ringkasan */}
            <article className="rounded-2xl border border-[#d6deed] bg-[linear-gradient(180deg,#f9fbff_0%,#f4f8ff_100%)] p-4 shadow-[0_10px_24px_rgba(41,59,94,0.06)]">
              <h3 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold leading-tight">
                Ringkasan Insight
              </h3>
              <ul className="mt-3 grid list-none gap-2.5 p-0">
                {maxItem && (
                  <li className="flex flex-col gap-1 sm:grid sm:grid-cols-[90px_minmax(0,1fr)] sm:items-start sm:gap-3 rounded-xl border border-[#d6deea] bg-white p-3.5">
                    <strong className="font-(family-name:--font-heading) text-2xl font-semibold text-[#c32525] break-words">
                      {maxItem.value >= 1000
                        ? `${(maxItem.value / 1000).toFixed(1)}k`
                        : formatNumber(maxItem.value)}
                    </strong>
                    <div className="min-w-0">
                      <h4 className="m-0 text-sm font-semibold">Nilai Tertinggi</h4>
                      <p className="mt-1 text-sm text-[#6b7280] break-words">{maxItem.name}</p>
                    </div>
                  </li>
                )}
                {minItem && minItem !== maxItem && (
                  <li className="flex flex-col gap-1 sm:grid sm:grid-cols-[90px_minmax(0,1fr)] sm:items-start sm:gap-3 rounded-xl border border-[#d6deea] bg-white p-3.5">
                    <strong className="font-(family-name:--font-heading) text-2xl font-semibold text-[#2f9e62] break-words">
                      {minItem.value >= 1000
                        ? `${(minItem.value / 1000).toFixed(1)}k`
                        : formatNumber(minItem.value)}
                    </strong>
                    <div className="min-w-0">
                      <h4 className="m-0 text-sm font-semibold">Nilai Terendah</h4>
                      <p className="mt-1 text-sm text-[#6b7280] break-words">{minItem.name}</p>
                    </div>
                  </li>
                )}
                <li className="flex flex-col gap-1 sm:grid sm:grid-cols-[90px_minmax(0,1fr)] sm:items-start sm:gap-3 rounded-xl border border-[#d6deea] bg-white p-3.5">
                  <strong className="font-(family-name:--font-heading) text-2xl font-semibold text-[#2f66d2] break-words">
                    {avg >= 1000 ? `${(avg / 1000).toFixed(1)}k` : formatNumber(Math.round(avg))}
                  </strong>
                  <div className="min-w-0">
                    <h4 className="m-0 text-sm font-semibold">Rata-rata</h4>
                    <p className="mt-1 text-sm text-[#6b7280] break-words">Dari {regionValues.length} wilayah</p>
                  </div>
                </li>
              </ul>
            </article>

            {/* Distribusi kontribusi */}
            <article className="rounded-2xl border border-[#d6deed] bg-white p-4 shadow-[0_8px_20px_rgba(41,59,94,0.05)]">
              <h3 className="m-0 text-lg font-semibold text-[#1e2f52]">Top Wilayah</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[200px] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-[#dee5f2] py-1.5 text-left font-semibold">Wilayah</th>
                      <th className="border-b border-[#dee5f2] py-1.5 text-right font-semibold">{metricLabel}</th>
                      <th className="border-b border-[#dee5f2] py-1.5 text-right font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionValues.slice(0, 5).map((item) => {
                      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                      return (
                        <tr key={`top-${item.name}`}>
                          <td className="border-b border-[#e7edf7] py-1.5 font-medium">{item.name}</td>
                          <td className="border-b border-[#e7edf7] py-1.5 text-right tabular-nums">{formatNumber(item.value)}</td>
                          <td className="border-b border-[#e7edf7] py-1.5 text-right tabular-nums text-[#6b7280]">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </div>
      </Card>
    </section>
  );
}
