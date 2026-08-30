import { notFound } from "next/navigation";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPublicationDetail } from "@/components/internal/internal-publication-detail";
import { getCkanPublicationBySlug, mapPortalDatasetToPublication } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InfografisDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("infografis");

  const ckanPub = await getCkanPublicationBySlug(slug);
  if (!ckanPub || ckanPub.contentType !== "infografis") {
    notFound();
  }

  const pub = mapPortalDatasetToPublication(ckanPub);

  if (!hasPermission(session, "content.view_all") && pub.organizationId !== session.organizationId) {
    notFound();
  }

  return (
    <InternalShell session={session} activeKey="infografis">
      <InternalPublicationDetail
        publication={pub}
        session={session}
        backHref="/internal/infografis"
        backLabel="Kembali ke Infografis"
        editHref={`/internal/infografis/${pub.slug}/edit`}
      />
    </InternalShell>
  );
}
