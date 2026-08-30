"use client";

import { useState, useMemo, ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export interface ColumnDef<T extends object> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  className?: string;
}

interface ClientDataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  defaultPageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  actionButton?: ReactNode;
}

function getCellValue<T extends object>(row: T, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function ClientDataTable<T extends object>({
  data,
  columns,
  defaultPageSize = 10,
  searchable = false,
  searchPlaceholder = "Cari data...",
  searchFn,
  emptyMessage = "Tidak ada data ditemukan.",
  actionButton,
}: ClientDataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery || !searchFn) return data;
    return data.filter((row) => searchFn(row, searchQuery));
  }, [data, searchable, searchQuery, searchFn]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey as keyof T];
      const valB = b[sortKey as keyof T];
      
      let comparison = 0;
      if (column.sortFn) {
        comparison = column.sortFn(a, b);
      } else {
        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir, columns]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure page is within bounds after filtering/page size changes
  const safePage = Math.min(page, totalPages);
  
  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const pages: Array<number | "..."> = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: Array<number | "..."> = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    if (start > 2) result.push("...");
    for (let p = start; p <= end; p++) result.push(p);
    if (end < totalPages - 1) result.push("...");
    result.push(totalPages);
    return result;
  }, [safePage, totalPages]);

  return (
    <div className="flex flex-col w-full">
      {(searchable || actionButton) && (
        <div className="border-b border-[var(--color-border)] p-4 flex items-center justify-between gap-4 bg-[var(--color-surface-soft)]/20">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="pl-9 h-9 border-[var(--color-border)] bg-white"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {actionButton && (
            <div className="flex items-center gap-2">
              {actionButton}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface-soft)]/50 text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-5 py-3 font-bold select-none", col.className)}
                >
                  {col.sortable !== false ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors group"
                    >
                      {col.header}
                      <span className="flex-shrink-0">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3 text-[var(--color-primary)]" />
                          ) : (
                            <ArrowDown className="size-3 text-[var(--color-primary)]" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-[var(--color-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="group hover:bg-[var(--color-surface-soft)]/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-5 py-4", col.className)}>
                      {col.render ? col.render(row) : getCellValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)] bg-white">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block">Tampilkan</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="hidden sm:inline-block">
            Menampilkan {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1} hingga {Math.min(safePage * pageSize, totalItems)} dari {totalItems} entri
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={cn("size-8 rounded-full", safePage === 1 && "pointer-events-none opacity-45")}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Sebelumnya</span>
            </Button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {pages.map((p, index) =>
                p === "..." ? (
                  <span
                    key={`dots-${index}`}
                    className="px-1 text-sm font-medium text-[var(--color-muted)]"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safePage ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setPage(p as number)}
                    className="h-8 min-w-8 rounded-full px-2.5 text-xs sm:h-9 sm:min-w-9 sm:px-3 sm:text-sm"
                  >
                    {p}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={cn("size-8 rounded-full", safePage === totalPages && "pointer-events-none opacity-45")}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Berikutnya</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
