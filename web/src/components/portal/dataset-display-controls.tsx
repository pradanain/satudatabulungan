"use client";

import { useRef } from "react";
import type { DatasetFilters } from "@/lib/types/dataset";

interface DatasetDisplayControlsProps {
  filters: DatasetFilters;
  pageSize: number;
}

export function DatasetDisplayControls({
  filters,
  pageSize,
}: DatasetDisplayControlsProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleSelectChange() {
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action="/dataset"
      method="get"
      className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-[170px_170px]"
    >
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.topic ? <input type="hidden" name="topic" value={filters.topic} /> : null}
      {filters.organization ? (
        <input type="hidden" name="organization" value={filters.organization} />
      ) : null}
      {filters.year ? <input type="hidden" name="year" value={filters.year} /> : null}
      <input type="hidden" name="page" value="1" />

      <label
        className="grid min-w-0 gap-1 text-xs font-semibold text-[#47413f] sm:text-sm"
        htmlFor="sort-control"
      >
        Urutkan
        <select
          id="sort-control"
          name="sort"
          defaultValue={filters.sort ?? "terbaru"}
          onChange={handleSelectChange}
          className="h-10 w-full min-w-0 rounded-xl border border-[#cad1dd] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
        >
          <option value="terbaru">Terbaru</option>
          <option value="populer">Populer</option>
          <option value="az">A-Z</option>
        </select>
      </label>

      <label
        className="grid min-w-0 gap-1 text-xs font-semibold text-[#47413f] sm:text-sm"
        htmlFor="page-size-control"
      >
        Jumlah per halaman
        <select
          id="page-size-control"
          name="pageSize"
          defaultValue={`${pageSize}`}
          onChange={handleSelectChange}
          className="h-10 w-full min-w-0 rounded-xl border border-[#cad1dd] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
        </select>
      </label>
    </form>
  );
}
