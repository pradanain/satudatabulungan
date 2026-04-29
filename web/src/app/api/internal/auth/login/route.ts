import { NextResponse } from "next/server";
import { authenticateInternalUser } from "@/lib/services/internal-store";
import { applyInternalSessionCookie } from "@/lib/utils/internal-auth-server";

type LoginPayload = {
  username?: string;
  password?: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const username = payload.username?.trim() ?? "";
    const password = payload.password?.trim() ?? "";

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username dan password wajib diisi.",
        },
        { status: 400 },
      );
    }

    const session = await authenticateInternalUser(username, password);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Kredensial internal tidak valid.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      result: {
        role: session.role,
        name: session.name,
      },
    });

    return applyInternalSessionCookie(response, session, request);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Login internal gagal diproses.",
      },
      { status: 500 },
    );
  }
}
