import Link from "next/link";
import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { DatasetTable } from "./dataset-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedDatasets, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { formatCompactNumber } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalDatasetsPage() {
  const session = await requireInternalSession("datasets");
  const store = await loadInternalPortalStore();
  const datasets = getScopedDatasets(store, session);

  const canCreate = hasPermission(session, "dataset.create_own_opd");

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title="Dataset"
        description="Kelola dataset yang akan dipublikasikan."
        badges={
          datasets.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(datasets.length)} Dataset</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        {canCreate && (
          <div className="flex items-center justify-end px-4 pt-3 sm:px-5">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/internal/datasets/new">
                <Plus className="size-4" />
                Tambah Dataset
              </Link>
            </Button>
          </div>
        )}
        <DatasetTable datasets={datasets} />
      </Card>
    </InternalShell>
  );
}
