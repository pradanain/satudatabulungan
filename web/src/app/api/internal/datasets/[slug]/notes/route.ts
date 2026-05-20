import { NextResponse } from "next/server";
import { addDatasetNote } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi internal tidak ditemukan." },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const { type, category, message } = payload;

    if (!type || !category || !message) {
      return NextResponse.json(
        { success: false, error: "Payload tidak lengkap. type, category, dan message wajib diisi." },
        { status: 400 },
      );
    }

    const note = await addDatasetNote(slug, type, category, message, session);

    return NextResponse.json({
      success: true,
      result: note,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan catatan.";
    const status = inferInternalApiErrorStatus(msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status },
    );
  }
}
