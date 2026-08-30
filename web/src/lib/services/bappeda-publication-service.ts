import bappedaData from "@/data/bappeda-publikasi.json";

export interface BappedaPublicationItem {
  id: string;
  title: string;
  publishedDate: string;
  downloadCount: number | null;
  viewUrl: string;
  downloadUrl: string;
  sourcePageUrl: string;
}

export async function getBappedaDigitalPublications(): Promise<BappedaPublicationItem[]> {
  // Cloudflare Turnstile actively blocks server-side scraping from this application,
  // so we fallback to reading a local pre-scraped snapshot of the data.
  // See src/data/bappeda-publikasi.json
  const items = bappedaData as BappedaPublicationItem[];
  
  // Sort from newest to oldest by date
  return [...items].sort((left, right) => right.publishedDate.localeCompare(left.publishedDate));
}
