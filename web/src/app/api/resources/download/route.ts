import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/utils/upstream-error";

export const dynamic = "force-dynamic";

function getCkanBaseCandidates(): URL[] {
  const rawCandidates = [
    process.env.CKAN_BASE_URL?.trim(),
    process.env.NEXT_PUBLIC_CKAN_BASE_URL?.trim(),
  ].filter(Boolean) as string[];

  const parsed: URL[] = [];
  for (const raw of rawCandidates) {
    try {
      parsed.push(new URL(raw));
    } catch {
      // Ignore malformed env values and continue with other candidates.
    }
  }

  return parsed;
}

function resolveTargetUrl(rawUrl: string): URL | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const bases = getCkanBaseCandidates();
  if (!bases.length) {
    return null;
  }

  const internalBase = bases[0]; // Selalu gunakan URL internal (CKAN_BASE_URL) untuk fetch

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const absolute = new URL(trimmed);
      const allowedHosts = new Set(bases.map((base) => base.host.toLowerCase()));
      const host = absolute.host.toLowerCase();

      // Jika host adalah CKAN (publik/internal) atau localhost/127.0.0.1 bawaan CKAN lokal
      if (allowedHosts.has(host) || host.includes("localhost") || host.includes("127.0.0.1")) {
        // Tulis ulang (rewrite) agar selalu fetch ke internalBase untuk menghindari masalah NAT/DNS
        return new URL(absolute.pathname + absolute.search, internalBase);
      }

      // Tolak URL eksternal selain CKAN
      return null;
    } catch {
      return null;
    }
  }

  const relativePath = trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\.?\/+/, "")}`;
  return new URL(relativePath, internalBase);
}

function sanitizeFilename(name: string | null): string {
  const fallback = "dataset-resource";
  const normalized = (name ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.replace(/[^a-zA-Z0-9._-]/g, "_") || fallback;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get("url");
  const fileName = sanitizeFilename(requestUrl.searchParams.get("name"));

  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: "Parameter 'url' wajib diisi." },
      { status: 400 },
    );
  }

  const targetUrl = resolveTargetUrl(rawUrl);
  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: "URL resource tidak valid atau tidak diizinkan." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetchWithTimeout(targetUrl.toString(), {
      method: "GET",
      headers: { Accept: "*/*" },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: "File tidak tersedia di sumber resource." },
        { status: upstream.status || 404 },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengunduh file dari sumber.",
      },
      { status: 502 },
    );
  }
}
