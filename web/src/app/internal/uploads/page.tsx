import { InternalContentUploadForm } from "@/components/internal/internal-content-upload-form";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { getOrganizations } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalUploadsPage() {
  const session = await requireInternalSession("datasets");
  const organizations = await getOrganizations().catch(() => []);

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title="Upload Dataset, Infografis, dan Buku"
        description="Unggah konten langsung ke backend CKAN. Walidata dapat melakukan validasi/kurasi/publikasi, operator hanya untuk organisasi sendiri."
        badges={
          <>
            <Badge variant="outline">Backend CKAN</Badge>
            <Badge variant="outline">Role-based permission</Badge>
          </>
        }
      />

      <InternalContentUploadForm
        session={session}
        organizations={organizations.map((item) => ({ id: item.id, name: item.name }))}
      />
    </InternalShell>
  );
}

