import { Badge } from "@/components/ui/badge";
import type { DatasetStatus } from "@/lib/types/dataset";
import { cn } from "@/lib/utils/cn";

const toneByStatus: Record<DatasetStatus, string> = {
  Draft: "border-[#f8d8a0] bg-[#fff7e8] text-[#9a5d00]",
  Submitted: "border-[#cce0ff] bg-[#eff6ff] text-[#1e4f95]",
  "Need Revision": "border-[#f6c9c9] bg-[#fff4f4] text-[#9d2b2b]",
  Approved: "border-[#cde9cc] bg-[#f2fbf2] text-[#20692d]",
  Published: "border-[#cde3d6] bg-[#f1faf6] text-[#1f5e3e]",
  Archived: "border-[#dcdde2] bg-[#f5f6f9] text-[#515564]",
};

export function InternalStatusBadge({ status, className }: { status: DatasetStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-semibold", toneByStatus[status], className)}>
      {status}
    </Badge>
  );
}
