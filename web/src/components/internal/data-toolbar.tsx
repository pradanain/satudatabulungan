"use client";

import { type ReactNode } from "react";
import { Search, SlidersHorizontal, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataToolbarProps {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  filters?: ReactNode; // Elements for filtering, like dropdowns
  actions?: ReactNode; // Extra actions, like Export button
  showExport?: boolean;
  onExport?: () => void;
}

export function DataToolbar({
  searchPlaceholder = "Cari data...",
  onSearchChange,
  searchValue = "",
  filters,
  actions,
  showExport = false,
  onExport,
}: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 h-9"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:block h-5 w-px bg-[var(--color-border)] mx-1" />
            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] mr-1">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filter</span>
            </div>
            {filters}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 mt-3 sm:mt-0">
        {actions}
        
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-9 gap-1.5">
            <Download className="size-4" />
            <span>Export</span>
          </Button>
        )}
      </div>
    </div>
  );
}
