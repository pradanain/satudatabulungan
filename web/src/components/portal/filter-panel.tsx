"use client";

import { SlidersHorizontal } from "lucide-react";
import type { DatasetFilterOptions, DatasetFilters } from "@/lib/types/dataset";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

interface FilterPanelProps {
  options: DatasetFilterOptions;
  activeFilters: DatasetFilters;
  pageSize: number;
}

function SelectField({
  id,
  label,
  name,
  value,
  options,
}: {
  id: string;
  label: string;
  name: string;
  value?: string;
  options: string[];
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-[#47413f]" htmlFor={id}>
      {label}
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="h-10 w-full min-w-0 rounded-xl border border-[#cad1dd] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
      >
        <option value="">Semua</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterForm({
  options,
  activeFilters,
  pageSize,
  compact = false,
}: FilterPanelProps & { compact?: boolean }) {
  function handleReset() {
    const hasConfirmed = window.confirm(
      "Reset semua filter dataset? Tindakan ini akan mengembalikan daftar ke kondisi awal.",
    );

    if (hasConfirmed) {
      window.location.href = "/dataset";
    }
  }

  return (
    <form action="/dataset" method="get" className={cn("mt-5 grid min-w-0 gap-3", compact && "mt-4")}>
      {activeFilters.q ? <input type="hidden" name="q" value={activeFilters.q} /> : null}
      {activeFilters.sort ? <input type="hidden" name="sort" value={activeFilters.sort} /> : null}
      <input type="hidden" name="pageSize" value={pageSize} />

      <SelectField id={`topic-${compact ? "mobile" : "desktop"}`} label="Topik" name="topic" value={activeFilters.topic} options={options.topics} />
      <SelectField
        id={`organization-${compact ? "mobile" : "desktop"}`}
        label="Organisasi"
        name="organization"
        value={activeFilters.organization}
        options={options.organizations}
      />
      <SelectField id={`year-${compact ? "mobile" : "desktop"}`} label="Tahun" name="year" value={activeFilters.year} options={options.years} />

      <div className="mt-1 flex gap-2">
        <Button type="button" variant="secondary" className="h-10 flex-1 rounded-xl" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" className="h-10 flex-1 rounded-xl">
          Terapkan
        </Button>
      </div>
    </form>
  );
}

export function FilterPanel({ options, activeFilters, pageSize }: FilterPanelProps) {
  return (
    <aside className="hidden min-w-0 lg:block" aria-label="Filter dataset">
      <Card className="sticky top-44 min-w-0 p-5">
        <h2 className="m-0 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight">
          Filter Dataset
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
          Filter disusun ringkas agar penelusuran cepat dan mudah dipakai.
        </p>
        <FilterForm options={options} activeFilters={activeFilters} pageSize={pageSize} />
      </Card>
    </aside>
  );
}

export function MobileFilterDrawer({ options, activeFilters, pageSize }: FilterPanelProps) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" className="w-full rounded-xl">
            <SlidersHorizontal className="mr-2 size-4" />
            Buka Filter Dataset
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter Dataset</SheetTitle>
            <SheetDescription>Atur filter sesuai topik, organisasi, dan tahun dataset.</SheetDescription>
          </SheetHeader>
          <FilterForm options={options} activeFilters={activeFilters} pageSize={pageSize} compact />
        </SheetContent>
      </Sheet>
    </div>
  );
}
