import { notFound } from "next/navigation";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPublicationDetail } from "@/components/internal/internal-publication-detail";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("berita");
  const store = await loadInternalPortalStore();

  const pub = (store.publications || []).find((p) => p.slug === slug && p.type === "news");
  if (!pub) {
    notFound();
  }

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
