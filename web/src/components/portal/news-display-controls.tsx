"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicationSort } from "@/lib/utils/query";

interface NewsDisplayControlsProps {
  basePath: string;
  sort: PublicationSort;
  query?: string;
}

export function NewsDisplayControls({ basePath, sort, query }: NewsDisplayControlsProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleSelectChange() {
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 10);
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

      <div className="grid min-w-0 gap-1">
        <span className="text-xs font-semibold text-[#47413f] sm:text-sm">Urutkan</span>
        <Select name="sort" defaultValue={sort} onValueChange={handleSelectChange}>
          <SelectTrigger id="news-sort-control" aria-label="Urutkan publikasi" className="h-10">
            <SelectValue placeholder="Pilih urutan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terbaru">Terbaru</SelectItem>
            <SelectItem value="terlama">Terlama</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
