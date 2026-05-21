import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { getOrganizations } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function NewBukuDigitalPage() {
  const session = await requireInternalSession("bukuDigital");
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
    <InternalShell session={session} activeKey="bukuDigital">
      <InternalPageHeader
        title="Tambah Buku Digital"
        description="Buat publikasi buku digital baru untuk portal."
      />
      <InternalPublicationForm
        mode="create"
        session={session}
        organizations={organizations}
        fixedType="digital_publication"
      />
    </InternalShell>
  );
}
