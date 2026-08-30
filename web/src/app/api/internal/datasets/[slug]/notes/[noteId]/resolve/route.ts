import { NextResponse } from "next/server";
import { resolveDatasetNote } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; noteId: string }> },
) {
  try {
    const { slug, noteId } = await params;
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi internal tidak ditemukan." },
        { status: 401 },
      );
    }

    const note = await resolveDatasetNote(slug, noteId, session);

    return NextResponse.json({
      success: true,
      result: note,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal memproses penyelesaian catatan.";
    const status = inferInternalApiErrorStatus(msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status },
    );
  }
}
