import { notFound } from "next/navigation";
import { InternalPublicationForm } from "@/components/internal/internal-publication-form";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InternalPublicationEditPage({ params }: EditPageProps) {
  const { slug } = await params;
  const session = await requireInternalSession("publications");
  const store = await loadInternalPortalStore();

  const pub = (store.publications || []).find((p) => p.slug === slug);
  if (!pub) {
    notFound();
  }

  // Auth check: Produsen can only edit own OPD
  if (!hasPermission(session, "content.manage_all")) {
    if (pub.organizationId !== session.organizationId) {
      return (
        <InternalShell session={session} activeKey="publications">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-bold text-red-600">Akses Ditolak</h2>
            <p className="mt-2 text-gray-600">Anda tidak memiliki izin untuk mengedit publikasi dari OPD lain.</p>
          </div>
        </InternalShell>
      );
    }
  }

  return (
    <InternalShell session={session} activeKey="publications">
      <InternalPageHeader
        title={`Edit Konten: ${pub.title}`}
        description="Perbarui informasi publikasi atau unggah dokumen pendukung baru."
      />

      <InternalPublicationForm
        mode="edit"
        session={session}
        organizations={store.organizations}
        initialData={pub}
      />
    </InternalShell>
  );
}
