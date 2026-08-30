"use client";

import { useState } from "react";
import { SlidersHorizontal, AlertTriangle } from "lucide-react";
import type { DatasetFilterOptions, DatasetFilters } from "@/lib/types/dataset";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { SearchableSelect } from "@/components/portal/searchable-select";
import {
  Sheet,
  SheetClose,
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

// SelectField removed to use SearchableSelect instead

function FilterForm({
  options,
  activeFilters,
  pageSize,
  compact = false,
}: FilterPanelProps & { compact?: boolean }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [topic, setTopic] = useState(activeFilters.topic || "");
  const [organization, setOrganization] = useState(activeFilters.organization || "");
  const [year, setYear] = useState(activeFilters.year || "");

  function handleReset() {
    window.location.href = "/dataset";
  }

  return (
    <form action="/dataset" method="get" className={cn("flex min-h-full flex-col", compact ? "mt-0" : "mt-6")}>
      <div className="flex-1 space-y-6">
        {activeFilters.q ? <input type="hidden" name="q" value={activeFilters.q} suppressHydrationWarning /> : null}
        {activeFilters.sort ? (
          <input type="hidden" name="sort" value={activeFilters.sort} suppressHydrationWarning />
        ) : null}
        <input type="hidden" name="pageSize" value={pageSize} suppressHydrationWarning />

        <div className="space-y-6">
          <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-[#2d2826]">
              <span className="h-1 w-1 rounded-full bg-(--color-primary)" />
              Topik
            </span>
            <SearchableSelect
              name="topic"
              value={topic}
              onChange={setTopic}
              options={options.topics}
              placeholder="Pilih Topik"
              showSearch={false}
            />
          </div>

          <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-[#2d2826]">
              <span className="h-1 w-1 rounded-full bg-(--color-primary)" />
              Organisasi
            </span>
            <SearchableSelect
              name="organization"
              value={organization}
              onChange={setOrganization}
              options={options.organizations}
              placeholder="Pilih Organisasi"
              searchPlaceholder="Cari organisasi..."
            />
          </div>

          <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-[#2d2826]">
              <span className="h-1 w-1 rounded-full bg-(--color-primary)" />
              Tahun
            </span>
            <SearchableSelect
              name="year"
              value={year}
              onChange={setYear}
              options={options.years}
              placeholder="Pilih Tahun"
              showSearch={false}
            />
          </div>
        </div>

        <div className={cn("flex gap-3", compact ? "mt-8" : "mt-4")}>
          <Button type="button" variant="outline" className="h-11 flex-1 rounded-2xl border-[#d1d9e6] font-bold text-[#5f5957] hover:bg-slate-50" onClick={() => setShowResetConfirm(true)}>
            Reset
          </Button>
          <Button type="submit" className="h-11 flex-1 rounded-2xl bg-(--color-primary) font-bold text-white shadow-lg shadow-(--color-primary)/20">
            Terapkan
          </Button>
        </div>

        <ConfirmationDialog
          open={showResetConfirm}
          onOpenChange={setShowResetConfirm}
          title="Reset Filter?"
          description="Tindakan ini akan menghapus semua filter yang Anda pilih dan mengembalikan daftar dataset ke kondisi awal."
          confirmLabel="Ya, Reset Filter"
          cancelLabel="Batal"
          onConfirm={handleReset}
        />
      </div>

      {compact && (
        <div className="mt-20 pb-4">
          <SheetClose asChild>
            <Button type="button" variant="secondary" className="h-11 w-full rounded-2xl border border-[#d1d9e6] bg-white font-bold text-[#5f5957] hover:bg-slate-50">
              Tutup Filter
            </Button>
          </SheetClose>
        </div>
      )}
    </form>
  );
}

export function FilterPanel({ options, activeFilters, pageSize }: FilterPanelProps) {
  return (
    <aside className="hidden min-w-0 lg:block" aria-label="Filter dataset">
      <Card className="sticky top-44 z-30 min-w-0 p-5">
        <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight">
          Filter Dataset
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
          Gunakan filter untuk menyesuaikan daftar dataset sesuai kebutuhan Anda.
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
          <Button variant="secondary" className="h-12 w-full rounded-2xl border border-[#d1d9e6] bg-white text-base font-bold shadow-sm transition-all hover:bg-slate-50">
            <SlidersHorizontal className="mr-2 size-5 text-(--color-primary)" />
            Tampilkan Filter Dataset
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-slate-100 p-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-(--color-primary)/10 text-(--color-primary)">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-[#2d2826]">Filter Dataset</SheetTitle>
                <SheetDescription className="text-xs">Atur parameter pencarian data Anda.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <FilterForm options={options} activeFilters={activeFilters} pageSize={pageSize} compact />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
