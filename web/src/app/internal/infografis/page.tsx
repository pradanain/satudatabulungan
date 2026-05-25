import Link from "next/link";
import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCkanPublications, mapPortalDatasetToPublication } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { PublicationTable } from "@/app/internal/publications/publication-table";
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

export default async function InternalInfografisPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const tabParam = typeof rawParams.tab === "string" ? rawParams.tab : "semua";
  const activeTab: PublicationStatusTab =
    ["semua", "draft", "diajukan", "diperiksa", "published"].includes(tabParam)
      ? (tabParam as PublicationStatusTab)
      : "semua";

  const session = await requireInternalSession("infografis");
  let rawInfografis = [] as Awaited<ReturnType<typeof getCkanPublications>>;
  let loadError: string | null = null;
  try {
    rawInfografis = await getCkanPublications("infografis");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(`[internal/infografis] gagal memuat publikasi dari CKAN: ${reason}`);
    loadError = "Data infografis dari CKAN sedang tidak tersedia. Menampilkan data kosong sementara.";
  }

  const allInfografis = rawInfografis.map(mapPortalDatasetToPublication);
  const allFiltered =
    hasPermission(session, "content.view_all")
      ? allInfografis
      : allInfografis.filter((pub) => pub.organizationId === session.organizationId || pub.createdByUserId === session.username);

  const tabCounts = countByTab(allFiltered);
  const publications = filterByTab(allFiltered, activeTab);

  const canCreate =
    hasPermission(session, "infographic.create_own_opd") ||
    hasPermission(session, "content.manage_all");

  return (
    <InternalShell session={session} activeKey="infografis">
      <InternalPageHeader
        title="Infografis"
        description="Kelola infografis yang dipublikasikan melalui portal publik."
        badges={
          allFiltered.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(allFiltered.length)} Infografis</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        {loadError ? (
          <div className="border-b border-[var(--color-border)] bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        ) : null}

        <PublicationStatusTabs
          activeTab={activeTab}
          basePath="/internal/infografis"
          counts={tabCounts}
        />

        <PublicationTable
          publications={publications}
          session={session}
          actionButton={
            canCreate ? (
              <Button asChild size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Link href="/internal/infografis/new">
                  <Plus className="size-4" />
                  Tambah Infografis
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
