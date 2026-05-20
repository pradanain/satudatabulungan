import { NextResponse } from "next/server";
import { updateInternalPublication } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi internal tidak ditemukan." }, { status: 401 });
    }

    const { slug } = await context.params;
    const payload = await request.json();

    const title = payload.title?.trim();
    const description = payload.description?.trim();
    const status = payload.status;
    const type = payload.type;
    const organizationId = payload.organizationId;

    const isProdusen = session.role === "produsen";
    if (isProdusen) {
      if (organizationId && organizationId !== session.organizationId) {
        return NextResponse.json({ success: false, error: "Anda tidak memiliki izin mengunggah untuk OPD lain." }, { status: 403 });
      }
      if (type && !["digital_publication", "infographic"].includes(type)) {
        return NextResponse.json({ success: false, error: "Produsen hanya diizinkan mengunggah Publikasi Digital atau Infografis." }, { status: 403 });
      }
      if (status === "Published") {
        return NextResponse.json({ success: false, error: "Produsen tidak memiliki izin untuk menerbitkan langsung." }, { status: 403 });
      }
    }

    const result = await updateInternalPublication(
      slug,
      {
        title,
        description,
        content: payload.content,
        fileUrl: payload.fileUrl,
        imageUrl: payload.imageUrl,
        status,
        year: payload.year,
        regulationNumber: payload.regulationNumber,
      },
      session
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui konten." },
      { status: 500 }
    );
  }
}
