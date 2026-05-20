import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi internal tidak ditemukan." },
        { status: 401 }
      );
    }

    const { fileName, fileContent, contentType } = await request.json();

    if (!fileName || !fileContent) {
      return NextResponse.json(
        { success: false, error: "fileName dan fileContent wajib diisi." },
        { status: 400 }
      );
    }

    // Determine type and run specific validations
    const ext = fileName.split(".").pop()?.toLowerCase();
    const sizeInBytes = (fileContent.replace(/=/g, "").length * 0.75);

    if (contentType) {
      if (["digital_publication", "regulation", "technical_guide"].includes(contentType)) {
        // PDF validation
        if (ext !== "pdf") {
          return NextResponse.json(
            { success: false, error: "Format file tidak didukung. Gunakan PDF." },
            { status: 400 }
          );
        }
        
        let maxSize = 25 * 1024 * 1024; // 25MB default
        let maxSizeLabel = "25 MB";
        if (contentType === "digital_publication") {
          maxSize = 50 * 1024 * 1024;
          maxSizeLabel = "50 MB";
        }

        if (sizeInBytes > maxSize) {
          return NextResponse.json(
            { success: false, error: `Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.` },
            { status: 400 }
          );
        }
      } else if (["news", "infographic"].includes(contentType)) {
        // Image validation
        if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
          return NextResponse.json(
            { success: false, error: "Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP." },
            { status: 400 }
          );
        }

        let maxSize = 10 * 1024 * 1024; // 10MB news default
        let maxSizeLabel = "10 MB";
        if (contentType === "infographic") {
          maxSize = 15 * 1024 * 1024;
          maxSizeLabel = "15 MB";
        }

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
    
    // Set up upload directory
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Decode base64 and write file
    const cleanBase64 = fileContent.includes(",") ? fileContent.split(",")[1] : fileContent;
    const buffer = Buffer.from(cleanBase64, "base64");
    await writeFile(join(uploadsDir, safeFileName), buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFileName}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan berkas." },
      { status: 500 }
    );
  }
}
