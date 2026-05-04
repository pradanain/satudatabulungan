import type { PublicationSort } from "@/lib/utils/query";

export const PUBLICATION_PAGE_SIZE = 12;
export const DEFAULT_PUBLICATION_IMAGE_SRC = "/assets/brand/illustrations/bulungan-perempuan.png";

const BROKEN_BAPPEDA_THUMBNAIL_PATHS = new Set(["/assets/images/publikasi-thumbnail-default.png"]);

const BROKEN_DISKOMINFO_INFOGRAFIS_URLS = new Set([
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/01/infografis-1.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/02/infografis-2.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/03/infografis-3.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/04/infografis-4.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/05/infografis-5.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/06/infografis-6.jpg",
  "https://diskominfo.bulungan.go.id/wp-content/uploads/2025/07/infografis-7.jpg",
]);

export function pickQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

export function normalizePublicationSort(rawSort: string | undefined): PublicationSort {
  const normalized = rawSort?.toLowerCase();
  if (normalized === "terlama") return "terlama";
  if (normalized === "az") return "az";
  return "terbaru";
}

export function normalizePositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
  allowed?: number[],
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  const normalized = Math.floor(parsed);
  if (!allowed || allowed.includes(normalized)) {
    return normalized;
  }

  return fallback;
}

export function normalizePublicationImageSrc(rawImageSrc: string | null | undefined, fallbackImageSrc?: string): string | undefined {
  const trimmed = rawImageSrc?.trim();
  if (!trimmed) {
    return fallbackImageSrc;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return fallbackImageSrc;
    }

    if (
      parsed.hostname.toLowerCase() === "bappeda.bulungan.go.id" &&
      BROKEN_BAPPEDA_THUMBNAIL_PATHS.has(parsed.pathname.toLowerCase())
    ) {
      return fallbackImageSrc;
    }

    if (BROKEN_DISKOMINFO_INFOGRAFIS_URLS.has(parsed.toString().toLowerCase())) {
      return fallbackImageSrc;
    }

    return parsed.toString();
  } catch {
    return fallbackImageSrc;
  }
}
