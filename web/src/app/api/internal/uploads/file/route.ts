import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

// Max body size for multipart form upload (Next.js App Router)
export const maxDuration = 60; // seconds

function getCkanBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CKAN_BASE_URL?.trim() ||
    process.env.CKAN_BASE_URL?.trim() ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
}

function getCkanApiKey(): string {
  return process.env.CKAN_API_KEY?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi internal tidak ditemukan." },
        { status: 401 }
      );
    }

    const contentTypeHeader = request.headers.get("content-type") || "";
    
    let fileName: string;
    let fileBuffer: Buffer;
    let contentType: string | undefined;

    if (contentTypeHeader.includes("multipart/form-data")) {
      // ── Multipart/form-data upload (preferred, supports large files) ─────
      const form = await request.formData();
      const file = form.get("file") as File | null;
      contentType = (form.get("contentType") as string | null) ?? undefined;
      
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { success: false, error: "File wajib disertakan dalam form-data." },
          { status: 400 }
        );
      }
      
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // ── JSON base64 upload (legacy fallback) ────────────────────────────
      const body = await request.json();
      fileName = body.fileName;
      contentType = body.contentType;
      
      if (!fileName || !body.fileContent) {
        return NextResponse.json(
          { success: false, error: "fileName dan fileContent wajib diisi." },
          { status: 400 }
        );
      }
      
      const cleanBase64 = body.fileContent.includes(",") 
        ? body.fileContent.split(",")[1] 
        : body.fileContent;
      fileBuffer = Buffer.from(cleanBase64, "base64");
    }

    // ── Validate file type and size ────────────────────────────────────────
    const ext = fileName.split(".").pop()?.toLowerCase();
    const sizeInBytes = fileBuffer.length;

    if (contentType) {
      if (["digital_publication", "regulation", "technical_guide"].includes(contentType)) {
        if (ext !== "pdf") {
          return NextResponse.json(
            { success: false, error: "Format file tidak didukung. Gunakan PDF." },
            { status: 400 }
          );
        }
        const maxSize = contentType === "digital_publication" ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
        const maxSizeLabel = contentType === "digital_publication" ? "50 MB" : "25 MB";
        if (sizeInBytes > maxSize) {
          return NextResponse.json(
            { success: false, error: `Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.` },
            { status: 400 }
          );
        }
      } else if (["news", "infographic"].includes(contentType)) {
        if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
          return NextResponse.json(
            { success: false, error: "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
            { status: 400 }
          );
        }
        const maxSize = contentType === "infographic" ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
        const maxSizeLabel = contentType === "infographic" ? "15 MB" : "10 MB";
        if (sizeInBytes > maxSize) {
          return NextResponse.json(
            { success: false, error: `Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.` },
            { status: 400 }
          );
        }
      }
    }

    // Sanitize fileName to prevent directory traversal
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    // ── Strategy 1: Try uploading directly to CKAN resource store ────────────
    const apiKey = getCkanApiKey();
    if (apiKey) {
      try {
        const mimeType = ext === "pdf" ? "application/pdf"
          : ext === "png" ? "image/png"
          : ext === "webp" ? "image/webp"
          : ext === "gif" ? "image/gif"
          : "image/jpeg";

        const ckanForm = new FormData();
        ckanForm.set("upload", new Blob([fileBuffer as any], { type: mimeType }), safeFileName);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        
        try {
          const ckanRes = await fetch(
            `${getCkanBaseUrl()}/api/3/action/resource_create`,
            {
              method: "POST",
              headers: { Authorization: apiKey, Accept: "application/json" },
              body: ckanForm,
              signal: controller.signal,
            }
          );

          if (ckanRes.ok) {
            const ckanData = await ckanRes.json() as { success: boolean; result?: { url?: string } };
            if (ckanData.success && ckanData.result?.url) {
              return NextResponse.json({
                success: true,
                url: ckanData.result.url,
                storage: "ckan",
              });
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        // CKAN resource_create not available — fall back to local storage
        console.warn("[uploads/file] CKAN resource upload failed, falling back to local storage");
      }
    }

    // ── Strategy 2: Fallback — save to local /public/uploads ─────────────────
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, safeFileName), fileBuffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFileName}`,
      storage: "local",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan berkas.";
    console.error("[uploads/file] error:", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
