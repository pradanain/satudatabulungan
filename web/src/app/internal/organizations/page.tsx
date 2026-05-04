import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalOrganizationsPage() {
  const session = await requireInternalSession("organizations");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="organizations">
      <InternalPageHeader
        title="Organisasi / OPD"
        description="Pantau kesiapan organisasi, target dataset, dan status tindak lanjut untuk sinkronisasi data lintas OPD."
        badges={
          <>
            <Badge variant="outline">{store.organizations.length} organisasi</Badge>
            <Badge variant="outline">
              {store.organizations.filter((item) => item.status === "Perlu Tindak Lanjut").length} perlu tindak lanjut
            </Badge>
          </>
        }
      />

      <Card className="internal-surface overflow-hidden border-transparent shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Organisasi</th>
                <th className="px-5 py-3 font-semibold">PIC</th>
                <th className="px-5 py-3 font-semibold">Target Dataset</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {store.organizations.map((organization) => (
                <tr key={organization.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-4">
                    <p className="m-0 font-semibold">{organization.shortName}</p>
                    <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{organization.category}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="m-0">{organization.leadName}</p>
                    <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{organization.leadTitle}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold">{organization.datasetTarget}</td>
                  <td className="px-5 py-4">
                    <Badge variant={organization.status === "Aktif" ? "secondary" : "outline"}>{organization.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{formatIndonesianDate(organization.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </InternalShell>
  );
}


