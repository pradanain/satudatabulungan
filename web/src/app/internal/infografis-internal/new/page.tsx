import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function NewInfografisPage() {
  const session = await requireInternalSession("infografis");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="infografis">
      <InternalPageHeader
        title="Tambah Infografis"
        description="Unggah infografis baru."
      />
      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={store.organizations}
        fixedType="infographic"
      />
    </InternalShell>
  );
}
