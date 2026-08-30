import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, parse } from "node:path";
import type { ContentType, InternalSession } from "@/lib/types/internal";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import {
  canUploadContentFile,
  canUploadDatasetFile,
  isInternalContentType,
} from "@/lib/utils/internal-content-permissions";

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

type UploadCategory = "dataset" | ContentType;

const uploadRules: Record<UploadCategory, { extensions: string[]; maxSize: number; maxSizeLabel: string }> = {
  dataset: {
    extensions: ["csv", "xlsx", "json", "pdf"],
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: "50 MB",
  },
  news: {
    extensions: ["jpg", "jpeg", "png", "webp", "gif"],
    maxSize: 10 * 1024 * 1024,
    maxSizeLabel: "10 MB",
  },
  infographic: {
    extensions: ["jpg", "jpeg", "png", "webp", "gif"],
    maxSize: 15 * 1024 * 1024,
    maxSizeLabel: "15 MB",
  },
  digital_publication: {
    extensions: ["pdf"],
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: "50 MB",
  },
  regulation: {
    extensions: ["pdf"],
    maxSize: 25 * 1024 * 1024,
    maxSizeLabel: "25 MB",
  },
  technical_guide: {
    extensions: ["pdf"],
    maxSize: 25 * 1024 * 1024,
    maxSizeLabel: "25 MB",
  },
};

function normalizeUploadCategory(value: string | undefined): UploadCategory | null {
  if (!value) {
    return "dataset";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "dataset") {
    return "dataset";
  }

  return isInternalContentType(normalized) ? normalized : null;
}

function canUploadFile(session: InternalSession, category: UploadCategory): boolean {
  if (category === "dataset") {
    return canUploadDatasetFile(session);
  }

  return canUploadContentFile(session, category);
}

function sanitizeUploadFileName(fileName: string, ext: string): string {
  const parsed = parse(basename(fileName));
  const base =
    parsed.name
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "upload";

  return `${base}-${randomUUID().slice(0, 8)}.${ext}`;
}

function isLikelyAllowedFile(buffer: Buffer, ext: string): boolean {
  if (ext === "pdf") {
    return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
  }

  if (ext === "png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  if (ext === "jpg" || ext === "jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (ext === "gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (ext === "webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  if (ext === "xlsx") {
    return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  }

  if (ext === "json") {
    try {
      JSON.parse(buffer.toString("utf8"));
      return true;
    } catch {
      return false;
    }
  }

  return ext === "csv";
}

export async function POST(request: Request) {
  console.log("\n>>> [UPLOAD_PROCESS: START] Menerima request unggah berkas baru...");
  try {
    console.log("[UPLOAD_PROCESS: 1] Memeriksa sesi pengguna...");
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      console.error("[UPLOAD_PROCESS: ERROR] Sesi internal tidak ditemukan atau tidak valid.");
      return NextResponse.json(
        { success: false, error: "Sesi internal tidak ditemukan." },
        { status: 401 }
      );
    }
    console.log(`[UPLOAD_PROCESS: 2] Sesi valid. Pengguna: ${session.username} (Role: ${session.role})`);

    const contentTypeHeader = request.headers.get("content-type") || "";
    console.log(`[UPLOAD_PROCESS: 3] Content-Type request: "${contentTypeHeader}"`);
    
    let fileName: string;
    let fileBuffer: Buffer;
    let contentType: string | undefined;

    if (contentTypeHeader.includes("multipart/form-data")) {
      console.log("[UPLOAD_PROCESS: 4a] Parsing request sebagai multipart/form-data...");
      const form = await request.formData();
      const file = form.get("file") as File | null;
      contentType = (form.get("contentType") as string | null) ?? undefined;
      
      if (!file || typeof file === "string") {
        console.error("[UPLOAD_PROCESS: ERROR] File kosong atau bertipe string dalam form-data.");
        return NextResponse.json(
          { success: false, error: "File wajib disertakan dalam form-data." },
          { status: 400 }
        );
      }
      
      fileName = file.name;
      console.log(`[UPLOAD_PROCESS: 4b] Berkas ditemukan. Nama: "${fileName}", Ukuran: ${file.size} Bytes`);
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      console.log("[UPLOAD_PROCESS: 5a] Parsing request sebagai JSON base64 (fallback)...");
      const body = await request.json();
      fileName = body.fileName;
      contentType = body.contentType;
      
      if (!fileName || !body.fileContent) {
        console.error("[UPLOAD_PROCESS: ERROR] Payload JSON tidak lengkap. fileName atau fileContent kosong.");
        return NextResponse.json(
          { success: false, error: "fileName dan fileContent wajib diisi." },
          { status: 400 }
        );
      }
      
      const cleanBase64 = body.fileContent.includes(",") 
        ? body.fileContent.split(",")[1] 
        : body.fileContent;
      fileBuffer = Buffer.from(cleanBase64, "base64");
      console.log(`[UPLOAD_PROCESS: 5b] Berkas base64 didekode. Nama: "${fileName}", Ukuran Buffer: ${fileBuffer.length} Bytes`);
    }

    // ── Validate file type and size ────────────────────────────────────────
    console.log("[UPLOAD_PROCESS: 6] Validasi tipe berkas dan batas ukuran...");
    const ext = fileName.split(".").pop()?.toLowerCase();
    const sizeInBytes = fileBuffer.length;

    const uploadCategory = normalizeUploadCategory(contentType);
    if (!uploadCategory) {
      return NextResponse.json(
        { success: false, error: "Kategori unggahan tidak valid." },
        { status: 400 },
      );
    }

    if (!canUploadFile(session, uploadCategory)) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki izin mengunggah berkas untuk konten ini." },
        { status: 403 },
      );
    }

    const rules = uploadRules[uploadCategory];
    console.log(`[UPLOAD_PROCESS: 6a] Kategori konten: "${uploadCategory}"`);

    if (!ext || !rules.extensions.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Format file tidak didukung. Gunakan ${rules.extensions
            .map((item) => item.toUpperCase())
            .join(", ")}.`,
        },
        { status: 400 },
      );
    }

    if (sizeInBytes > rules.maxSize) {
      return NextResponse.json(
        { success: false, error: `Ukuran file terlalu besar. Maksimum ${rules.maxSizeLabel}.` },
        { status: 400 },
      );
    }

    if (!isLikelyAllowedFile(fileBuffer, ext)) {
      return NextResponse.json(
        { success: false, error: "Isi file tidak sesuai dengan format yang diunggah." },
        { status: 400 },
      );
    }
    console.log("[UPLOAD_PROCESS: 6b] Validasi lolos dengan sukses.");

    const safeFileName = sanitizeUploadFileName(fileName, ext);

    // ── Strategy 1: Try uploading directly to CKAN resource store ────────────
    console.log("[UPLOAD_PROCESS: 7] Menyiapkan unggahan ke CKAN Resource Store...");
    const apiKey = getCkanApiKey();
    const ckanUrl = getCkanBaseUrl();
    
    if (apiKey) {
      console.log(`[UPLOAD_PROCESS: 7a] CKAN URL terkonfigurasi: "${ckanUrl}"`);
      try {
        const mimeType = ext === "pdf" ? "application/pdf"
          : ext === "png" ? "image/png"
          : ext === "webp" ? "image/webp"
          : ext === "gif" ? "image/gif"
          : "image/jpeg";

        const ckanForm = new FormData();
        ckanForm.set("upload", new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), safeFileName);

        const controller = new AbortController();
        const timeout = setTimeout(() => {
          console.warn("[UPLOAD_PROCESS: WARNING] Koneksi ke CKAN dibatalkan karena batas waktu 30 detik (Timeout).");
          controller.abort();
        }, 30_000);
        
        try {
          console.log("[UPLOAD_PROCESS: 7b] Mengirimkan POST ke CKAN resource_create...");
          const ckanRes = await fetch(
            `${ckanUrl}/api/3/action/resource_create`,
            {
              method: "POST",
              headers: { Authorization: apiKey, Accept: "application/json" },
              body: ckanForm,
              signal: controller.signal,
            }
          );

          console.log(`[UPLOAD_PROCESS: 7c] CKAN merespons dengan status: ${ckanRes.status}`);

          if (ckanRes.ok) {
            const ckanData = await ckanRes.json() as { success: boolean; result?: { url?: string } };
            console.log(`[UPLOAD_PROCESS: 7d] Data respons CKAN parsed. success: ${ckanData.success}`);
            if (ckanData.success && ckanData.result?.url) {
              console.log(`[UPLOAD_PROCESS: SUCCESS] Berkas berhasil disimpan di CKAN. URL: "${ckanData.result.url}"`);
              return NextResponse.json({
                success: true,
                url: ckanData.result.url,
                storage: "ckan",
              });
            } else {
              console.warn("[UPLOAD_PROCESS: WARNING] Respons CKAN sukses=false atau URL kosong.");
            }
          } else {
            const textResponse = await ckanRes.text().catch(() => "");
            console.error(`[UPLOAD_PROCESS: ERROR] HTTP error dari CKAN. Respons teks: "${textResponse.slice(0, 300)}"`);
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (ckanErr) {
        // CKAN resource_create not available — fall back to local storage
        const errStr = ckanErr instanceof Error ? ckanErr.message : String(ckanErr);
        console.error(`[UPLOAD_PROCESS: EXCEPTION] Gagal mengunggah ke CKAN. Kesalahan: ${errStr}. Melakukan fallback ke lokal...`);
      }
    } else {
      console.log("[UPLOAD_PROCESS: 7e] CKAN_API_KEY tidak dikonfigurasi. Mengabaikan unggahan CKAN.");
    }

    // ── Strategy 2: Fallback — save to local /public/uploads ─────────────────
    console.log("[UPLOAD_PROCESS: 8] Melakukan penyimpanan ke Local Storage...");
    const uploadsDir = join(process.cwd(), "public", "uploads");
    console.log(`[UPLOAD_PROCESS: 8a] Direktori penyimpanan: "${uploadsDir}"`);
    
    await mkdir(uploadsDir, { recursive: true });
    console.log("[UPLOAD_PROCESS: 8b] Menulis berkas ke disk...");
    await writeFile(join(uploadsDir, safeFileName), fileBuffer);
    console.log(`[UPLOAD_PROCESS: SUCCESS] Berkas disimpan di Local Storage. URL: "/uploads/${safeFileName}"`);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFileName}`,
      storage: "local",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan berkas.";
    console.error("[UPLOAD_PROCESS: CRITICAL ERROR] Terjadi kesalahan fatal:", error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
