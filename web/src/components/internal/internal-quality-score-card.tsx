"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { validateDatasetQuality } from "@/lib/utils/data-validator";
import type { PortalDataset } from "@/lib/services/ckan-portal-api";
import { cn } from "@/lib/utils";

type InternalQualityScoreCardProps = {
  dataset: PortalDataset;
  className?: string;
};

export function InternalQualityScoreCard({ dataset, className }: InternalQualityScoreCardProps) {
  const report = validateDatasetQuality(dataset);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[var(--color-success)]";
    if (score >= 50) return "text-[var(--color-accent-orange)]";
    return "text-[var(--color-primary)]";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-[var(--color-success)]";
    if (score >= 50) return "bg-[var(--color-accent-orange)]";
    return "bg-[var(--color-primary)]";
  };

  return (
    <Card className={cn("overflow-hidden border-transparent bg-white/50 shadow-sm backdrop-blur-xl", className)}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">Skor Kualitas Data</h3>
            <p className="text-sm text-[var(--color-muted)]">Berdasarkan standarisasi metadata Satu Data.</p>
          </div>
          <div className={cn("text-3xl font-extrabold", getScoreColor(report.score))}>
            {report.score}%
          </div>
        </div>

        <Progress value={report.score} className="h-2 mb-6" indicatorClassName={getProgressColor(report.score)} />

        <div className="grid gap-3">
          {report.checks.map((check, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/40 border border-white/60">
              {check.passed ? (
                <CheckCircle2 className="size-5 text-[var(--color-success)] mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="size-5 text-[var(--color-accent-orange)] mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">{check.label}</p>
                  {!check.passed && (
                    <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded">
                      -{check.impact}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
                  {check.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
