import Link from "next/link";
import { Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getScopedPublicationsByType, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { PublicationTable } from "@/app/internal/publications/publication-table";

export const dynamic = "force-dynamic";

export default async function InternalBukuDigitalPage() {
  const session = await requireInternalSession("bukuDigital");
  const store = await loadInternalPortalStore();
  const publications = getScopedPublicationsByType(store, session, "digital_publication");

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
        {canCreate && (
          <div className="flex items-center justify-end px-4 pt-3 sm:px-5">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/internal/buku-digital/new">
                <Plus className="size-4" />
                Tambah Buku Digital
              </Link>
            </Button>
          </div>
        )}
        <PublicationTable publications={publications} session={session} />
      </Card>
    </InternalShell>
  );
}
