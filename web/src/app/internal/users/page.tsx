import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAccounts } from "@/lib/services/ckan-portal-api";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { internalRoleLabels } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

export default async function InternalUsersPage() {
  const session = await requireInternalSession("users");
  const accounts = await getAccounts().catch(() => []);

  return (
    <InternalShell session={session} activeKey="users">
      <InternalPageHeader
        title="Users & Roles"
        description="Kelola daftar akun internal, role, dan cakupan organisasi yang disimpan pada backend CKAN."
        badges={
          <>
            <Badge variant="outline">{accounts.length} akun</Badge>
            <Badge variant="outline">3 role final</Badge>
          </>
        }
      />

      <Card className="internal-surface overflow-hidden border-transparent shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Organisasi</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Permission</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((user) => (
                <tr key={user.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-4">
                    <p className="m-0 font-semibold">{user.name}</p>
                    <p className="mb-0 mt-1 text-xs text-[var(--color-muted)]">{user.username}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">{internalRoleLabels[user.role]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{user.organizationName}</td>
                  <td className="px-5 py-4 text-[var(--color-muted)]">{user.status}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission) => (
                        <Badge key={`${user.id}-${permission}`} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </InternalShell>
  );
}

