import { NextResponse } from "next/server";
import { updatePortalSettings } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

type SettingsPayload = {
  portalName?: string;
  publicEmail?: string;
  publicPhone?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  footerNote?: string;
  notificationBanner?: string;
};

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
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

    const payload = (await request.json()) as SettingsPayload;
    const result = await updatePortalSettings(session, {
      portalName: payload.portalName?.trim(),
      publicEmail: payload.publicEmail?.trim(),
      publicPhone: payload.publicPhone?.trim(),
      heroHeadline: payload.heroHeadline?.trim(),
      heroSubheadline: payload.heroSubheadline?.trim(),
      footerNote: payload.footerNote?.trim(),
      notificationBanner: payload.notificationBanner?.trim(),
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan pengaturan portal.";
    const isPermissionDenied = message.toLowerCase().includes("hanya walidata") || message.toLowerCase().includes("tidak memiliki");
    const status = isPermissionDenied ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
