import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { getAccounts } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { UserRolesTabs } from "./user-roles-tabs";

export const dynamic = "force-dynamic";

export default async function InternalUsersPage() {
  const session = await requireInternalSession("users");
  const accounts = await getAccounts().catch(() => []);

  return (
    <InternalShell session={session} activeKey="users">
      <InternalPageHeader
        title="Users"
        description="Kelola pengguna internal, hak akses, dan organisasi yang terdaftar."
        badges={
          accounts.length > 0 ? (
            <Badge variant="outline">{accounts.length} pengguna</Badge>
          ) : null
        }
      />

      <UserRolesTabs accounts={accounts} />
    </InternalShell>
  );
}
