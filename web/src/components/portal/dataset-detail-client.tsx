"use client";

/**
 * DatasetDetailClient — Client container untuk tab Sumber Data.
 *
 * Urutan section:
 * 1. Dataset dalam Bentuk Tabel
 * 2. Eksplorasi Dataset
 * 3. Visualisasi Geospasial
 *
 * Data dibaca dari preview.rows (DatasetPreviewRow[]).
 * Schema dideteksi secara dinamis — tidak hardcode laki_laki/perempuan/total.
 */

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Filter, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DatasetExploration } from "@/components/portal/dataset-exploration";
import type { DatasetPreview } from "@/lib/types/dataset";
import {
  detectDatasetSchema,
  extractAvailableMetrics,
  extractAvailablePeriods,
  getFilteredDataset,
  aggregateByRegion,
  formatMetricLabel,
  formatNumber,
} from "@/lib/utils/dataset-schema";

const ChoroplethMap = dynamic(
  () => import("@/components/shared/choropleth-map"),
  { ssr: false },
);

// ─── Konversi DatasetPreviewRow → Record<string, unknown> ────────────────────

function previewRowsToRecords(
  preview: DatasetPreview,
): Record<string, unknown>[] {
  if (!preview.rows || preview.rows.length === 0) return [];

  // Tentukan apakah ada kolom gender atau kolom total/jumlah bawaan
  const hasGender = preview.columns?.some((c) => c.key === "male" || c.key === "female") || 
                    preview.rows.some((r) => r.male !== undefined || r.female !== undefined);
  const hasTotalInColumns = preview.columns?.some((c) => 
    c.key === "total" || 
    c.label.toLowerCase().includes("total") || 
    c.label.toLowerCase().includes("jumlah")
  );

  return preview.rows.map((row) => {
    const base: Record<string, unknown> = {
      wilayah: row.area,
    };
    if (typeof row.male === "number") base.laki_laki = row.male;
    if (typeof row.female === "number") base.perempuan = row.female;
    
    // Hanya tambahkan kolom total jika memang ada di berkas asli, atau jika ini data gender
    if (hasTotalInColumns || hasGender) {
      base.total = row.total;
    }

    // Salin kolom ekstra dari values
    if (row.values) {
      for (const [k, v] of Object.entries(row.values)) {
        if (k === "male" || k === "female" || k === "total") continue;
        base[k] = v;
      }
    }
    return base;
  });
}

// Helper untuk membersihkan judul kolom yang terlalu panjang dan merapikan tulisannya
function cleanColumnLabel(label: string): string {
  if (!label) return "";

  // Cocokkan pola: "Teks Sangat Panjang Sekali (Subheader)"
  const match = label.match(/^(.+?)\s*\((.+?)\)$/);
  let cleaned = label;
  if (match) {
    const prefix = match[1].trim();
    const subheader = match[2].trim();

    // Jika bagian luar tanda kurung sangat panjang (seperti judul tabel), 
    // ambil subheader di dalam tanda kurung saja.
    if (
      prefix.length > 35 || 
      prefix.toLowerCase().includes("jumlah anggota dewan") || 
      prefix.toLowerCase().includes("rekapitulasi") ||
      prefix.toLowerCase().includes("tabel")
    ) {
      cleaned = subheader;
    }
  }

  // Hapus akhiran tahun dalam kurung, seperti " (2025)" atau " (2022-2025)" atau " (2022)"
  cleaned = cleaned.replace(/\s*\(\d{4}(?:-\d{4})?\)$/, "");

  // Format teks agar rapi (Title Case jika ALL CAPS)
  if (cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
    cleaned = cleaned
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return cleaned;
}

// ─── Komponen Tabel Dinamis ───────────────────────────────────────────────────

function DynamicTable({
  data,
  schema,
  selectedMetric,
  selectedPeriod,
  columns,
  title,
  organization,
  topic,
  lastUpdated,
}: {
  data: Record<string, unknown>[];
  schema: ReturnType<typeof detectDatasetSchema>;
  selectedMetric: string;
  selectedPeriod: string;
  columns?: DatasetPreview["columns"];
  title?: string;
  organization?: string;
  topic?: string;
  lastUpdated?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const PAGE_SIZE = 15;

  // Semua kolom sesuai urutan kolom dari spreadsheet (metadata preview.columns) dengan fallback pengurutan cerdas
  const allColumns = useMemo(() => {
    let keys: string[] = [];
    if (columns && columns.length > 0) {
      keys = columns
        .map((col) => {
          let key = col.key;
          if (key === "area") key = "wilayah";
          else if (key === "male") key = "laki_laki";
          else if (key === "female") key = "perempuan";
          return key;
        })
        .filter((key) => {
          if (!data.length) return false;
          return key in data[0];
        });
    } else {
      if (!data.length) return [];
      keys = Object.keys(data[0]);
    }

    // Urutkan kolom secara semantik agar "wilayah" di paling kiri dan "total" di paling kanan
    return [...keys].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      const isAFirst = aLower === "wilayah" || aLower === "kecamatan" || aLower === "area" || aLower === "nama";
      const isBFirst = bLower === "wilayah" || bLower === "kecamatan" || bLower === "area" || bLower === "nama";
      const isALast = aLower === "total" || aLower === "jumlah";
      const isBLast = bLower === "total" || bLower === "jumlah";

      if (isAFirst && !isBFirst) return -1;
      if (isBFirst && !isAFirst) return 1;
      if (isALast && !isBLast) return 1;
      if (isBLast && !isALast) return -1;

      // Jika keduanya angka (tahun), urutkan secara numerik
      const aNum = Number(a);
      const bNum = Number(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.localeCompare(b);
    });
  }, [columns, data]);

  const columnLabels = useMemo(() => {
    const map = new Map<string, string>();

    // Tentukan label default untuk kolom pertama berdasarkan isinya secara dinamis
    let firstColLabel = "Wilayah / Kecamatan";
    if (data.length > 0) {
      const sampleValues = data.map((r) => String(r.wilayah || r.area || "").toLowerCase());
      const hasPartai = sampleValues.some((v) => v.includes("partai") || v.includes("golkar") || v.includes("pdi") || v.includes("gerindra"));
      const hasOPD = sampleValues.some((v) => v.includes("dinas") || v.includes("badan") || v.includes("kantor") || v.includes("sekretariat") || v.includes("opd"));
      
      if (hasPartai) {
        firstColLabel = "Partai Politik";
      } else if (hasOPD) {
        firstColLabel = "Produsen Data / OPD";
      } else {
        const isKecamatanOnly = sampleValues.some((v) => v.includes("peso") || v.includes("selor") || v.includes("sekatak") || v.includes("bunyu"));
        if (isKecamatanOnly) {
          firstColLabel = "Kecamatan";
        }
      }
    }

    if (columns) {
      columns.forEach((col) => {
        let key = col.key;
        if (key === "area") key = "wilayah";
        else if (key === "male") key = "laki_laki";
        else if (key === "female") key = "perempuan";

        let label = cleanColumnLabel(col.label);
        // Jika kolom pertama generic, ganti dengan yang semantik berdasarkan deteksi isi
        if (key === "wilayah" && (label === "Wilayah / Kecamatan" || label === "Wilayah" || label === "Kecamatan" || !label)) {
          label = firstColLabel;
        }
        map.set(key, label);
      });
    }

    if (!map.has("wilayah")) {
      map.set("wilayah", firstColLabel);
    }
    return map;
  }, [columns, data]);

  // Tentukan apakah kolom numerik
  const isNumericCol = (key: string) => {
    const sample = data.slice(0, 5);
    return sample.every((r) => {
      const v = r[key];
      return v === null || v === undefined || v === "" || !isNaN(Number(v));
    }) && data.some((r) => typeof r[key] === "number" || !isNaN(Number(r[key] ?? "x")));
  };

  // Filter baris
  const filtered = useMemo(() => {
    let rows = getFilteredDataset(data, schema, { selectedMetric, selectedPeriod });

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return rows;
  }, [data, schema, selectedMetric, selectedPeriod, search]);

  // Urutkan baris
  const sortedAndFiltered = useMemo(() => {
    if (!sortColumn) return filtered;

    const isNum = isNumericCol(sortColumn);

    return [...filtered].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === null || valA === undefined || valA === "") return 1;
      if (valB === null || valB === undefined || valB === "") return -1;

      if (isNum) {
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB, "id")
        : strB.localeCompare(strA, "id");
    });
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedAndFiltered.length / PAGE_SIZE);
  const pageRows = sortedAndFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  return (
    <section>
      <Card className="overflow-hidden border-[#d6ddeb] bg-white p-0 shadow-none">
        {/* Header */}
        <div className="border-b border-[#f0f2f5] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-5 py-4">
          <h3 className="m-0 text-base sm:text-lg font-semibold text-[#1e2f52] leading-snug">
            {title || "Dataset dalam Bentuk Tabel"}
          </h3>

          {/* Metadata Row */}
          {(organization || topic || lastUpdated) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5f7398]">
              {organization && (
                <span className="font-medium bg-[#eef3ff] px-2 py-0.5 rounded-md text-[#3b5fb2]">
                  {organization}
                </span>
              )}
              {topic && (
                <span className="font-medium bg-[#f6f5f3] px-2 py-0.5 rounded-md text-[#6c6564]">
                  {topic}
                </span>
              )}
              {lastUpdated && (
                <span>
                  Diperbarui: {new Date(lastUpdated).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          )}

          <p className="m-0 mt-3 text-xs leading-relaxed text-[#6b7280]">
            Pratinjau data utama agar pengguna dapat membaca isi dataset tanpa harus mengunduh file. Klik judul kolom untuk mengurutkan data.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eef0f5] bg-[#fcfdfe] px-5 py-3">
          <div className="relative min-w-0 flex-1" style={{ minWidth: "180px" }}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]"
              aria-hidden
            />
            <input
              id="dataset-table-search"
              type="text"
              placeholder="Cari data…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 w-full rounded-lg border border-[#d6ddeb] bg-white pl-8 pr-3 text-sm text-[#2f2a28] placeholder:text-[#b0b7c3] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
            />
          </div>
          <span className="ml-auto text-xs text-[#94a3b8]">
            {filtered.length} baris
          </span>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(420, allColumns.length * 120)}px` }}>
            <thead>
              <tr>
                {allColumns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`group cursor-pointer select-none border-b border-[#e2e8f3] bg-[#f5f8ff] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5f7398] transition hover:bg-[#e6eeff] ${isNumericCol(col) ? "text-right" : "text-left"}`}
                  >
                    <div className={`flex items-center gap-1.5 ${isNumericCol(col) ? "justify-end" : "justify-start"}`}>
                      <span>{columnLabels.get(col) || formatMetricLabel(col)}</span>
                      {sortColumn === col ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3.5 text-[#1f5fcb] shrink-0" />
                        ) : (
                          <ArrowDown className="size-3.5 text-[#1f5fcb] shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? (
                pageRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`transition-colors hover:bg-[#f5f8ff] ${i % 2 === 0 ? "bg-white" : "bg-[#fafbff]"}`}
                  >
                    {allColumns.map((col) => {
                      const val = row[col];
                      const isNum = isNumericCol(col);
                      const display =
                        val === null || val === undefined || val === ""
                          ? "-"
                          : isNum && typeof val === "number"
                          ? formatNumber(val)
                          : String(val);
                      return (
                        <td
                          key={col}
                          className={`border-b border-[#eef0f5] px-4 py-2.5 ${isNum ? "text-right tabular-nums" : "text-left"} text-[#374151]`}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={allColumns.length}
                    className="px-4 py-10 text-center text-sm text-[#9ca3af]"
                  >
                    {search
                      ? `Tidak ditemukan data dengan kata kunci "${search}".`
                      : "Data tabel belum tersedia."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#f0f2f5] bg-[#fcfdfe] px-5 py-2.5">
            <p className="m-0 text-[11px] text-[#9ca3af]">
              Halaman {page} dari {totalPages} ({sortedAndFiltered.length} baris)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-[#d6ddeb] px-3 py-1 text-xs font-medium text-[#374151] disabled:opacity-40 hover:bg-[#f0f4ff]"
              >
                ‹ Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-[#d6ddeb] px-3 py-1 text-xs font-medium text-[#374151] disabled:opacity-40 hover:bg-[#f0f4ff]"
              >
                Next ›
              </button>
            </div>
          </div>
        )}

        {/* Footer note */}
        {totalPages <= 1 && (
          <div className="border-t border-[#f0f2f5] bg-[#fcfdfe] px-5 py-2.5">
            <p className="m-0 text-[11px] text-[#9ca3af]">
              Data ditampilkan berdasarkan sumber dataset yang telah diverifikasi.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DatasetDetailClientProps {
  preview: DatasetPreview;
  title?: string;
  organization?: string;
  topic?: string;
  lastUpdated?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DatasetDetailClient({ 
  preview,
  title,
  organization,
  topic,
  lastUpdated,
}: DatasetDetailClientProps) {
  const data = useMemo(() => previewRowsToRecords(preview), [preview]);
  const schema = useMemo(() => detectDatasetSchema(data), [data]);
  const availableMetrics = useMemo(
    () => extractAvailableMetrics(data, schema),
    [data, schema],
  );
  const availablePeriods = useMemo(
    () => extractAvailablePeriods(data, schema),
    [data, schema],
  );

  const [selectedMetric, setSelectedMetric] = useState(
    availableMetrics[0] ?? "",
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[availablePeriods.length - 1] ?? "",
  );
  const [selectedAggregation, setSelectedAggregation] = useState<
    "latest" | "sum" | "average" | "min" | "max"
  >("latest");

  const filteredData = useMemo(
    () =>
      getFilteredDataset(data, schema, {
        selectedMetric,
        selectedPeriod,
      }),
    [data, schema, selectedMetric, selectedPeriod],
  );

  // Agregasi per wilayah untuk peta
  const valuesByRegion = useMemo(() => {
    if (!selectedMetric || !schema.hasRegion) return new Map();
    const raw = aggregateByRegion(
      filteredData.length ? filteredData : data,
      schema,
      selectedMetric,
      selectedAggregation,
    );
    return new Map(
      [...raw.entries()].map(([k, v]) => [
        k,
        { value: v.value, regionName: v.regionName },
      ]),
    );
  }, [filteredData, data, schema, selectedMetric, selectedAggregation]);

  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d6deed] bg-[#f8fafd] p-6 text-center text-sm text-[#9ca3af]">
        Dataset belum dapat diproses untuk pratinjau.
      </div>
    );
  }

  const showMetricFilter = availableMetrics.length > 1;
  const showPeriodFilter = availablePeriods.length > 0;
  const showAggFilter = availablePeriods.length > 1;

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Tabel ──────────────────────────────────────────── */}
      <DynamicTable
        data={data}
        schema={schema}
        selectedMetric={selectedMetric}
        selectedPeriod={selectedPeriod}
        columns={preview.columns}
        title={title}
        organization={organization}
        topic={topic}
        lastUpdated={lastUpdated}
      />

      {/* ── Global Controls ─────────────────────────────────── */}
      {(showMetricFilter || showPeriodFilter || showAggFilter) && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#d6ddeb] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-5 py-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5f7398]">
            <Filter className="size-3.5" />
            Filter
          </span>

          {showMetricFilter && (
            <div className="relative">
              <select
                id="dataset-metric-filter"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-[#d6ddeb] bg-white pl-3 pr-7 text-sm text-[#2f2a28] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
              >
                {availableMetrics.map((m) => {
                  const colInfo = preview.columns?.find(c => c.key === m);
                  const label = colInfo ? cleanColumnLabel(colInfo.label) : formatMetricLabel(m);
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]" aria-hidden />
            </div>
          )}

          {showPeriodFilter && (
            <div className="relative">
              <select
                id="dataset-period-filter"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-[#d6ddeb] bg-white pl-3 pr-7 text-sm text-[#2f2a28] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
              >
                <option value="">Semua Periode</option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]" aria-hidden />
            </div>
          )}

          {showAggFilter && (
            <div className="relative">
              <select
                id="dataset-aggregation-filter"
                value={selectedAggregation}
                onChange={(e) => setSelectedAggregation(e.target.value as typeof selectedAggregation)}
                className="h-8 appearance-none rounded-lg border border-[#d6ddeb] bg-white pl-3 pr-7 text-sm text-[#2f2a28] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
              >
                <option value="latest">Nilai Terbaru</option>
                <option value="sum">Total (Sum)</option>
                <option value="average">Rata-rata</option>
                <option value="min">Minimum</option>
                <option value="max">Maksimum</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]" aria-hidden />
            </div>
          )}
        </div>
      )}

      {/* ── 2. Eksplorasi ─────────────────────────────────────── */}
      <DatasetExploration
        data={data}
        schema={schema}
        selectedMetric={selectedMetric}
        selectedPeriod={selectedPeriod}
        filteredData={filteredData.length ? filteredData : data}
      />

      {/* ── 3. Peta Choropleth ────────────────────────────────── */}
      {schema.hasRegion ? (
        <Card className="overflow-hidden border-[#d6ddeb] bg-white p-0">
          <div className="border-b border-[#f0f2f5] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-5 py-4">
            <h3 className="m-0 text-base font-semibold text-[#1e2f52]">Visualisasi Geospasial</h3>
            <p className="m-0 mt-0.5 text-[13px] text-[#6b7280]">
              Sebaran{selectedMetric ? ` ${formatMetricLabel(selectedMetric)}` : " data"} di seluruh kecamatan Kabupaten Bulungan.
            </p>
          </div>
          <div className="relative h-[460px] w-full sm:h-[500px]">
            <ChoroplethMap
              valuesByRegion={valuesByRegion}
              metricLabel={selectedMetric ? formatMetricLabel(selectedMetric) : undefined}
              periodLabel={selectedPeriod || undefined}
              className="h-full w-full"
            />
          </div>
          <div className="border-t border-[#f0f2f5] bg-[#fcfdfe] px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[11px] text-[#6b7280]">
                Peta choropleth berbasis GeoJSON polygon asli batas kecamatan Kabupaten Bulungan.
                <span className="ml-1 font-medium text-[#374151]">Warna lebih gelap = nilai lebih tinggi.</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#9ca3af]">Rendah</span>
                <div className="flex h-3 w-24 overflow-hidden rounded-full border border-[#e2e8f3]">
                  <div className="flex-1 bg-[#dbeafe]" />
                  <div className="flex-1 bg-[#93c5fd]" />
                  <div className="flex-1 bg-[#3b82f6]" />
                  <div className="flex-1 bg-[#1d4ed8]" />
                  <div className="flex-1 bg-[#1e3a8a]" />
                </div>
                <span className="text-[11px] text-[#9ca3af]">Tinggi</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-[#d6ddeb] bg-white p-5">
          <p className="m-0 text-sm text-[#9ca3af]">
            Dataset ini tidak memiliki kolom wilayah yang dapat divisualisasikan secara geospasial.
          </p>
        </Card>
      )}
    </div>
  );
}
