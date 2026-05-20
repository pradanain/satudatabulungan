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

export default async function BukuDigitalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("bukuDigital");
  const store = await loadInternalPortalStore();

  const pub = (store.publications || []).find((p) => p.slug === slug && p.type === "digital_publication");
  if (!pub) {
    notFound();
  }

  if (!hasPermission(session, "content.view_all") && pub.organizationId !== session.organizationId) {
    notFound();
  }

  return (
    <InternalShell session={session} activeKey="bukuDigital">
      <InternalPublicationDetail
        publication={pub}
        session={session}
        backHref="/internal/buku-digital"
        backLabel="Kembali ke Buku Digital"
        editHref={`/internal/buku-digital/${pub.slug}/edit`}
      />
    </InternalShell>
  );
}
