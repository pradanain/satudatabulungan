import { notFound } from "next/navigation";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import {
  getCkanPublicationBySlug,
  getOrganizations,
  mapPortalDatasetToPublication,
} from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBukuDigitalPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("bukuDigital");

  const ckanPub = await getCkanPublicationBySlug(slug);
  if (!ckanPub || ckanPub.contentType !== "publikasi") {
    notFound();
  }

  const pub = mapPortalDatasetToPublication(ckanPub);

  const canEdit = hasPermission(session, "content.manage_all") ||
    (hasPermission(session, "content.edit_own_draft") && pub.createdByUserId === session.username);
  if (!canEdit) notFound();

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
        title="Edit Buku Digital"
        description={`Mengedit: ${pub.title}`}
      />
      <InternalPublicationForm
        mode="edit"
        session={session}
        organizations={organizations}
        initialData={pub}
        fixedType="digital_publication"
      />
    </InternalShell>
  );
}
