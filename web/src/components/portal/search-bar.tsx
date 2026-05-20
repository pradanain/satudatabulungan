"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Database, Building2, Tag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  organization: string;
  topic: string;
}

interface SearchBarProps {
  action: string;
  placeholder: string;
  defaultValue?: string;
  hiddenValues?: Record<string, string | undefined>;
  className?: string;
  submitLabel?: string;
  /** Accessible label for screen readers */
  srLabel?: string;
}

export function SearchBar({
  action,
  placeholder,
  defaultValue = "",
  hiddenValues = {},
  className = "",
  submitLabel = "Cari",
  srLabel,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/datasets/autocomplete?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(true);
        } catch (error) {
          console.error("Autocomplete error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    router.push(`/dataset/${slug}`);
  };

  return (
    <div ref={containerRef} className={cn("relative z-40", className)}>
      <form
        action={action}
        method="get"
        className={cn(
          "grid items-stretch gap-3 lg:grid-cols-[1fr_auto]",
        )}
      >
        {Object.entries(hiddenValues).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}

        <div className={cn(
          "relative flex items-center h-12 lg:h-14 px-2",
          "rounded-[24px] border border-[var(--color-border)] bg-white shadow-[0_10px_24px_rgba(33,41,52,0.06)]",
          "transition-all duration-200 focus-within:border-(--color-primary) focus-within:ring-4 focus-within:ring-(--color-primary)/5"
        )}>
          <Search className="absolute left-5 size-5 text-[var(--color-muted)]" />
          <Input
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            aria-label={srLabel ?? placeholder}
            autoComplete="off"
            className="h-full border-0 bg-transparent pl-12 pr-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0"
          />
          {isLoading && <Loader2 className="absolute right-5 size-5 animate-spin text-[var(--color-primary)]" />}

          {/* Dropdown Suggestions */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[400px] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-white/95 p-2 shadow-[0_20px_40px_rgba(33,41,52,0.15)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Saran Dataset
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.slug)}
                  className="flex w-full flex-col gap-1 rounded-2xl p-3 text-left transition-colors hover:bg-[var(--color-surface-soft)]"
                >
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold text-(--color-text)">{item.title}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 pl-6">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                      <Building2 className="size-3" />
                      {item.organization}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                      <Tag className="size-3" />
                      {item.topic}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className={cn(
            "h-12 lg:h-14 rounded-[22px] px-10 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]",
            "shadow-lg shadow-[var(--color-primary)]/20"
          )}
        >
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}
