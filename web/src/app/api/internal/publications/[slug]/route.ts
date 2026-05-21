import { NextResponse } from "next/server";
import {
  updateCkanPublication,
  getCkanPublicationBySlug,
  type PortalContentType,
} from "@/lib/services/ckan-portal-api";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import type { DatasetStatus } from "@/lib/types/dataset";
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
      if (type && !["news", "digital_publication", "infographic"].includes(type)) {
        return NextResponse.json({ success: false, error: "Produsen hanya diizinkan mengunggah Berita, Publikasi Digital, atau Infografis." }, { status: 403 });
      }
      if (status === "Published") {
        return NextResponse.json({ success: false, error: "Produsen tidak memiliki izin untuk menerbitkan langsung." }, { status: 403 });
      }
    }

    const resolvedOwnerOrgId = organizationId
      ? await resolveCkanOwnerOrgId(organizationId)
      : undefined;
    const ckanType = type ? mapInternalTypeToCkan(type) : undefined;
    const result = await updateCkanPublication(
      slug,
      {
        title,
        description,
        content: payload.content,
        fileUrl: payload.fileUrl,
        imageUrl: payload.imageUrl,
        status,
        year: payload.year,
        publishedAt: payload.publishedAt || undefined,
        ownerOrgId: resolvedOwnerOrgId,
      },
      ckanType
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

/**
 * PATCH — Status transition for publications
 * Body: { action: "submit" | "approve" | "revise" | "publish" | "unpublish" }
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi internal tidak ditemukan." }, { status: 401 });
    }

    const { slug } = await context.params;
    const { action } = await request.json();

    const pub = await getCkanPublicationBySlug(slug);
    if (!pub) {
      return NextResponse.json({ success: false, error: "Konten tidak ditemukan." }, { status: 404 });
    }

    const isProdusen = session.role === "produsen";
    const canManageAll = hasPermission(session, "content.manage_all");

    // DatasetStatus values: Draft, Submitted, Under Review, Need Revision, Approved, Published, Archived
    let newStatus: DatasetStatus;
    switch (action) {
      case "submit":
        if (pub.status !== "Draft" && pub.status !== "Need Revision") {
          return NextResponse.json({ success: false, error: `Tidak bisa mengajukan konten dengan status "${pub.status}".` }, { status: 400 });
        }
        if (isProdusen && pub.organizationId !== session.organizationId) {
          return NextResponse.json({ success: false, error: "Anda hanya bisa mengajukan konten milik OPD Anda." }, { status: 403 });
        }
        newStatus = "Submitted";
        break;

      case "approve":
        if (!canManageAll) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin untuk menyetujui konten." }, { status: 403 });
        }
        if (pub.status !== "Submitted") {
          return NextResponse.json({ success: false, error: `Tidak bisa menyetujui konten dengan status "${pub.status}".` }, { status: 400 });
        }
        newStatus = "Approved";
        break;

      case "revise":
        if (!canManageAll) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin untuk meminta revisi." }, { status: 403 });
        }
        if (pub.status !== "Submitted") {
          return NextResponse.json({ success: false, error: `Tidak bisa meminta revisi konten dengan status "${pub.status}".` }, { status: 400 });
        }
        newStatus = "Need Revision";
        break;

      case "publish":
        if (!canManageAll) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin untuk menerbitkan konten." }, { status: 403 });
        }
        if (!["Submitted", "Approved"].includes(pub.status)) {
          return NextResponse.json({ success: false, error: `Tidak bisa menerbitkan konten dengan status "${pub.status}".` }, { status: 400 });
        }
        newStatus = "Published";
        break;

      case "unpublish":
        if (!canManageAll) {
          return NextResponse.json({ success: false, error: "Anda tidak memiliki izin untuk membatalkan penerbitan." }, { status: 403 });
        }
        newStatus = "Draft";
        break;

      default:
        return NextResponse.json({ success: false, error: `Aksi "${action}" tidak dikenal.` }, { status: 400 });
    }

    const result = await updateCkanPublication(slug, { status: newStatus });

    return NextResponse.json({
      success: true,
      result,
      message: `Status konten berhasil diubah menjadi "${newStatus}".`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal mengubah status konten." },
      { status: 500 }
    );
  }
}
