import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export interface PortalNewsItem {
  title: string;
  description: string;
  date: string;
  organization: string;
  href: string;
  topicLabel: string;
  imageSrc: string;
}

const beritaDirectory = path.join(process.cwd(), "public", "berita");
const beritaImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const beritaAcronyms = new Set(["SDI", "BPS", "OPD", "DKIP", "API"]);
const beritaMinorWords = new Set(["dan", "di", "ke", "dari", "untuk", "pada", "dengan", "selaku", "yang"]);

function normalizeNewsText(text: string) {
  return text
    .replaceAll("â€“", "-")
    .replaceAll("â€œ", "\"")
    .replaceAll("â€", "\"")
    .replaceAll("â€™", "'")
    .replaceAll("Â", "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNewsTitle(text: string) {
  const normalized = normalizeNewsText(text).toLowerCase();

  return normalized
    .split(" ")
    .map((word, index) => {
      if (!word) {
        return word;
      }

      const acronymCandidate = word.toUpperCase();
      if (beritaAcronyms.has(acronymCandidate)) {
        return acronymCandidate;
      }

      if (index > 0 && beritaMinorWords.has(word)) {
        return word;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

function extractDateFromNewsUrl(url: string) {
  const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

function inferNewsOrganization(url: string) {
  if (url.includes("bulungankab.bps.go.id")) {
    return "BPS Kabupaten Bulungan";
  }

  if (url.includes("diskominfo.bulungan.go.id")) {
    return "Diskominfo Kabupaten Bulungan";
  }

  return "Pemerintah Kabupaten Bulungan";
}

function inferNewsTopicLabel(content: string) {
  const normalized = content.toLowerCase();

  if (normalized.includes("forum")) {
    return "Forum Satu Data";
  }

  if (normalized.includes("koordinasi")) {
    return "Koordinasi SDI";
  }

  if (normalized.includes("bimtek")) {
    return "Bimtek Portal";
  }

  return "Satu Data";
}

import { loadInternalPortalStore } from "@/lib/services/internal-store";

export async function loadKabarDataItems(limit = Number.MAX_SAFE_INTEGER): Promise<PortalNewsItem[]> {
  try {
    const store = await loadInternalPortalStore();
    const newsPublications = store.publications?.filter(
      (pub) => pub.type === "news" && pub.status === "Published"
    ) || [];

    const newsItems = newsPublications.map((pub) => {
      const title = pub.title;
      const description = pub.description || pub.content?.substring(0, 200) || "";
      const date = pub.publishedAt || pub.updatedAt;

      return {
        title,
        description,
        date: date.substring(0, 10),
        organization: pub.organizationName || "Pemerintah Kabupaten Bulungan",
        href: `/publikasi-berita/${pub.slug}`, // Or however it should be accessed
        topicLabel: inferNewsTopicLabel(`${title} ${description}`),
        imageSrc: pub.imageUrl || "/assets/brand/logos/lambang-bulungan.png",
      } satisfies PortalNewsItem;
    });

    return newsItems
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, limit);
  } catch {
    return [];
  }
}
