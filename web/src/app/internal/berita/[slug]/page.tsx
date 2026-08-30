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

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("berita");

  const ckanPub = await getCkanPublicationBySlug(slug);
  if (!ckanPub || ckanPub.contentType !== "news") {
    notFound();
  }

  const pub = mapPortalDatasetToPublication(ckanPub);

  // Auth: produsen can only see own OPD
  if (!hasPermission(session, "content.view_all") && pub.organizationId !== session.organizationId) {
    notFound();
  }

  return (
    <InternalShell session={session} activeKey="berita">
      <InternalPublicationDetail
        publication={pub}
        session={session}
        backHref="/internal/berita"
        backLabel="Kembali ke Berita"
        editHref={`/internal/berita/${pub.slug}/edit`}
      />
    </InternalShell>
  );
}
