import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalReviewBoard } from "@/components/internal/internal-review-board";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { getWorkflowItems } from "@/lib/services/workflow-service";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalWorkflowPage() {
  const session = await requireInternalSession("review");
  const items = await getWorkflowItems(session);

  return (
    <InternalShell session={session} activeKey="review">
      <InternalPageHeader
        title="Review & Approval"
        description="Kelola antrian verifikasi, approval, publikasi, dan arsip dataset pada satu board workflow yang stabil untuk dev lokal."
        badges={
          <>
            <Badge variant="outline">{items.length} dataset termonitor</Badge>
            <Badge variant="outline">Shared sync ke halaman publik</Badge>
          </>
        }
      />

      <InternalReviewBoard items={items} role={session.role} />
    </InternalShell>
  );
}


