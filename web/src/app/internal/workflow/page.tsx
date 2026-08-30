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
        title={session.role === "produsen" ? "Pengajuan Dataset" : "Verifikasi Data"}
        description={session.role === "produsen" ? "Pantau dan tindak lanjuti status pengajuan dataset sebelum dipublikasikan." : "Validasi dan verifikasi dataset yang diajukan OPD sebelum dipublikasikan."}
        badges={
          <>
            <Badge variant="outline">{items.length} dataset antrean</Badge>
          </>
        }
      />

      <InternalReviewBoard items={items} role={session.role} />
    </InternalShell>
  );
}


