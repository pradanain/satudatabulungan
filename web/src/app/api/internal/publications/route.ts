import { NextResponse } from "next/server";
import { createCkanPublication, type PortalContentType } from "@/lib/services/ckan-portal-api";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import type { ContentType } from "@/lib/types/internal";
import { resolveCkanOwnerOrgId } from "@/lib/utils/resolve-ckan-owner-org";

export const dynamic = "force-dynamic";

function mapInternalTypeToCkan(type: string): PortalContentType {
  if (type === "news") return "news";
  if (type === "digital_publication" || type === "regulation" || type === "technical_guide") {
    return "publikasi";
  }
  if (type === "infographic") return "infografis";
  return "dataset";
}

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

    const resolvedOwnerOrgId = await resolveCkanOwnerOrgId(organizationId);
    const ckanType = mapInternalTypeToCkan(type);
    const newPub = await createCkanPublication(
      {
        title,
        description,
        content: payload.content || "",
        ownerOrgId: resolvedOwnerOrgId,
        status,
        publishedAt: payload.publishedAt || undefined,
        imageUrl: payload.imageUrl || "",
        fileUrl: payload.fileUrl || "",
        year: payload.year || "",
      },
      ckanType
    );

    return NextResponse.json({
      success: true,
      result: newPub,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan konten ke CKAN." },
      { status: 500 }
    );
  }
}
