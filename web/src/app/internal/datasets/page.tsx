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
import {
  PublicationStatusTabs,
  type PublicationStatusTab,
  countByTab,
  filterByTab,
} from "@/app/internal/publications/publication-status-tabs";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternalDatasetsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const tabParam = typeof rawParams.tab === "string" ? rawParams.tab : "semua";
  const activeTab: PublicationStatusTab =
    ["semua", "draft", "diajukan", "diperiksa", "published"].includes(tabParam)
      ? (tabParam as PublicationStatusTab)
      : "semua";

  const session = await requireInternalSession("datasets");
  const store = await loadInternalPortalStore();
  const allDatasets = getScopedDatasets(store, session);

  const tabCounts = countByTab(allDatasets);
  const datasets = filterByTab(allDatasets, activeTab);

  const canCreate = hasPermission(session, "dataset.create_own_opd");

  return (
    <InternalShell session={session} activeKey="datasets">
      <InternalPageHeader
        title={session.role === "produsen" ? "Dataset OPD" : "Daftar Dataset"}
        description={
          session.role === "produsen"
            ? "Kelola dataset yang dikontribusikan oleh OPD Anda."
            : session.role === "walidata"
              ? "Kelola seluruh dataset yang masuk dan dipublikasikan."
              : "Lihat dan pantau daftar dataset di seluruh portal."
        }
        badges={
          allDatasets.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(allDatasets.length)} Dataset</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <PublicationStatusTabs
          activeTab={activeTab}
          basePath="/internal/datasets"
          counts={tabCounts}
        />
        <DatasetTable
          datasets={datasets}
          actionButton={
            canCreate ? (
              <Button asChild size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Link href="/internal/datasets/new">
                  <Plus className="size-4" />
                  Tambah Dataset
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
