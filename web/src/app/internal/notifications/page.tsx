import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getScopedAuditLogs, getScopedNotifications, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalNotificationsPage() {
  const session = await requireInternalSession("notifications");
  const store = await loadInternalPortalStore();
  const notifications = getScopedNotifications(store, session);
  const activity = getScopedAuditLogs(store, session).slice(0, 6);

  return (
    <InternalShell session={session} activeKey="notifications">
      <InternalPageHeader
        title="Notifikasi & Aktivitas"
        description="Pusat ringkas untuk pengingat review, perubahan status dataset, dan aktivitas penting yang terkait dengan peran Anda."
        badges={<Badge variant="outline">{notifications.length} notifikasi aktif</Badge>}
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <h2 className="m-0 text-xl font-semibold">Daftar Notifikasi</h2>
          <div className="mt-4 grid gap-3">
            {notifications.map((notification) => (
              <Link key={notification.id} href={notification.link} className="rounded-2xl border border-[var(--color-border)] p-4 transition hover:border-[var(--color-primary)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-sm font-semibold">{notification.title}</p>
                  <Badge variant="secondary">{notification.type}</Badge>
                </div>
                <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">{notification.message}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="m-0 text-xl font-semibold">Aktivitas Saya</h2>
          <div className="mt-4 grid gap-3">
            {activity.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[var(--color-border)] p-4">
                <p className="m-0 text-sm font-semibold">{log.summary}</p>
                <p className="mb-0 mt-2 text-xs text-[var(--color-muted)]">
                  {log.actorName} • {formatIndonesianDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}
