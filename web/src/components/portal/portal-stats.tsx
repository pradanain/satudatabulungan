import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface PortalStatCardItem {
  label: string;
  value: string;
  icon: LucideIcon;
  accentColor: string;
  surfaceClassName: string;
}

interface PortalStatsProps {
  items: PortalStatCardItem[];
}

export function PortalStatsCards({ items }: PortalStatsProps) {
  return (
    <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-label="Statistik portal">
      {items.map((item) => (
        <Card
          key={item.label}
          className={`relative overflow-hidden rounded-[24px] border-[var(--color-border)] ${item.surfaceClassName} p-5 shadow-[0_10px_22px_rgba(33,41,52,0.08)]`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),transparent_62%)]" />
          <div
            className="absolute -right-7 top-6 size-24 rounded-full opacity-[0.08]"
            style={{ backgroundColor: item.accentColor }}
          />
          <div className="absolute bottom-4 right-4 h-12 w-20 rounded-[22px] border border-white/65 opacity-65" />

          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span
                className="inline-flex size-11 items-center justify-center rounded-xl text-white shadow-[0_10px_20px_rgba(33,41,52,0.12)]"
                style={{ backgroundColor: item.accentColor }}
              >
                <item.icon className="size-5" />
              </span>
              <span className="h-1.5 w-14 rounded-full" style={{ backgroundColor: item.accentColor }} />
            </div>

            <div>
              <strong className="block font-[family-name:var(--font-heading)] text-4xl font-semibold leading-none">
                {item.value}
              </strong>
              <p className="mb-0 mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {item.label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
