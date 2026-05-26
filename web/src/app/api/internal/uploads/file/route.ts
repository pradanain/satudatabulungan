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

    if (contentType) {
      console.log(`[UPLOAD_PROCESS: 6a] Kategori konten: "${contentType}"`);
      if (["digital_publication", "regulation", "technical_guide"].includes(contentType)) {
        if (ext !== "pdf") {
          console.error(`[UPLOAD_PROCESS: ERROR] Ekstensi ".${ext}" tidak valid untuk Buku Digital. Wajib PDF.`);
          return NextResponse.json(
            { success: false, error: "Format file tidak didukung. Gunakan PDF." },
            { status: 400 }
          );
        }
        const maxSize = contentType === "digital_publication" ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
        const maxSizeLabel = contentType === "digital_publication" ? "50 MB" : "25 MB";
        if (sizeInBytes > maxSize) {
          console.error(`[UPLOAD_PROCESS: ERROR] Berkas berukuran ${sizeInBytes} Bytes melebihi batas ${maxSizeLabel}.`);
          return NextResponse.json(
            { success: false, error: `Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.` },
            { status: 400 }
          );
        }
      } else if (["news", "infographic"].includes(contentType)) {
        if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
          console.error(`[UPLOAD_PROCESS: ERROR] Format gambar ".${ext}" tidak didukung.`);
          return NextResponse.json(
            { success: false, error: "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
            { status: 400 }
          );
        }
        const maxSize = contentType === "infographic" ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
        const maxSizeLabel = contentType === "infographic" ? "15 MB" : "10 MB";
        if (sizeInBytes > maxSize) {
          console.error(`[UPLOAD_PROCESS: ERROR] Gambar berukuran ${sizeInBytes} Bytes melebihi batas ${maxSizeLabel}.`);
          return NextResponse.json(
            { success: false, error: `Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.` },
            { status: 400 }
          );
        }
      }
    }
    console.log("[UPLOAD_PROCESS: 6b] Validasi lolos dengan sukses.");

    // Sanitize fileName to prevent directory traversal
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

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
        ckanForm.set("upload", new Blob([fileBuffer as any], { type: mimeType }), safeFileName);

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
