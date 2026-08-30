import { NextResponse } from "next/server";
import { clearInternalSessionCookie } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return clearInternalSessionCookie(
    NextResponse.json({
      success: true,
    }),
    request,
  );
}
