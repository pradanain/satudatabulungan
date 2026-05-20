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
import { parseIndonesianDateText } from "@/lib/utils/formatters";

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

function formatInfografisTitle(title: string): string {
  if (!title) return "";
  
  let formatted = title.toLowerCase();
  
  // Expand "kab." or "kab " to "kabupaten "
  formatted = formatted.replace(/\bkab\.?\s/gi, "kabupaten ");
  
  // Title case each word
  formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  
  // Lowercase specific conjunctions/prepositions and "tahun"
  const lowerCaseWords = ["Di", "Ke", "Dari", "Dan", "Atau", "Yang", "Untuk", "Dengan", "Dalam", "Pada", "Tahun"];
  formatted = formatted.replace(/\b([A-Z][a-z]+)\b/g, (match) => {
    if (lowerCaseWords.includes(match)) {
      return match.toLowerCase();
    }
    return match;
  });
  
  // Uppercase Roman numerals commonly found
  formatted = formatted.replace(/\b(I|Ii|Iii|Iv|V|Vi|Vii|Viii|Ix|X|Xi|Xii)\b/g, (match) => match.toUpperCase());
  
  // Ensure very first letter is always capitalized
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted.trim();
}

import { loadInternalPortalStore } from "@/lib/services/internal-store";

export async function getCombinedBukuDigitalPublications(): Promise<PublicationCatalogItem[]> {
  const bappedaItems = await getBappedaDigitalPublications().catch(() => []);

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
    downloadHref: item.viewUrl,
    downloadLabel: "Unduh Dokumen",
    openInNewTab: true,
    imageSrc: undefined,
  }));

  let fromInternal: PublicationCatalogItem[] = [];
  try {
    const store = await loadInternalPortalStore();
    fromInternal = (store.publications || [])
      .filter((pub) => pub.type === "digital_publication" && pub.status === "Published")
      .map((pub) => ({
        id: `internal-${pub.id}`,
        title: pub.title,
        summary: pub.description || "Publikasi Digital Satu Data Bulungan",
        organization: pub.organizationName,
        lastUpdated: pub.publishedAt || pub.updatedAt || "1970-01-01",
        href: pub.fileUrl || "#",
        hrefLabel: "Lihat Dokumen",
        downloadHref: pub.fileUrl || "#",
        downloadLabel: "Unduh Dokumen",
        openInNewTab: true,
        imageSrc: pub.imageUrl || undefined,
      }));
  } catch {
    // Ignore
  }

  return dedupeByTitle([...fromBappeda, ...fromInternal]);
}


export async function getCombinedInfografisPublications(): Promise<PublicationCatalogItem[]> {
  const liveInfografis = await getInfografisApiPayload({
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
  }));

  const fromDkipLive: PublicationCatalogItem[] = liveInfografis.data
    .filter((item) => !String(item.id).startsWith("mock-"))
    .map((item) => ({
    id: `dkip-live-${item.id}`,
    title: formatInfografisTitle(item.title),
    summary: "",
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

  let fromInternal: PublicationCatalogItem[] = [];
  try {
    const store = await loadInternalPortalStore();
    fromInternal = (store.publications || [])
      .filter((pub) => pub.type === "infographic" && pub.status === "Published")
      .map((pub) => {
        const rawSummary = pub.description || "Infografis Satu Data Bulungan.";
        const formattedTitle = formatInfografisTitle(pub.title);

        return {
          id: `internal-infografis-${pub.id}`,
          title: formattedTitle,
          summary: rawSummary,
          organization: pub.organizationName,
          lastUpdated: pub.publishedAt || pub.updatedAt || "1970-01-01",
          href: pub.fileUrl || pub.imageUrl || "#",
          hrefLabel: "Buka Sumber",
          openInNewTab: true,
          imageSrc: normalizePublicationImageSrc(
            pub.imageUrl || "",
            DEFAULT_PUBLICATION_IMAGE_SRC,
          ),
        } satisfies PublicationCatalogItem;
      });
  } catch {
    // Ignore
  }

  return dedupeByTitle([...fromDkipLive, ...fromInternal]).sort((a, b) => {
    return parseIndonesianDateText(b.lastUpdated) - parseIndonesianDateText(a.lastUpdated);
  });
}
