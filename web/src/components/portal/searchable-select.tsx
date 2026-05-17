"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SearchableSelectProps = {
  options: { value: string; label?: string; count?: number }[];
  value: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  className?: string;
  showSearch?: boolean;
};

export function SearchableSelect({
  options,
  value,
  name,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ada hasil ditemukan.",
  required = false,
  className,
  showSearch = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = options.find(opt => opt.value === value)?.label || options.find(opt => opt.value === value)?.value || value || "Semua";

  const filteredOptions = options.filter((option) =>
    (option.label || option.value).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (onChange) onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl border border-[#d1d9e6] bg-white px-4 text-sm font-medium shadow-sm transition-all hover:bg-slate-50",
          isOpen && "border-(--color-primary) ring-4 ring-(--color-primary)/5",
          !value && "text-(--color-muted)"
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn("size-4 text-(--color-muted) transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[1000] mt-2 overflow-hidden rounded-2xl border border-[#d1d9e6] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {showSearch && (
            <div className="flex items-center border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <Search className="mr-3 size-4 text-(--color-muted)" />
              <input
                autoFocus
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-(--color-muted)"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <X
                  className="size-4 cursor-pointer text-(--color-muted) hover:text-(--color-text)"
                  onClick={() => setSearch("")}
                />
              )}
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto p-1.5 custom-scrollbar">
            <div
              onClick={() => handleSelect("")}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-(--color-surface-soft) hover:text-(--color-primary)",
                !value ? "bg-(--color-surface-soft) font-bold text-(--color-primary)" : "text-[#5f5957]"
              )}
            >
              <span>Semua</span>
              {!value && <Check className="size-4 shrink-0" />}
            </div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-(--color-surface-soft) hover:text-(--color-primary)",
                    value === option.value ? "bg-(--color-surface-soft) font-bold text-(--color-primary)" : "text-[#5f5957]"
                  )}
                >
                  <div className="flex flex-1 items-center justify-between gap-3 overflow-hidden">
                    <span className="truncate">{option.label || option.value}</span>
                    {option.count !== undefined && (
                      <span className={cn(
                        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                        value === option.value ? "bg-(--color-primary)/10 text-(--color-primary)" : "bg-slate-100 text-slate-500"
                      )}>
                        {option.count}
                      </span>
                    )}
                  </div>
                  {value === option.value && <Check className="size-4 shrink-0 ml-2" />}
                </div>
              ))
            ) : search ? (
              <div className="px-3 py-10 text-center text-sm text-(--color-muted)">
                {emptyMessage}
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value || ""} required={required} />
    </div>
  );
}
