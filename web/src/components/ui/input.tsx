import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suppressHydrationWarning, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        suppressHydrationWarning={suppressHydrationWarning ?? true}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
