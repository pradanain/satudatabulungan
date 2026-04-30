import type { PublicationSort } from "@/lib/utils/query";

export const PUBLICATION_PAGE_SIZE = 12;

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
