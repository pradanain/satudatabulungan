import { NextResponse } from "next/server";
import { getOrganizationById, uploadBook, uploadDataset, uploadInfographic } from "@/lib/services/ckan-portal-api";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";

type UploadType = "dataset" | "infografis" | "publikasi";

type UploadPayload = {
  title?: string;
  notes?: string;
  ownerOrgId?: string;
  topic?: string;
  tags?: string[];
  year?: string;
  period?: string;
  frequency?: string;
  status?: string;
  resourceName?: string;
  resourceFormat?: string;
  resourceDescription?: string;
  resourceContent?: string;
  resourceFileName?: string;
};

function ensure(value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Field '${key}' wajib diisi.`);
  }

  const cleaned = sanitizeStoredText(value);
  if (!cleaned) {
    throw new Error(`Field '${key}' tidak valid.`);
  }

  return cleaned;
}

function checkUploadPermission(uploadType: UploadType, role: string): boolean {
  if (hasPermission(role as any, "dataset.upload_file")) return true;
  return false;
}

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ contentType: string }> },
) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi internal tidak ditemukan." }, { status: 401 });
    }

    const { contentType } = await context.params;
    const normalizedType = contentType.trim().toLowerCase() as UploadType;
    if (!["dataset", "infografis", "publikasi"].includes(normalizedType)) {
      return NextResponse.json(
        { success: false, error: "Tipe upload tidak valid. Gunakan dataset, infografis, atau publikasi." },
        { status: 400 },
      );
    }

    if (!checkUploadPermission(normalizedType, session.role)) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki izin upload untuk konten ini." },
        { status: 403 },
      );
    }

    const payload = (await request.json()) as UploadPayload;

    const ownerOrgId = ensure(payload.ownerOrgId, "ownerOrgId");
    if (!hasPermission(session, "dataset.view_all") && session.organizationId !== ownerOrgId) {
      return NextResponse.json(
        { success: false, error: "Anda hanya boleh upload untuk organisasi sendiri." },
        { status: 403 },
      );
    }

    const organization = await getOrganizationById(ownerOrgId);
    if (!organization) {
      return NextResponse.json({ success: false, error: "Organisasi pemilik tidak ditemukan." }, { status: 400 });
    }

    const extras = {
      content_type: normalizedType,
      topik: sanitizeStoredText(payload.topic?.trim() || "") || "Umum",
      tahun_data: sanitizeStoredText(payload.year?.trim() || "") || new Date().getFullYear().toString(),
      periode:
        sanitizeStoredText(payload.period?.trim() || "") ||
        sanitizeStoredText(payload.year?.trim() || "") ||
        new Date().getFullYear().toString(),
      frekuensi_pembaruan: sanitizeStoredText(payload.frequency?.trim() || "") || "Tahunan",
      status: sanitizeStoredText(payload.status?.trim() || "") || "Published",
      uploaded_by: session.username,
      uploaded_by_role: session.role,
    };

    const uploadInput = {
      title: ensure(payload.title, "title"),
      notes: ensure(payload.notes, "notes"),
      ownerOrgId,
      tags:
        Array.isArray(payload.tags) && payload.tags.length > 0
          ? payload.tags.map((tag) => sanitizeStoredText(tag)).filter(Boolean)
          : [normalizedType, "bulungan"],
      extras,
      resourceName: ensure(payload.resourceName, "resourceName"),
      resourceFormat: ensure(payload.resourceFormat, "resourceFormat"),
      resourceDescription:
        sanitizeStoredText(payload.resourceDescription?.trim() || "") ||
        "Resource upload dari portal internal.",
      resourceContent: ensure(payload.resourceContent, "resourceContent"),
      resourceFileName: ensure(payload.resourceFileName, "resourceFileName"),
    };

    const result =
      normalizedType === "dataset"
        ? await uploadDataset(uploadInput)
        : normalizedType === "infografis"
          ? await uploadInfographic(uploadInput)
          : await uploadBook(uploadInput);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal upload konten.";
    const status = inferInternalApiErrorStatus(message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
