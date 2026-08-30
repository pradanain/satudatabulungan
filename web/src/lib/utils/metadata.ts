import type { Metadata } from "next";

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export const TAB_TITLE_SUFFIX = "Satu Data Bulungan";

function getSiteOrigin(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (candidate) {
    try {
      return new URL(candidate).origin;
    } catch {
      // Fallback to localhost when env value is not a valid URL.
    }
  }

  return "http://localhost:3000";
}

const siteOrigin = getSiteOrigin();

export function getMetadataBase(): URL {
  return new URL(siteOrigin);
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
}: BuildPageMetadataInput): Metadata {
  const pageTitle = title.includes(TAB_TITLE_SUFFIX) ? title : `${title} | ${TAB_TITLE_SUFFIX}`;
  const url = new URL(path, siteOrigin).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: TAB_TITLE_SUFFIX,
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
    },
  };
}
