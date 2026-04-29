import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalPasswordForm } from "@/components/internal/internal-password-form";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export default async function InternalProfilePage() {
  const session = await requireInternalSession("profile");
  const store = await loadInternalPortalStore();
  const user = store.users.find((item) => item.id === session.userId);

  return (
    <InternalShell session={session} activeKey="profile">
      <InternalPageHeader
        title="Profil & Ubah Password"
        description="Lihat ringkasan akun aktif dan perbarui password mock session untuk pengembangan lokal."
        badges={<Badge variant="outline">{session.username}</Badge>}
      />

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="m-0 text-xl font-semibold">Informasi Akun</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div>
              <p className="m-0 text-[var(--color-muted)]">Nama</p>
              <p className="mb-0 mt-1 font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="m-0 text-[var(--color-muted)]">Email</p>
              <p className="mb-0 mt-1 font-semibold">{user?.email}</p>
            </div>
            <div>
              <p className="m-0 text-[var(--color-muted)]">Role</p>
              <p className="mb-0 mt-1 font-semibold">{session.role}</p>
            </div>
            <div>
              <p className="m-0 text-[var(--color-muted)]">Organisasi</p>
              <p className="mb-0 mt-1 font-semibold">{session.organizationName}</p>
            </div>
          </div>
        </Card>

        <InternalPasswordForm />
      </section>
    </InternalShell>
  );
}
