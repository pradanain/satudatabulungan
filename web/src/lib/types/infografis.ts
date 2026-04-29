export type InfografisSourceType = "ckan" | "wordpress_rest" | "html_scrape";

export type InfografisItem = {
  id: string;
  source: InfografisSourceType;
  sourcePostId?: string;
  title: string;
  postUrl: string;
  imageUrl: string;
  imageOriginalUrl?: string;
  publishedDate?: string;
  publishedDateText?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type InfografisSourceQuery = "auto" | "ckan" | "live";

export type InfografisApiMeta = {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  sourceUsed: InfografisSourceType;
  externalSource: string;
};

export type InfografisApiResponse = {
  success: boolean;
  data: InfografisItem[];
  meta: InfografisApiMeta;
};
