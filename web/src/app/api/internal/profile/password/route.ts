import { NextResponse } from "next/server";
import { updateInternalPassword } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

type PasswordPayload = {
  currentPassword?: string;
  nextPassword?: string;
  confirmPassword?: string;
};

export const dynamic = "force-dynamic";

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

    const payload = (await request.json()) as PasswordPayload;
    const currentPassword = payload.currentPassword?.trim() ?? "";
    const nextPassword = payload.nextPassword?.trim() ?? "";
    const confirmPassword = payload.confirmPassword?.trim() ?? "";

    if (!currentPassword || !nextPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Semua field password wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (nextPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password baru minimal 8 karakter.",
        },
        { status: 400 },
      );
    }

    if (nextPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Konfirmasi password baru tidak cocok.",
        },
        { status: 400 },
      );
    }

    await updateInternalPassword(session, currentPassword, nextPassword);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui password.";
    const status = message.includes("sesuai") ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
