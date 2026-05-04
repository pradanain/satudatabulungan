import { InternalDatasetForm } from "@/components/internal/internal-dataset-form";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalDatasetNewPage() {
  const session = await requireInternalSession("datasets");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title="Tambah / Draft Dataset"
        description="Gunakan form ini untuk membuat draft dataset baru. Draft tersimpan pada shared local store dan langsung muncul di workflow internal."
        badges={
          <>
            <Badge variant="outline">Simpan ke shared data layer</Badge>
            <Badge variant="outline">Siap submit ke workflow</Badge>
          </>
        }
      />

      <InternalDatasetForm
        mode="create"
        session={session}
        organizations={store.organizations}
        topics={store.topics}
      />
    </InternalShell>
  );
}


