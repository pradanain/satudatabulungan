import { Badge } from "@/components/ui/badge";
import type { DatasetStatus } from "@/lib/types/dataset";
import { getStatusLabel } from "@/lib/types/workflow";
import { cn } from "@/lib/utils/cn";

export type ExtendedStatus = DatasetStatus | "Failed Sync" | "Warning" | "Info" | string;

const toneByStatus: Record<string, string> = {
  Draft: "border-gray-200 bg-gray-50 text-gray-600",
  Submitted: "border-blue-200 bg-blue-50 text-blue-700",
  "Under Review": "border-amber-200 bg-amber-50 text-amber-700",
  "Need Revision": "border-orange-200 bg-orange-50 text-orange-700",
  Approved: "border-teal-200 bg-teal-50 text-teal-700",
  Published: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  Archived: "border-gray-300 bg-gray-100 text-gray-500",
  "Failed Sync": "border-red-200 bg-red-50 text-red-700",
  Warning: "border-orange-200 bg-orange-50 text-orange-700",
  Info: "border-blue-200 bg-blue-50 text-blue-700",
};

const statusLabelMap: Record<string, string> = {
  Draft: "Draft",
  Submitted: "Diajukan ke Walidata",
  "Under Review": "Pemeriksaan Walidata",
  "Need Revision": "Perlu Revisi",
  Approved: "Layak Publikasi",
  Published: "Dipublikasikan",
  Archived: "Diarsipkan",
};

export function InternalStatusBadge({ status, className }: { status: ExtendedStatus; className?: string }) {
  const tone = toneByStatus[status] || "border-gray-200 bg-gray-50 text-gray-600";
  const label = statusLabelMap[status] || status;
  return (
    <Badge variant="outline" className={cn("rounded-full font-semibold", tone, className)}>
      {label}
    </Badge>
  );
}
