"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils/formatters";
import type { DatasetPreview, DatasetPreviewColumn } from "@/lib/types/dataset";

interface DatasetTablePreviewProps {
  preview: DatasetPreview;
  years?: number[];
}

export function DatasetTablePreview({ preview, years = [] }: DatasetTablePreviewProps) {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const dynamicColumns = preview.columns ?? [];
  const fallbackColumns: DatasetPreviewColumn[] = [
    { key: "area", label: "Wilayah", isNumeric: false },
    { key: "male", label: "Laki-laki", isNumeric: true },
    { key: "female", label: "Perempuan", isNumeric: true },
    { key: "total", label: "Total", isNumeric: true },
  ];
  const tableColumns = dynamicColumns.length > 0 ? dynamicColumns : fallbackColumns;

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
    column: DatasetPreviewColumn,
  ): string {
    const value = readCellValue(row, column.key);
    if (typeof value === "number") return formatCompactNumber(value);
    if (value === null || value === undefined || value === "") return "-";
    return `${value}`;
  }

  const hasMultipleYears = years.length > 1;

  const filteredRows = useMemo(() => {
    let rows = preview.rows;

    // Year filter: filter rows based on year if present in area name or values
    if (hasMultipleYears && selectedYear !== "all") {
      rows = rows.filter((row) => {
        const areaStr = `${row.area} ${JSON.stringify(row.values ?? {})}`;
        return areaStr.includes(String(selectedYear));
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => row.area.toLowerCase().includes(q));
    }

    return rows;
  }, [preview.rows, search, selectedYear, hasMultipleYears]);

  const totalRow = filteredRows.reduce(
    (acc, row) => {
      acc.total += row.total;
      if (typeof row.male === "number") acc.male += row.male;
      if (typeof row.female === "number") acc.female += row.female;
      return acc;
    },
    { total: 0, male: 0, female: 0 },
  );

  const hasMale = preview.rows.some((r) => typeof r.male === "number");
  const hasFemale = preview.rows.some((r) => typeof r.female === "number");

  return (
    <section>
      <Card className="overflow-hidden border-[#d6ddeb] bg-white p-0">
        {/* Header */}
        <div className="border-b border-[#f0f2f5] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-5 py-4">
          <h3 className="m-0 font-semibold text-[#1e2f52] text-base">
            Dataset dalam Bentuk Tabel
          </h3>
          <p className="m-0 mt-0.5 text-[13px] text-[#6b7280]">
            Pratinjau data lengkap dalam format tabel yang mudah dibaca.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eef0f5] bg-[#fcfdfe] px-5 py-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1" style={{ minWidth: "180px" }}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]"
              aria-hidden
            />
            <input
              id="dataset-table-search"
              type="text"
              placeholder="Cari wilayah…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-[#d6ddeb] bg-white pl-8 pr-3 text-sm text-[#2f2a28] placeholder:text-[#b0b7c3] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
            />
          </div>

          {/* Year filter */}
          {hasMultipleYears && (
            <div className="relative">
              <Filter
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]"
                aria-hidden
              />
              <select
                id="dataset-table-year-filter"
                value={selectedYear === "all" ? "all" : String(selectedYear)}
                onChange={(e) =>
                  setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="h-8 appearance-none rounded-lg border border-[#d6ddeb] bg-white pl-8 pr-7 text-sm text-[#2f2a28] focus:border-[#4b7fe0] focus:outline-none focus:ring-2 focus:ring-[#4b7fe0]/15"
              >
                <option value="all">Semua Tahun</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]"
                aria-hidden
              />
            </div>
          )}

          <span className="ml-auto text-xs text-[#94a3b8]">
            {filteredRows.length} wilayah
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr>
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`border-b border-[#e2e8f3] bg-[#f5f8ff] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5f7398] ${col.isNumeric ? "text-right" : "text-left"}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                <>
                  {filteredRows.map((row, i) => (
                    <tr
                      key={row.area}
                      className={`transition-colors hover:bg-[#f5f8ff] ${i % 2 === 0 ? "bg-white" : "bg-[#fafbff]"}`}
                    >
                      {tableColumns.map((col) => (
                        <td
                          key={`${row.area}-${col.key}`}
                          className={`border-b border-[#eef0f5] px-4 py-2.5 ${col.isNumeric ? "text-right tabular-nums" : "text-left"} ${col.key === "area" ? "font-medium text-[#213255]" : "text-[#374151]"} ${col.key === "total" ? "font-semibold text-[#1e2f52]" : ""}`}
                        >
                          {renderCellValue(row, col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total row */}
                  {filteredRows.length > 1 && (
                    <tr className="bg-[#eef3ff]">
                      {tableColumns.map((col) => {
                        let content = "";
                        if (col.key === "area") content = "Total";
                        else if (col.key === "total") content = formatCompactNumber(totalRow.total);
                        else if (col.key === "male" && hasMale)
                          content = formatCompactNumber(totalRow.male);
                        else if (col.key === "female" && hasFemale)
                          content = formatCompactNumber(totalRow.female);
                        else content = "-";
                        return (
                          <td
                            key={`total-${col.key}`}
                            className={`border-t-2 border-[#d6ddeb] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1e2f52] ${col.isNumeric ? "text-right tabular-nums" : "text-left"}`}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className="px-4 py-10 text-center text-sm text-[#9ca3af]"
                  >
                    {search
                      ? `Tidak ditemukan wilayah dengan kata kunci "${search}".`
                      : "Data tabel belum tersedia."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="border-t border-[#f0f2f5] bg-[#fcfdfe] px-5 py-2.5">
          <p className="m-0 text-[11px] text-[#9ca3af]">
            Data ditampilkan berdasarkan sumber dataset yang telah diverifikasi.
          </p>
        </div>
      </Card>
    </section>
  );
}
