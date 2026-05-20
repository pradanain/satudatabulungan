import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function NewBukuDigitalPage() {
  const session = await requireInternalSession("bukuDigital");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="bukuDigital">
      <InternalPageHeader
        title="Tambah Buku Digital"
        description="Unggah buku digital baru (PDF)."
      />
      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={store.organizations}
        fixedType="digital_publication"
      />
    </InternalShell>
  );
}
