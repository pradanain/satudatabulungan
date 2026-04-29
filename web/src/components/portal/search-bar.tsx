import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  action: string;
  placeholder: string;
  defaultValue?: string;
  hiddenValues?: Record<string, string | undefined>;
  className?: string;
  submitLabel?: string;
}

export function SearchBar({
  action,
  placeholder,
  defaultValue = "",
  hiddenValues = {},
  className = "",
  submitLabel = "Cari",
}: SearchBarProps) {
  const searchFieldId = `search-${action.replace(/[^a-zA-Z0-9_-]/g, "-") || "dataset"}`;

  return (
    <form
      action={action}
      method="get"
      className={cn(
        "grid items-stretch gap-2 rounded-[24px] border border-[var(--color-border)] bg-white p-2 shadow-[0_10px_24px_rgba(33,41,52,0.08)] sm:grid-cols-[1fr_auto]",
        className,
      )}
    >
      {Object.entries(hiddenValues).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}

      <label className="sr-only" htmlFor={searchFieldId}>
        Pencarian dataset
      </label>
      <Input
        id={searchFieldId}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        suppressHydrationWarning
        className="h-12 rounded-xl border-0 bg-[var(--color-surface-soft)] text-base shadow-none focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0"
      />
      <Button type="submit" className="h-12 rounded-xl px-6 text-base font-semibold">
        {submitLabel}
      </Button>
    </form>
  );
}
