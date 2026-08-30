import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import type { InternalNavKey, InternalSession } from "@/lib/types/internal";
import {
  INTERNAL_SESSION_COOKIE,
  canAccessNav,
  decodeInternalSession,
  encodeInternalSession,
} from "@/lib/utils/internal-auth";

export async function getOptionalInternalSession(): Promise<InternalSession | null> {
  const cookieStore = await cookies();
  return decodeInternalSession(cookieStore.get(INTERNAL_SESSION_COOKIE)?.value);
}

export async function requireInternalSession(navKey?: InternalNavKey): Promise<InternalSession> {
  const session = await getOptionalInternalSession();

  if (!session) {
    redirect("/internal");
  }

  if (navKey && !canAccessNav(session.role, navKey)) {
    redirect("/internal/dashboard");
  }

  return session;
}

export async function getInternalSessionFromCookieHeader(cookieHeader: string | null): Promise<InternalSession | null> {
  if (!cookieHeader) {
    return null;
  }

  const entry = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${INTERNAL_SESSION_COOKIE}=`));

  if (!entry) {
    return null;
  }

  return decodeInternalSession(entry.slice(INTERNAL_SESSION_COOKIE.length + 1));
}

function shouldUseSecureInternalCookie(requestOrUrl?: Request | string | URL): boolean {
  if (requestOrUrl instanceof Request) {
    return new URL(requestOrUrl.url).protocol === "https:";
  }

  if (requestOrUrl instanceof URL) {
    return requestOrUrl.protocol === "https:";
  }

  if (typeof requestOrUrl === "string" && requestOrUrl) {
    return new URL(requestOrUrl).protocol === "https:";
  }

  return process.env.NODE_ENV === "production";
}

export async function applyInternalSessionCookie(
  response: NextResponse,
  session: InternalSession,
  requestOrUrl?: Request | string | URL,
): Promise<NextResponse> {
  const encodedSession = await encodeInternalSession(session);

  response.cookies.set(INTERNAL_SESSION_COOKIE, encodedSession, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureInternalCookie(requestOrUrl),
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export function clearInternalSessionCookie(response: NextResponse, requestOrUrl?: Request | string | URL): NextResponse {
  response.cookies.set(INTERNAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureInternalCookie(requestOrUrl),
    path: "/",
    expires: new Date(0),
  });

  return response;
}
