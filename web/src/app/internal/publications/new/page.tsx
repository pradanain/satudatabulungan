import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalPublicationNewPage() {
  const session = await requireInternalSession("publications");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="publications">
      <InternalPageHeader
        title="Tambah / Unggah Konten"
        description="Gunakan form ini untuk membuat publikasi, infografis, berita, atau regulasi baru."
      />

      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={store.organizations}
      />
    </InternalShell>
  );
}
