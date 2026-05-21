import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { OpdTable } from "./opd-table";

export const dynamic = "force-dynamic";

export default async function InternalOrganizationsPage() {
  const session = await requireInternalSession("organizations");
  const store = await loadInternalPortalStore();

  const canManage = hasPermission(session, "master_data.manage_organizations");

  // Count real datasets per organization
  const datasetCountByOrg = new Map<string, number>();
  for (const ds of store.datasets) {
    const count = datasetCountByOrg.get(ds.organizationId) || 0;
    datasetCountByOrg.set(ds.organizationId, count + 1);
  }

  const orgsWithCounts = store.organizations.map(org => ({
    ...org,
    datasetCount: datasetCountByOrg.get(org.id) || 0,
  }));

  return (
    <InternalShell session={session} activeKey="organizations">
      <InternalPageHeader
        title="OPD"
        description="Kelola data Organisasi Perangkat Daerah yang berkontribusi dalam pengelolaan dataset."
        badges={<Badge variant="outline">{store.organizations.length} OPD</Badge>}
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <OpdTable
          organizations={orgsWithCounts}
          actionButton={
            canManage ? (
              <Button size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Plus className="size-4" />
                Tambah OPD
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
