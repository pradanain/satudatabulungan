import Link from "next/link";
import { Check, CheckCircle2, Circle, MessageSquareWarning } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getScopedAuditLogs, getScopedNotifications, loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function InternalNotificationsPage() {
  const session = await requireInternalSession("notifications");
  const store = await loadInternalPortalStore();
  const notifications = getScopedNotifications(store, session);
  const activity = getScopedAuditLogs(store, session).slice(0, 10);

  const unreadCount = notifications.length; // Assume all unread for mockup

  return (
    <InternalShell session={session} activeKey="notifications">
      <InternalPageHeader
        title="Notifikasi & Aktivitas"
        description="Lihat tugas, peringatan, dan riwayat aktivitas terbaru Anda."
        badges={
          <>
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">{unreadCount} Belum Dibaca</Badge>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] items-start">
        {/* Notifikasi List */}
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between bg-gray-50/50">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              <Badge variant="secondary" className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)] cursor-pointer">Belum Dibaca</Badge>
              <Badge variant="outline" className="cursor-pointer bg-white">Review</Badge>
              <Badge variant="outline" className="cursor-pointer bg-white">Revisi</Badge>
              <Badge variant="outline" className="cursor-pointer bg-white">Semua</Badge>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-[var(--color-primary)] h-8 text-xs font-semibold">
              <Check className="mr-1 size-3" /> Tandai Semua Dibaca
            </Button>
          </div>
          
          <div className="divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[var(--color-muted)]">
                Tidak ada notifikasi.
              </div>
            ) : (
              notifications.map((notification, i) => {
                const isUnread = i < 3; // Mocking read state
                return (
                  <Link key={notification.id} href={notification.link} className={`flex items-start gap-4 p-4 transition-colors hover:bg-[var(--color-surface-soft)]/50 ${isUnread ? 'bg-blue-50/30' : ''}`}>
                    <div className="shrink-0 mt-0.5">
                      {isUnread ? (
                        <Circle className="size-3 fill-blue-600 text-blue-600" />
                      ) : (
                        <CheckCircle2 className="size-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'} text-[var(--color-text)]`}>{notification.title}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{notification.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-muted)] leading-relaxed">{notification.message}</p>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-xs bg-white">Tindak Lanjut</Button>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Aktivitas Saya */}
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden bg-gray-50/50">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-base font-bold">Aktivitas Saya</h2>
          </div>
          <div className="p-5 space-y-6">
            {activity.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-[var(--color-primary)] bg-white" />
                <div className="absolute left-[5px] top-4 h-full w-px bg-[var(--color-border)]" />
                <p className="text-sm font-semibold text-[var(--color-text)]">{log.summary}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {formatIndonesianDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}
