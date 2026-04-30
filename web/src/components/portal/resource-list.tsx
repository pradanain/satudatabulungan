"use client";

import { useState } from "react";
import { Check, CircleOff, Copy, Download, ExternalLink } from "lucide-react";
import type { DatasetFormat, DatasetResource } from "@/lib/types/dataset";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { hasUsableResourceUrl } from "@/lib/utils/resource-links";

interface ResourceListProps {
  resources: DatasetResource[];
}

function getFormatBadgeClass(format: DatasetFormat): string {
  if (format === "CSV") return "border-[#b9dec5] bg-[#edf9f1] text-[#1f7a48]";
  if (format === "XLSX") return "border-[#bde0cf] bg-[#ecfbf3] text-[#176b46]";
  if (format === "PDF") return "border-[#f0c7c7] bg-[#fff1f1] text-[#ad2b2b]";
  if (format === "API") return "border-[#c6d0f1] bg-[#eff3ff] text-[#3f57a8]";
  if (format === "JSON") return "border-[#ead9ba] bg-[#fff8ea] text-[#9a6a1a]";
  return "border-[#c8d2e7] bg-[#f2f6ff] text-[#3d5f96]";
}

function isApiResource(resource: DatasetResource): boolean {
  return resource.format === "API";
}

function isDownloadableResource(resource: DatasetResource): boolean {
  return resource.format === "CSV" || resource.format === "XLSX" || resource.format === "PDF" || resource.format === "JSON";
}

export function ResourceList({ resources }: ResourceListProps) {
  const [copiedResourceId, setCopiedResourceId] = useState<string | null>(null);

  async function copyApiLink(resource: DatasetResource) {
    if (!hasUsableResourceUrl(resource.url)) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resource.url);
      setCopiedResourceId(resource.id);
      window.setTimeout(() => setCopiedResourceId((current) => (current === resource.id ? null : current)), 1800);
    } catch {
      setCopiedResourceId(null);
    }
  }

  return (
    <section>
      <Card className="overflow-hidden border-[#d5dceb] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 sm:p-6">
        <SectionHeading
          title="Dataset"
          description="Dataset yang tersedia dalam berbagai format untuk diunduh atau digunakan." 
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />

        <div className="mt-5 grid gap-3">
          {resources.map((resource) => {
            const isApi = isApiResource(resource);
            const isDownloadable = isDownloadableResource(resource);
            const isCopied = copiedResourceId === resource.id;
            const hasUrl = hasUsableResourceUrl(resource.url);

            return (
              <article
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d7ddeb] bg-white p-3.5 shadow-[0_8px_20px_rgba(36,52,82,0.05)]"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Badge
                    variant="outline"
                    className={`min-w-15.5 justify-center px-2 py-1 text-xs font-semibold ${getFormatBadgeClass(resource.format)}`}
                  >
                    {resource.format}
                  </Badge>
                  <div>
                    <h3 className="m-0 text-base font-semibold text-(--color-text)">{resource.name}</h3>
                    <p className="m-0 mt-1 text-sm text-(--color-muted)">{resource.description}</p>
                  </div>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2 text-sm text-[#605a58]">
                  <span className="rounded-full border border-[#dde5f1] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium">
                    {resource.sizeLabel}
                  </span>
                  {resource.lastUpdated ? (
                    <span className="rounded-full border border-[#dde5f1] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium">
                      {formatIndonesianDate(resource.lastUpdated)}
                    </span>
                  ) : null}

                  {hasUrl && isApi ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 rounded-lg p-0"
                      title={isCopied ? "Link API tersalin" : "Salin link API"}
                      aria-label={isCopied ? "Link API tersalin" : "Salin link API"}
                      onClick={() => {
                        void copyApiLink(resource);
                      }}
                    >
                      {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  ) : null}

                  {hasUrl && isDownloadable ? (
                    <Button asChild variant="secondary" size="sm" className="h-9 w-9 rounded-lg p-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        title="Unduh berkas"
                        aria-label="Unduh berkas"
                      >
                        <Download className="size-4" />
                      </a>
                    </Button>
                  ) : null}

                  {hasUrl && !isApi && !isDownloadable ? (
                    <Button asChild variant="secondary" size="sm" className="h-9 w-9 rounded-lg p-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka tautan"
                        aria-label="Buka tautan"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  ) : null}

                  {!hasUrl ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 rounded-lg p-0"
                      title="Tautan belum tersedia"
                      aria-label="Tautan belum tersedia"
                      disabled
                    >
                      <CircleOff className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
