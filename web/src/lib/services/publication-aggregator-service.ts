import "server-only";

import type { PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getBappedaDigitalPublications } from "@/lib/services/bappeda-publication-service";
import { getBooks, getInfographics } from "@/lib/services/ckan-portal-api";
import { getInfografisApiPayload } from "@/lib/services/infografis-service";
import { normalizeOrganizationName } from "@/lib/utils/organization";
import {
  DEFAULT_PUBLICATION_IMAGE_SRC,
  normalizePublicationImageSrc,
} from "@/lib/utils/publication-query";

const DKIP_ORGANIZATION_NAME = normalizeOrganizationName(
  "Dinas Komunikasi, Informatika dan Persandian",
);
const BAPPEDA_ORGANIZATION_NAME = normalizeOrganizationName("Bappedalitbang Kabupaten Bulungan");

const IMAGE_RESOURCE_PATTERN = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i;

function normalizeTitleKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeByTitle(items: PublicationCatalogItem[]): PublicationCatalogItem[] {
  const seen = new Set<string>();
  const output: PublicationCatalogItem[] = [];

  for (const item of items) {
    const key = normalizeTitleKey(item.title);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }

  return output;
}

function isAbsoluteHttpUrl(urlValue: string): boolean {
  return /^https?:\/\//i.test(urlValue.trim());
}

function isImageResourceUrl(urlValue: string): boolean {
  return IMAGE_RESOURCE_PATTERN.test(urlValue.trim());
}

function pickInfographicImageFromCkanResources(
  resources: Array<{ url: string; format: string }>,
): string | undefined {
  for (const resource of resources) {
    const normalizedFormat = resource.format.trim().toUpperCase();
    if (
      normalizedFormat.includes("PNG") ||
      normalizedFormat.includes("JPG") ||
      normalizedFormat.includes("JPEG") ||
      normalizedFormat.includes("WEBP") ||
      normalizedFormat.includes("GIF") ||
      normalizedFormat.includes("SVG")
    ) {
      return resource.url;
    }
  }

  return resources.find((resource) => isImageResourceUrl(resource.url))?.url;
}

export async function getCombinedBukuDigitalPublications(): Promise<PublicationCatalogItem[]> {
  const [bappedaItems, ckanBooks] = await Promise.all([
    getBappedaDigitalPublications().catch(() => []),
    getBooks().catch(() => []),
  ]);

  const fromBappeda: PublicationCatalogItem[] = bappedaItems.map((item) => ({
    id: `bappeda-${item.id}`,
    title: item.title,
    summary:
      item.downloadCount !== null
        ? `${item.downloadCount.toLocaleString("id-ID")}x diunduh - Sumber Bappeda Bulungan`
        : "Sumber Bappeda Bulungan",
    organization: BAPPEDA_ORGANIZATION_NAME,
    lastUpdated: item.publishedDate,
    href: item.viewUrl,
    hrefLabel: "Lihat Dokumen",
    downloadHref: item.downloadUrl,
    downloadLabel: "Unduh Dokumen",
    openInNewTab: true,
    imageSrc: undefined,
  }));

  const fromCkan: PublicationCatalogItem[] = ckanBooks
    .filter((item) => item.status.trim().toLowerCase() === "published")
    .map((item) => ({
      id: `ckan-${item.id}`,
      title: item.title,
      summary:
        item.summary || item.description || "Konten publikasi tambahan dari upload operator internal (CKAN).",
      organization: normalizeOrganizationName(item.organizationName),
      lastUpdated: item.metadataModified.slice(0, 10),
      href: item.resources[0]?.url || `/dataset/${item.slug}`,
      hrefLabel: "Lihat Dokumen",
      downloadHref:
        item.resources.find((resource) => resource.format.toUpperCase().includes("PDF"))?.url ||
        item.resources[0]?.url,
      downloadLabel: "Unduh Dokumen",
      openInNewTab: Boolean(item.resources[0]?.url),
      imageSrc: undefined,
    }));

  return dedupeByTitle([...fromBappeda, ...fromCkan]);
}

export async function getCombinedInfografisPublications(): Promise<PublicationCatalogItem[]> {
  const [liveInfografis, ckanInfografis] = await Promise.all([
    getInfografisApiPayload({
      page: 1,
      limit: 500,
      source: "live",
    }).catch(() => ({
      success: true as const,
      data: [],
      meta: {
        page: 1,
        limit: 500,
        total: 0,
        hasNextPage: false,
        sourceUsed: "html_scrape" as const,
        externalSource: "https://diskominfo.bulungan.go.id/wp/infografis/",
      },
    })),
    getInfographics().catch(() => []),
  ]);

  const fromDkipLive: PublicationCatalogItem[] = liveInfografis.data.map((item) => ({
    id: `dkip-live-${item.id}`,
    title: item.title,
    summary: "Sumber DKIP Bulungan (live).",
    organization: DKIP_ORGANIZATION_NAME,
    lastUpdated: item.publishedDate?.slice(0, 10) ?? "1970-01-01",
    href: item.postUrl,
    hrefLabel: "Buka Sumber",
    openInNewTab: true,
    imageSrc: normalizePublicationImageSrc(
      item.imageOriginalUrl ?? item.imageUrl,
      DEFAULT_PUBLICATION_IMAGE_SRC,
    ),
  }));

  const fromCkan: PublicationCatalogItem[] = ckanInfografis
    .filter((item) => item.status.trim().toLowerCase() === "published")
    .map((item) => {
      const resources = item.resources.map((resource) => ({
        url: resource.url,
        format: resource.format,
      }));
      const imageCandidate = pickInfographicImageFromCkanResources(resources);
      const firstResourceUrl = resources[0]?.url;
      const href = firstResourceUrl || `/dataset/${item.slug}`;

      return {
        id: `ckan-infografis-${item.id}`,
        title: item.title,
        summary: "Konten infografis tambahan dari upload operator internal (CKAN).",
        organization: normalizeOrganizationName(item.organizationName),
        lastUpdated: item.metadataModified.slice(0, 10),
        href,
        hrefLabel: "Buka Sumber",
        openInNewTab: isAbsoluteHttpUrl(href),
        imageSrc: normalizePublicationImageSrc(
          imageCandidate,
          DEFAULT_PUBLICATION_IMAGE_SRC,
        ),
      } satisfies PublicationCatalogItem;
    });

  return dedupeByTitle([...fromDkipLive, ...fromCkan]);
}
