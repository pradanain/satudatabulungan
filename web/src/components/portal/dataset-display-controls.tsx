"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    // Small delay to ensure hidden input value is updated by Radix before submission
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 10);
  }

  return (
    <form
      ref={formRef}
      action="/dataset"
      method="get"
      className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-[160px_160px]"
    >
      {filters.q ? (
        <input type="hidden" name="q" value={filters.q} suppressHydrationWarning />
      ) : null}
      {filters.topic ? (
        <input type="hidden" name="topic" value={filters.topic} suppressHydrationWarning />
      ) : null}
      {filters.organization ? (
        <input type="hidden" name="organization" value={filters.organization} suppressHydrationWarning />
      ) : null}
      {filters.year ? (
        <input type="hidden" name="year" value={filters.year} suppressHydrationWarning />
      ) : null}
      <input type="hidden" name="page" value="1" suppressHydrationWarning />

      <div className="grid min-w-0 gap-1">
        <span className="text-xs font-semibold text-[#47413f] sm:text-sm">Urutkan</span>
        <Select
          name="sort"
          defaultValue={filters.sort ?? "terbaru"}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="sort-control" aria-label="Urutkan dataset" className="h-10">
            <SelectValue placeholder="Pilih urutan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terbaru">Terbaru</SelectItem>
            <SelectItem value="populer">Populer</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-w-0 gap-1">
        <span className="text-xs font-semibold text-[#47413f] sm:text-sm">Jumlah per halaman</span>
        <Select
          name="pageSize"
          defaultValue={`${pageSize}`}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="page-size-control" aria-label="Jumlah dataset per halaman" className="h-10">
            <SelectValue placeholder="Jumlah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
