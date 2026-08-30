import type { DatasetResource } from "@/lib/types/dataset";

function normalizeUrl(url: string | null | undefined): string {
  return (url ?? "").trim();
}

export function hasUsableResourceUrl(url: string | null | undefined): boolean {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return false;
  }

  return normalized !== "#";
}

function isApiLikeResource(resource: DatasetResource): boolean {
  const url = normalizeUrl(resource.url).toLowerCase();
  return (
    resource.format === "API" ||
    url.includes("/api/") ||
    url.includes("package_show") ||
    url.includes("package_search")
  );
}

export function selectDownloadResource(resources: DatasetResource[]): DatasetResource | undefined {
  const usable = resources.filter((resource) => hasUsableResourceUrl(resource.url));

  if (!usable.length) {
    return undefined;
  }

  return usable.find((resource) => !isApiLikeResource(resource)) ?? usable[0];
}

export function selectApiResource(resources: DatasetResource[]): DatasetResource | undefined {
  return resources
    .filter((resource) => hasUsableResourceUrl(resource.url))
    .find((resource) => isApiLikeResource(resource));
}
