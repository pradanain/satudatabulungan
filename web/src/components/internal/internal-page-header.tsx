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
    <Card className="overflow-hidden bg-linear-to-r from-[#fff9f3] via-white to-[#f4f8ff] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mb-0 mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
            {description}
          </p>
          {badges ? <div className="mt-4 flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
}
