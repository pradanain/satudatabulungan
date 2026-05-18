import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface PortalHeroCardProps {
  eyebrow?: string;
  title: React.ReactNode;
  description: string;
  decoration?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  leftContentClassName?: string;
  rightContentClassName?: string;
}

/**
 * Standardized Hero Card for Portal Public Pages.
 * Ensures consistency in typography, color accents, and decorative elements.
 */
export function PortalHeroCard({
  eyebrow = "PORTAL SATU DATA",
  title,
  description,
  decoration,
  actions,
  className,
  leftContentClassName,
  rightContentClassName,
}: PortalHeroCardProps) {
  return (
    <Card 
      className={cn("relative overflow-hidden rounded-[28px] border-(--color-border) p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]", className)}
      style={{
        background: "linear-gradient(96deg, #ffffff 0%, #fffefb 25%, #f9f5e9 45%, #f5efdd 55%, #f2eee4 65%, #ebedf2 75%, #e3ebf8 88%, #dce7f7 100%)"
      }}
    >
      <div className="grid min-h-72 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Left Content: Structured Information */}
        <div className={cn("relative z-2 flex flex-col justify-center overflow-hidden bg-transparent px-6 py-8 sm:px-10 sm:py-10", leftContentClassName)}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.78)_1px,transparent_0)] [background-size:3px_3px]"
            aria-hidden="true"
          />
          <div className="relative z-10">
            <Badge
              variant="outline"
              className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary) shadow-none mb-2.5"
            >
              {eyebrow}
            </Badge>
            <h1 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-[1.1] tracking-tight text-(--color-text) sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mb-0 mt-5 max-w-2xl text-sm leading-relaxed text-[#5f5957] sm:text-base lg:text-[1.05rem]">
              {description}
            </p>
            {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
          </div>
        </div>

        {/* Right Content: Visual Decoration */}
        <aside className={cn("relative min-h-40 overflow-hidden lg:min-h-60", rightContentClassName)}>
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:3px_3px]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-y-0 right-[-10%] w-[60%] opacity-[0.12]"
              aria-hidden="true"
              style={{
                backgroundImage: "url('/assets/brand/motifs/motif-3-suku-alt-optimized.webp')",
                backgroundRepeat: "repeat",
                backgroundPosition: "center top",
                backgroundSize: "220px auto",
              }}
            />
          </div>
          {decoration}
        </aside>
      </div>
    </Card>
  );
}
