"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellOff, Check, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InternalNotification, InternalSession } from "@/lib/types/internal";
import { formatIndonesianDate } from "@/lib/utils/formatters";

type InternalNotificationPopoverProps = {
  session: InternalSession;
};

export function InternalNotificationPopover({ session }: InternalNotificationPopoverProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch notifications from our API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/notifications");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);
    // Poll notifications every 30 seconds for real-time feel
    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  const unreadNotifications = notifications.filter(
    (n) => !n.readByUserIds.includes(session.userId)
  );
  const readNotifications = notifications.filter(
    (n) => n.readByUserIds.includes(session.userId)
  );

  const unreadCount = unreadNotifications.length;

  async function handleMarkAllAsRead() {
    // Optimistic local update
    const updated = notifications.map((n) => ({
      ...n,
      readByUserIds: n.readByUserIds.includes(session.userId)
        ? n.readByUserIds
        : [...n.readByUserIds, session.userId],
    }));
    setNotifications(updated);

    try {
      await fetch("/api/internal/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
      router.refresh();
    } catch (error) {
      console.error("Gagal menandai semua dibaca:", error);
      void fetchNotifications(); // Rollback if error
    }
  }

  async function handleMarkAsRead(notifId: string) {
    // Optimistic local update
    const updated = notifications.map((n) => {
      if (n.id === notifId && !n.readByUserIds.includes(session.userId)) {
        return {
          ...n,
          readByUserIds: [...n.readByUserIds, session.userId],
        };
      }
      return n;
    });
    setNotifications(updated);

    try {
      await fetch("/api/internal/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", notificationId: notifId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Gagal menandai dibaca:", error);
      void fetchNotifications(); // Rollback if error
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--color-muted)] hover:text-[var(--color-text)] relative transition-all duration-200"
          aria-label="Notifikasi"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 shadow-xl border border-[var(--color-border)] bg-white rounded-2xl overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3.5 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[var(--color-text)]">Notifikasi</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-red-200 bg-red-50 text-red-700">
                {unreadCount} baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7 text-[var(--color-primary)] hover:text-[#8f1717] hover:bg-red-50/30 px-2 font-bold flex items-center gap-1"
            >
              <Check className="size-3.5" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Content body */}
        <div className="p-3">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : (
            <Tabs defaultValue="unread" className="w-full">
              <TabsList className="grid grid-cols-2 h-9 p-1 rounded-xl bg-gray-100/80 mb-2 border-0">
                <TabsTrigger
                  value="unread"
                  className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Belum Dibaca ({unreadNotifications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="read"
                  className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Sudah Dibaca ({readNotifications.length})
                </TabsTrigger>
              </TabsList>

              {/* UNREAD TABS */}
              <TabsContent value="unread" className="mt-0">
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar pr-0.5">
                  {unreadNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600 mb-3">
                        <BellOff className="size-5" />
                      </div>
                      <p className="text-xs font-bold text-[var(--color-text)]">Semua notifikasi sudah dibaca</p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Kerja bagus! Kotak masuk Anda bersih.</p>
                    </div>
                  ) : (
                    unreadNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          setOpen(false);
                        }}
                        className="flex items-start gap-3 p-3 transition-colors hover:bg-blue-50/20 bg-blue-50/10 rounded-lg my-1 group first:mt-0 last:mb-0"
                      >
                        <div className="mt-1 flex-shrink-0">
                          <Circle className="size-2.5 fill-blue-600 text-blue-600 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                              {notif.title}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 h-4 shrink-0 uppercase tracking-wide bg-blue-50 text-blue-700 hover:bg-blue-50 font-bold"
                            >
                              {notif.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-[var(--color-muted)]/70 font-semibold block mt-1.5">
                            {formatIndonesianDate(notif.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* READ TABS */}
              <TabsContent value="read" className="mt-0">
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar pr-0.5">
                  {readNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-slate-50 text-[var(--color-muted)] mb-3">
                        <BellOff className="size-5" />
                      </div>
                      <p className="text-xs font-bold text-[var(--color-text)]">Belum ada riwayat</p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Notifikasi yang dibaca akan muncul di sini.</p>
                    </div>
                  ) : (
                    readNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 rounded-lg my-1 group first:mt-0 last:mb-0"
                      >
                        <div className="mt-1 flex-shrink-0 size-2.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-slate-700 group-hover:text-[var(--color-primary)] transition-colors truncate">
                              {notif.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 h-4 shrink-0 uppercase tracking-wide bg-slate-50 text-slate-600 font-medium"
                            >
                              {notif.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-[var(--color-muted)]/70 font-semibold block mt-1.5">
                            {formatIndonesianDate(notif.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
