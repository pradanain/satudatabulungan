import Link from "next/link";
import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { PublicationTable } from "./publication-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedPublications, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { formatCompactNumber } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalPublicationsPage() {
  const session = await requireInternalSession("publications");
  const store = await loadInternalPortalStore();
  const publications = getScopedPublications(store, session);

  const canCreate =
    hasPermission(session, "content.create_own_opd") ||
    hasPermission(session, "content.manage_all") ||
    hasPermission(session, "news.manage") ||
    hasPermission(session, "regulation.manage") ||
    hasPermission(session, "technical_guide.manage");

  return (
    <InternalShell session={session} activeKey="publications">
      <InternalPageHeader
        title="Publikasi"
        description={
          session.role === "produsen"
            ? "Kelola Publikasi Digital dan Infografis OPD Anda."
            : "Kelola Berita, Publikasi Digital, Infografis, Regulasi, dan Petunjuk Teknis untuk portal publik."
        }
        badges={
          publications.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(publications.length)} Konten</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        {canCreate && (
          <div className="flex items-center justify-end px-4 pt-3 sm:px-5">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/internal/publications/new">
                <Plus className="size-4" />
                Tambah Konten
              </Link>
            </Button>
          </div>
        )}
        <PublicationTable publications={publications} session={session} />
      </Card>
    </InternalShell>
  );
}
