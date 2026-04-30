"use client";

import { useRef } from "react";
import type { PublicationSort } from "@/lib/utils/query";

interface NewsDisplayControlsProps {
  basePath: string;
  sort: PublicationSort;
  query?: string;
}

export function NewsDisplayControls({ basePath, sort, query }: NewsDisplayControlsProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleSelectChange() {
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={basePath}
      method="get"
      className="grid w-full gap-2 sm:grid-cols-1 lg:w-auto lg:grid-cols-[170px]"
    >
      <input type="hidden" name="page" value="1" suppressHydrationWarning />
      {query ? <input type="hidden" name="q" value={query} suppressHydrationWarning /> : null}

      <label className="grid min-w-0 gap-1 text-xs font-semibold text-[#47413f] sm:text-sm" htmlFor="news-sort-control">
        Urutkan
        <select
          id="news-sort-control"
          name="sort"
          defaultValue={sort}
          onChange={handleSelectChange}
          className="h-10 w-full min-w-0 rounded-xl border border-[#cad1dd] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
        >
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
          <option value="az">A-Z</option>
        </select>
      </label>
    </form>
  );
}
