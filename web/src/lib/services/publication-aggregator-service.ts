import "server-only";

import type { PublicationCatalogItem } from "@/app/publikasi/publikasi-content";
import { getBappedaDigitalPublications } from "@/lib/services/bappeda-publication-service";
import { getPublishedBooks, getPublishedInfographics, type PortalDataset } from "@/lib/services/ckan-portal-api";
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
    
    // Hapus/abaikan publikasi jika link unduhan/akses-nya kosong, '#' atau berupa placeholder CKAN/mock
    const isPlaceholderHref =
      !item.href ||
      item.href === "#" ||
      item.href === "/#" ||
      item.href.toLowerCase().includes("placeholder") ||
      item.href.toLowerCase().includes("mock");
      
    if (isPlaceholderHref) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
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

function mapCkanBookToItem(dataset: PortalDataset): PublicationCatalogItem {
  const fileUrl = dataset.extras.file_url || "";
  const imageUrl = dataset.extras.image_url || "";
  const description = dataset.extras.description || dataset.description || "";
  const publishedAt = dataset.extras.published_at || dataset.metadataModified;

  // If there's a resource with a URL, use it as the document link
  const resourceUrl = dataset.resources.length > 0 ? dataset.resources[0].url : "";
  const docHref = fileUrl || resourceUrl || "#";

  return {
    id: `ckan-${dataset.id}`,
    title: dataset.title,
    summary: description || "Publikasi Digital Satu Data Bulungan",
    organization: dataset.organizationName,
    lastUpdated: publishedAt.slice(0, 10),
    href: docHref,
    hrefLabel: "Lihat Dokumen",
    downloadHref: docHref,
    downloadLabel: "Unduh Dokumen",
    openInNewTab: true,
    imageSrc: imageUrl || undefined,
  };
}

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

  // Buku digital dari CKAN
  let fromCkan: PublicationCatalogItem[] = [];
  try {
    const ckanBooks = await getPublishedBooks();
    fromCkan = ckanBooks.map(mapCkanBookToItem);
  } catch {
    // Ignore CKAN errors
  }

  return dedupeByTitle([...fromBappeda, ...fromCkan]);
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

  // Infografis dari CKAN (termasuk yang di-upload lewat form internal)
  let fromCkan: PublicationCatalogItem[] = [];
  try {
    const ckanInfographics = await getPublishedInfographics();
    fromCkan = ckanInfographics.map((dataset) => {
      const imageUrl = dataset.extras.image_url || "";
      const fileUrl = dataset.extras.file_url || "";
      const description = dataset.extras.description || dataset.description || "";
      const publishedAt = dataset.extras.published_at || dataset.metadataModified;
      const formattedTitle = formatInfografisTitle(dataset.title);

      // Pick image from resources if no image_url extra
      let imageSrc = imageUrl;
      if (!imageSrc) {
        const imageResource = dataset.resources.find((r) =>
          IMAGE_RESOURCE_PATTERN.test(r.url) ||
          ["PNG", "JPG", "JPEG", "WEBP"].includes(r.format.toUpperCase())
        );
        imageSrc = imageResource?.url || "";
      }

      return {
        id: `ckan-infografis-${dataset.id}`,
        title: formattedTitle,
        summary: description || "Infografis Satu Data Bulungan.",
        organization: dataset.organizationName,
        lastUpdated: publishedAt.slice(0, 10),
        href: fileUrl || imageSrc || "#",
        hrefLabel: "Buka Sumber",
        openInNewTab: true,
        imageSrc: normalizePublicationImageSrc(
          imageSrc,
          DEFAULT_PUBLICATION_IMAGE_SRC,
        ),
      } satisfies PublicationCatalogItem;
    });
  } catch {
    // Ignore CKAN errors
  }

  return dedupeByTitle([...fromDkipLive, ...fromCkan]).sort((a, b) => {
    return parseIndonesianDateText(b.lastUpdated) - parseIndonesianDateText(a.lastUpdated);
  });
}
