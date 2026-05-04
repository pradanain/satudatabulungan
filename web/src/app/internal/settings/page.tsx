import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalSettingsForm } from "@/components/internal/internal-settings-form";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalSettingsPage() {
  const session = await requireInternalSession("settings");
  const store = await loadInternalPortalStore();

  return (
    <InternalShell session={session} activeKey="settings">
      <InternalPageHeader
        title="Pengaturan Portal"
        description="Kelola identitas portal, informasi kontak publik, dan banner operasional yang dipakai bersama oleh area internal dan publik."
        badges={<Badge variant="outline">Admin only</Badge>}
      />

      <InternalSettingsForm settings={store.settings} />
    </InternalShell>
  );
}


