"use client";

import { useState } from "react";
import { FileText, BarChart3, Map, MessageSquare } from "lucide-react";

type Tab = "form" | "quality" | "geospatial" | "notes";

type InternalDatasetDetailTabsProps = {
  formContent: React.ReactNode;
  qualityContent: React.ReactNode;
  geospatialContent: React.ReactNode | null;
  notesContent: React.ReactNode;
  metaSummaryContent: React.ReactNode;
};

const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "form", label: "Dataset", icon: FileText },
  { key: "quality", label: "Skor Kualitas", icon: BarChart3 },
  { key: "geospatial", label: "Geospasial", icon: Map },
  { key: "notes", label: "Catatan", icon: MessageSquare },
];

export function InternalDatasetDetailTabs({
  formContent,
  qualityContent,
  geospatialContent,
  notesContent,
  metaSummaryContent,
}: InternalDatasetDetailTabsProps) {
  const [active, setActive] = useState<Tab>("form");

  // Filter out geospatial tab if no geospatial content
  const visibleTabs = geospatialContent
    ? tabs
    : tabs.filter((t) => t.key !== "geospatial");

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl border border-[var(--color-border)] bg-white/60 p-1.5 backdrop-blur-sm overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-text)]"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {active === "form" && (
          <div className="space-y-4">
            {formContent}
            {metaSummaryContent}
          </div>
        )}
        {active === "quality" && qualityContent}
        {active === "geospatial" && geospatialContent}
        {active === "notes" && notesContent}
      </div>
    </div>
  );
}
