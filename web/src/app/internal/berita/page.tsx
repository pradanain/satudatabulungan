import Link from "next/link";
import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getNews, mapPortalDatasetToPublication } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { PublicationTable } from "@/app/internal/publications/publication-table";

export const dynamic = "force-dynamic";

export default async function InternalBeritaPage() {
  const session = await requireInternalSession("berita");
  let rawNews = [] as Awaited<ReturnType<typeof getNews>>;
  let loadError: string | null = null;
  try {
    rawNews = await getNews();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(`[internal/berita] gagal memuat daftar berita dari CKAN: ${reason}`);
    loadError = "Data berita dari CKAN sedang tidak tersedia. Menampilkan data kosong sementara.";
  }

  const allNews = rawNews.map(mapPortalDatasetToPublication);
  const publications =
    hasPermission(session, "content.view_all")
      ? allNews
      : allNews.filter((pub) => pub.organizationId === session.organizationId || pub.createdByUserId === session.username);

  const canCreate =
    hasPermission(session, "news.create_own_opd") ||
    hasPermission(session, "news.manage") ||
    hasPermission(session, "content.manage_all");

  return (
    <InternalShell session={session} activeKey="berita">
      <InternalPageHeader
        title="Berita"
        description="Kelola berita yang dipublikasikan melalui portal publik."
        badges={
          publications.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(publications.length)} Berita</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        {loadError ? (
          <div className="border-b border-[var(--color-border)] bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        ) : null}
        <PublicationTable 
          publications={publications} 
          session={session} 
          actionButton={
            canCreate ? (
              <Button asChild size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Link href="/internal/berita/new">
                  <Plus className="size-4" />
                  Tambah Berita
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
