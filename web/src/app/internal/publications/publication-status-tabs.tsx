import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type PublicationStatusTab = "semua" | "draft" | "diajukan" | "diperiksa" | "published";

interface TabCounts {
  semua: number;
  draft: number;
  diajukan: number;
  diperiksa: number;
  published: number;
}

interface PublicationStatusTabsProps {
  activeTab: PublicationStatusTab;
  basePath: string;
  counts: TabCounts;
}

const TAB_CONFIG: {
  key: PublicationStatusTab;
  label: string;
  colorClass: string;
  activeBg: string;
}[] = [
  {
    key: "semua",
    label: "Semua",
    colorClass: "text-gray-600",
    activeBg: "bg-white shadow-sm border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]",
  },
  {
    key: "draft",
    label: "Draft",
    colorClass: "text-gray-500",
    activeBg: "bg-white shadow-sm border-b-2 border-gray-500 text-gray-700",
  },
  {
    key: "diajukan",
    label: "Diajukan",
    colorClass: "text-amber-600",
    activeBg: "bg-white shadow-sm border-b-2 border-amber-500 text-amber-700",
  },
  {
    key: "diperiksa",
    label: "Diperiksa",
    colorClass: "text-blue-600",
    activeBg: "bg-white shadow-sm border-b-2 border-blue-500 text-blue-700",
  },
  {
    key: "published",
    label: "Published",
    colorClass: "text-emerald-600",
    activeBg: "bg-white shadow-sm border-b-2 border-emerald-500 text-emerald-700",
  },
];

const BADGE_COLOR: Record<PublicationStatusTab, string> = {
  semua: "bg-gray-100 text-gray-600",
  draft: "bg-gray-100 text-gray-600",
  diajukan: "bg-amber-100 text-amber-700",
  diperiksa: "bg-blue-100 text-blue-700",
  published: "bg-emerald-100 text-emerald-700",
};

export function PublicationStatusTabs({
  activeTab,
  basePath,
  counts,
}: PublicationStatusTabsProps) {
  function buildHref(tab: PublicationStatusTab): string {
    if (tab === "semua") return basePath;
    return `${basePath}?tab=${tab}`;
  }

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-[var(--color-border)] px-4 bg-gray-50/50">
      {TAB_CONFIG.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.key];

        return (
          <Link
            key={tab.key}
            href={buildHref(tab.key)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all rounded-t-lg -mb-px",
              isActive
                ? tab.activeBg
                : `${tab.colorClass} hover:bg-gray-100 hover:text-gray-800`
            )}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none min-w-[18px]",
                  isActive ? BADGE_COLOR[tab.key] : "bg-gray-200 text-gray-500"
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Map status string from CKAN/store to tab key
 */
export function mapStatusToTab(status: string): PublicationStatusTab {
  const s = status.toLowerCase().trim();
  if (s === "draft") return "draft";
  if (s === "submitted" || s === "diajukan") return "diajukan";
  if (s === "under review" || s === "approved" || s === "need revision") return "diperiksa";
  if (s === "published") return "published";
  return "semua";
}

/**
 * Filter items by tab
 */
export function filterByTab<T extends { status: string }>(
  items: T[],
  tab: PublicationStatusTab
): T[] {
  if (tab === "semua") return items;
  return items.filter((item) => mapStatusToTab(item.status) === tab);
}

/**
 * Count items per tab
 */
export function countByTab<T extends { status: string }>(items: T[]): TabCounts {
  return {
    semua: items.length,
    draft: items.filter((i) => mapStatusToTab(i.status) === "draft").length,
    diajukan: items.filter((i) => mapStatusToTab(i.status) === "diajukan").length,
    diperiksa: items.filter((i) => mapStatusToTab(i.status) === "diperiksa").length,
    published: items.filter((i) => mapStatusToTab(i.status) === "published").length,
  };
}
