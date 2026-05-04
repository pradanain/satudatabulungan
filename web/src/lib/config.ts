type DataSourceMode = "mock" | "ckan";

export interface RuntimeConfig {
  portalName: string;
  portalTagline: string;
  dataSourceMode: DataSourceMode;
  ckanBaseUrl: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  const mode = (process.env.DATA_SOURCE_MODE ?? "mock").toLowerCase();
  const dataSourceMode: DataSourceMode = mode === "ckan" ? "ckan" : "mock";
  const ckanBaseUrl =
    process.env.NEXT_PUBLIC_CKAN_BASE_URL ??
    process.env.CKAN_BASE_URL ??
    "http://localhost:5000";

  return {
    portalName: process.env.NEXT_PUBLIC_PORTAL_NAME ?? "Satu Data Kabupaten Bulungan",
    portalTagline:
      process.env.NEXT_PUBLIC_PORTAL_TAGLINE ?? "Akurat · Mutakhir · Terpadu · Bertanggung Jawab",
    dataSourceMode,
    ckanBaseUrl,
  };
}

