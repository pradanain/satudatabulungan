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

export const dynamic = "force-dynamic";

export default async function InternalBukuDigitalPage() {
  const session = await requireInternalSession("bukuDigital");
  const rawBooks = await getCkanPublications("publikasi");
  const allBooks = rawBooks.map(mapPortalDatasetToPublication);
  const publications =
    hasPermission(session, "content.view_all")
      ? allBooks
      : allBooks.filter((pub) => pub.organizationId === session.organizationId || pub.createdByUserId === session.username);

  const canCreate =
    hasPermission(session, "digital_publication.create_own_opd") ||
    hasPermission(session, "content.manage_all");

  return (
    <InternalShell session={session} activeKey="bukuDigital">
      <InternalPageHeader
        title="Buku Digital"
        description="Kelola publikasi buku digital untuk portal publik."
        badges={
          publications.length > 0 ? (
            <Badge variant="outline">{formatCompactNumber(publications.length)} Buku Digital</Badge>
          ) : null
        }
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <PublicationTable 
          publications={publications} 
          session={session} 
          actionButton={
            canCreate ? (
              <Button asChild size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Link href="/internal/buku-digital/new">
                  <Plus className="size-4" />
                  Tambah Buku Digital
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
