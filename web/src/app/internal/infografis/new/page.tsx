import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { getOrganizations } from "@/lib/services/ckan-portal-api";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function NewInfografisPage() {
  const session = await requireInternalSession("infografis");
  const organizations = await (async () => {
    try {
      const rawOrgs = await getOrganizations();
      return rawOrgs.map((org) => ({
        id: org.id,
        slug: org.slug,
        name: org.name,
        shortName: org.name,
        category: "Umum",
        datasetTarget: 0,
        status: "Aktif" as const,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error(`[internal/infografis/new] gagal memuat organisasi dari CKAN: ${reason}`);
      const store = await loadInternalPortalStore();
      return store.organizations.map((org) => ({
        id: org.id,
        slug: org.slug,
        name: org.name,
        shortName: org.shortName || org.name,
        category: org.category,
        datasetTarget: org.datasetTarget,
        status: org.status,
        lastUpdated: org.lastUpdated,
      }));
    }
  })();

  return (
    <InternalShell session={session} activeKey="infografis">
      <InternalPageHeader
        title="Tambah Infografis"
        description="Unggah infografis baru."
      />
      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={organizations}
        fixedType="infographic"
      />
    </InternalShell>
  );
}
