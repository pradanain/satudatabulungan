import { NextResponse } from "next/server";
import { createInternalPublication } from "@/lib/services/internal-store";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import type { ContentType } from "@/lib/types/internal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi internal tidak ditemukan." }, { status: 401 });
    }

    const payload = await request.json();

    const title = payload.title?.trim();
    const type = payload.type as ContentType;
    const organizationId = payload.organizationId;
    const description = payload.description?.trim() || "";
    const status = payload.status || "Draft";

    if (!title) return NextResponse.json({ success: false, error: "Judul wajib diisi." }, { status: 400 });
    if (!type) return NextResponse.json({ success: false, error: "Jenis konten wajib dipilih." }, { status: 400 });
    if (!organizationId) return NextResponse.json({ success: false, error: "OPD/Sumber wajib dipilih." }, { status: 400 });

    // Role specific bounds
    const isProdusen = session.role === "produsen";
    if (isProdusen) {
      if (organizationId !== session.organizationId) {
        return NextResponse.json({ success: false, error: "Anda tidak memiliki izin mengunggah untuk OPD lain." }, { status: 403 });
      }
      if (!["news", "digital_publication", "infographic"].includes(type)) {
        return NextResponse.json({ success: false, error: "Produsen hanya diizinkan mengunggah Berita, Publikasi Digital, atau Infografis." }, { status: 403 });
      }
      if (status === "Published") {
        return NextResponse.json({ success: false, error: "Produsen tidak memiliki izin untuk menerbitkan langsung." }, { status: 403 });
      }
    } else {
      // Walidata or other roles
      const canManageAll = hasPermission(session, "content.manage_all");
      if (!canManageAll) {
        if (type === "news" && !hasPermission(session, "news.manage")) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin mengelola berita." }, { status: 403 });
        }
        if (type === "regulation" && !hasPermission(session, "regulation.manage")) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin mengelola regulasi." }, { status: 403 });
        }
        if (type === "technical_guide" && !hasPermission(session, "technical_guide.manage")) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin mengelola petunjuk teknis." }, { status: 403 });
        }
      }
    }

    const newPub = await createInternalPublication(
      {
        title,
        type,
        organizationId,
        description,
        content: payload.content || "",
        fileUrl: payload.fileUrl || "",
        imageUrl: payload.imageUrl || "",
        status,
        visibility: "public",
        year: payload.year || "",
        regulationNumber: payload.regulationNumber || "",
      },
      session
    );

    return NextResponse.json({
      success: true,
      result: newPub,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan konten." },
      { status: 500 }
    );
  }
}
