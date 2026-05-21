import { NextResponse } from "next/server";
import { getScopedNotifications, loadInternalPortalStore, saveInternalPortalStore } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi internal tidak ditemukan.",
        },
        { status: 401 },
      );
    }

    const store = await loadInternalPortalStore();
    const notifications = getScopedNotifications(store, session);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengambil notifikasi.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi internal tidak ditemukan.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action } = body;

    const store = await loadInternalPortalStore();

    if (action === "markAllAsRead") {
      // Find all notifications that target this session's role and user
      store.notifications = store.notifications.map((notif) => {
        const isTarget =
          notif.targetRoles.includes(session.role) &&
          (!notif.userId || notif.userId === session.userId);
        
        if (isTarget && !notif.readByUserIds.includes(session.userId)) {
          return {
            ...notif,
            readByUserIds: [...notif.readByUserIds, session.userId],
          };
        }
        return notif;
      });

      await saveInternalPortalStore(store);
      return NextResponse.json({ success: true });
    }

    if (action === "markAsRead") {
      const { notificationId } = body;
      if (!notificationId) {
        return NextResponse.json({ success: false, error: "ID notifikasi diperlukan." }, { status: 400 });
      }

      store.notifications = store.notifications.map((notif) => {
        if (notif.id === notificationId && !notif.readByUserIds.includes(session.userId)) {
          return {
            ...notif,
            readByUserIds: [...notif.readByUserIds, session.userId],
          };
        }
        return notif;
      });

      await saveInternalPortalStore(store);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memperbarui notifikasi.",
      },
      { status: 500 },
    );
  }
}
