import { NextResponse } from "next/server";
import { login } from "@/lib/services/ckan-portal-api";
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

    let ckanSession = null;
    let ckanUnavailable = false;

    try {
      ckanSession = await login(username, password);
    } catch (error) {
      ckanUnavailable = true;
      const reason = error instanceof Error ? error.message : "Unknown CKAN auth error.";
      console.warn(`[auth] CKAN login unavailable, fallback to local store. reason=${reason}`);
    }

    const localSession = await authenticateInternalUser(username, password);
    const session = ckanSession ?? localSession;

    if (!session) {
      const errorCode = ckanUnavailable ? "AUTH_UPSTREAM_UNAVAILABLE" : "INVALID_CREDENTIALS";
      return NextResponse.json(
        {
          success: false,
          error: "Kredensial internal tidak valid.",
          errorCode,
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

    return await applyInternalSessionCookie(response, session, request);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown internal login error.";
    console.error(`[auth] Internal login handler failed: ${reason}`);
    return NextResponse.json(
      {
        success: false,
        error: "Login internal gagal diproses.",
      },
      { status: 500 },
    );
  }
}

