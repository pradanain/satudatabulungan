import { getOrganizations } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";

export const dynamic = "force-dynamic";

export default async function NewBeritaPage() {
  const session = await requireInternalSession("berita");
  const rawOrgs = await getOrganizations();
  const organizations = rawOrgs.map((org) => ({
    id: org.id,
    slug: org.slug,
    name: org.name,
    shortName: org.name,
    category: "Umum",
    datasetTarget: 0,
    status: "Aktif" as const,
    lastUpdated: new Date().toISOString(),
  }));

  return (
    <InternalShell session={session} activeKey="berita">
      <InternalPageHeader
        title="Tambah Berita"
        description="Buat berita baru untuk dipublikasikan."
      />
      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={organizations}
        fixedType="news"
      />
    </InternalShell>
  );
}
