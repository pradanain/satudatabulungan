import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type InternalPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  badges?: ReactNode;
  actions?: ReactNode;
};

export function InternalPageHeader({
  eyebrow = "Portal Internal",
  title,
  description,
  badges,
  actions,
}: InternalPageHeaderProps) {
  return (
    <Card className="internal-surface overflow-hidden border-transparent p-4 shadow-sm sm:p-5">
      <div className="internal-ornament-band -mx-4 -mt-4 mb-4 h-1.5 border-b border-[var(--color-border)] sm:-mx-5 sm:-mt-5" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            {eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 font-[family-name:var(--font-heading)] text-xl font-bold leading-tight sm:text-2xl">
              {title}
            </h1>
            {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
          </div>
          <p className="mb-0 mt-1.5 text-sm text-[var(--color-muted)] truncate sm:whitespace-normal">
            {description}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </Card>
  );
}
