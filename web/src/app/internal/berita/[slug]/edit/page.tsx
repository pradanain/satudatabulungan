import { notFound } from "next/navigation";
import { InternalShell } from "@/components/internal/internal-shell";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBeritaPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("berita");
  const store = await loadInternalPortalStore();

  const pub = (store.publications || []).find((p) => p.slug === slug && p.type === "news");
  if (!pub) {
    notFound();
  }

  // Auth check
  const canEdit = hasPermission(session, "content.manage_all") ||
    (hasPermission(session, "content.edit_own_draft") && pub.createdByUserId === session.userId);
  if (!canEdit) {
    notFound();
  }

  return (
    <InternalShell session={session} activeKey="berita">
      <InternalPageHeader
        title="Edit Berita"
        description={`Mengedit: ${pub.title}`}
      />
      <InternalPublicationForm
        mode="edit"
        session={session}
        organizations={store.organizations}
        initialData={pub}
        fixedType="news"
      />
    </InternalShell>
  );
}
