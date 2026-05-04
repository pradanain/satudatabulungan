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
    <Card className="internal-surface overflow-hidden border-transparent p-4 shadow-none sm:p-5">
      <div className="internal-ornament-band -mx-4 -mt-4 mb-3 h-5 border-b border-[var(--color-border)] sm:-mx-5 sm:-mt-5" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mb-0 mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
            {description}
          </p>
          {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </Card>
  );
}
