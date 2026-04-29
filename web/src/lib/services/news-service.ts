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

export async function loadKabarDataItems(limit = Number.MAX_SAFE_INTEGER): Promise<PortalNewsItem[]> {
  try {
    const directoryEntries = await readdir(beritaDirectory, { withFileTypes: true });
    const txtEntries = directoryEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".txt"));

    const newsItems = await Promise.all(
      txtEntries.map(async (entry) => {
        const slug = entry.name.replace(/\.txt$/, "");
        const rawText = await readFile(path.join(beritaDirectory, entry.name), "utf8");
        const lines = rawText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          return null;
        }

        const sourceUrl = lines[0];
        if (!sourceUrl.startsWith("http")) {
          return null;
        }

        const title = normalizeNewsTitle(lines[1]);
        const firstParagraph = normalizeNewsText(lines.slice(2).join(" "));
        const description =
          firstParagraph.length > 200 ? `${firstParagraph.slice(0, 197).trimEnd()}...` : firstParagraph;

        const imageFileName = beritaImageExtensions
          .map((extension) => `${slug}${extension}`)
          .find((fileName) => directoryEntries.some((candidate) => candidate.isFile() && candidate.name === fileName));

        if (!imageFileName) {
          return null;
        }

        const parsedDate = extractDateFromNewsUrl(sourceUrl);

        return {
          title,
          description,
          date: parsedDate ?? "2026-01-01",
          organization: inferNewsOrganization(sourceUrl),
          href: sourceUrl,
          topicLabel: inferNewsTopicLabel(`${title} ${description}`),
          imageSrc: `/berita/${imageFileName}`,
        } satisfies PortalNewsItem;
      }),
    );

    return newsItems
      .filter((item): item is PortalNewsItem => Boolean(item))
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, limit);
  } catch {
    return [];
  }
}
