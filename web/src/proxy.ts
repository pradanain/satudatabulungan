import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessNav,
  decodeInternalSession,
  resolveInternalNavKey,
  INTERNAL_SESSION_COOKIE,
} from "@/lib/utils/internal-auth";

const publicInternalPaths = new Set([
  "/internal",
  "/api/internal/auth/login",
  "/api/internal/auth/logout",
]);

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/internal";
  url.search = "";
  return NextResponse.redirect(url);
}

function isInternalApiPath(pathname: string): boolean {
  return pathname === "/api/internal" || pathname.startsWith("/api/internal/");
}

function buildApiAuthError(status: 401 | 403): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: status === 401 ? "Sesi internal tidak ditemukan." : "Anda tidak memiliki akses ke endpoint ini.",
    },
    { status },
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isInternalApi = isInternalApiPath(pathname);

  if (publicInternalPaths.has(pathname)) {
    return NextResponse.next();
  }

  const session = await decodeInternalSession(request.cookies.get(INTERNAL_SESSION_COOKIE)?.value);
  const navKey = resolveInternalNavKey(pathname);

  if (!session) {
    if (isInternalApi) {
      return buildApiAuthError(401);
    }

    return redirectToLogin(request);
  }

  if (navKey && !canAccessNav(session.role, navKey)) {
    if (isInternalApi) {
      return buildApiAuthError(403);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/internal/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/internal/:path*", "/api/internal/:path*"],
};
