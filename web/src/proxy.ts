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

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (publicInternalPaths.has(pathname)) {
    return NextResponse.next();
  }

  const session = decodeInternalSession(request.cookies.get(INTERNAL_SESSION_COOKIE)?.value);
  if (!session) {
    return redirectToLogin(request);
  }

  const navKey = resolveInternalNavKey(pathname);
  if (navKey && !canAccessNav(session.role, navKey)) {
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
