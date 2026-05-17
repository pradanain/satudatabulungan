import "server-only";

import type { InternalRole, InternalSession } from "@/lib/types/internal";
import {
  fetchWithTimeout,
  isUpstreamNetworkError,
  summarizeUpstreamError,
} from "@/lib/utils/upstream-error";

export type PortalContentType = "dataset" | "infografis" | "publikasi" | "accounts";

export type PortalOrganization = {
  id: string;
  slug: string;
  name: string;
  description: string;
  packageCount: number;
  website: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  twitter: string;
  sourceUrl: string;
};

export type PortalResource = {
  id: string;
  name: string;
  format: string;
  description: string;
  url: string;
  lastModified?: string;
};

export type PortalDataset = {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  organizationId: string;
  organizationName: string;
  tags: string[];
  topics: string[];
  year: number;
  period: string;
  frequency: string;
  status: string;
  contentType: PortalContentType;
  metadataModified: string;
  resources: PortalResource[];
  extras: Record<string, string>;
};

export type PortalAccount = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: InternalRole;
  organizationId: string;
  organizationName: string;
  title: string;
  status: "Aktif" | "Nonaktif";
  permissions: string[];
};

export type PortalDashboard = {
  visibleDatasetCount: number;
  publishedCount: number;
  reviewQueueCount: number;
  organizationCount: number;
  contentCounts: {
    dataset: number;
    infografis: number;
    publikasi: number;
  };
};

type CkanActionResponse<T> = {
  success: boolean;
  result: T;
  error?: unknown;
};

type CkanExtra = {
  key: string;
  value: string;
};

type CkanOrganizationRaw = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  package_count?: number;
  extras?: CkanExtra[];
};

type CkanTagRaw = {
  name?: string;
  display_name?: string;
};

type CkanGroupRaw = {
  name?: string;
  title?: string;
};

type CkanResourceRaw = {
  id?: string;
  name?: string;
  format?: string;
  description?: string;
  url?: string;
  last_modified?: string;
};

type CkanPackageRaw = {
  id: string;
  name: string;
  title?: string;
  notes?: string;
  metadata_modified?: string;
  private?: boolean;
  owner_org?: string;
  organization?: { id?: string; name?: string; title?: string };
  tags?: CkanTagRaw[];
  groups?: CkanGroupRaw[];
  extras?: CkanExtra[];
  resources?: CkanResourceRaw[];
};

type CkanPackageSearchResult = {
  count: number;
  results: CkanPackageRaw[];
};

const DEFAULT_BASE_URL = "http://localhost:5000";
const ACCOUNTS_PACKAGE_NAME = "portal-akun-role-kabupaten-bulungan";
const DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS = 30_000;

let ckanUnavailableUntil = 0;

const rolePermissions: Record<InternalRole, string[]> = {
  admin: [
    "manage_all_organizations",
    "manage_all_datasets",
    "manage_all_accounts",
    "validate_dataset",
    "curate_dataset",
    "publish_dataset",
    "upload_dataset",
    "upload_infografis",
    "upload_buku",
  ],
  pembina: [
    "validate_dataset",
    "curate_dataset",
    "publish_dataset",
    "upload_dataset",
    "upload_infografis",
    "upload_buku",
  ],
  walidata: [
    "validate_dataset",
    "curate_dataset",
    "publish_dataset",
    "upload_dataset",
    "upload_infografis",
    "upload_buku",
  ],
  operator: ["manage_own_dataset", "upload_dataset", "upload_infografis", "upload_buku"],
};

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CKAN_BASE_URL?.trim() ||
    process.env.CKAN_BASE_URL?.trim() ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
}

function getServerApiKey(): string {
  return process.env.CKAN_API_KEY?.trim() || "";
}

function getActionEndpoint(action: string): string {
  return `${getBaseUrl()}/api/3/action/${action}`;
}

function getCkanUnavailableCooldownMs(): number {
  const parsed = Number(
    process.env.CKAN_UNAVAILABLE_COOLDOWN_MS ?? DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS,
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CKAN_UNAVAILABLE_COOLDOWN_MS;
  }

  return Math.floor(parsed);
}

function isInUnavailableWindow(): boolean {
  return Date.now() < ckanUnavailableUntil;
}

function markCkanUnavailable(): void {
  ckanUnavailableUntil = Date.now() + getCkanUnavailableCooldownMs();
}

function clearCkanUnavailable(): void {
  ckanUnavailableUntil = 0;
}

function toExtrasMap(extras?: CkanExtra[]): Record<string, string> {
  const pairs = (extras ?? []).map((item) => [item.key, item.value] as const);
  return Object.fromEntries(pairs);
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function ckanAction<T>(
  action: string,
  payload: Record<string, unknown> | undefined,
  options?: { method?: "GET" | "POST"; requireAuth?: boolean; nextRevalidateSeconds?: number },
): Promise<T> {
  if (isInUnavailableWindow()) {
    throw new Error("CKAN upstream sementara tidak tersedia.");
  }

  const method = options?.method ?? "POST";
  const endpoint = method === "GET" ? `${getActionEndpoint(action)}?${new URLSearchParams(payload as Record<string, string>).toString()}` : getActionEndpoint(action);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  const apiKey = getServerApiKey();
  if (apiKey) {
    headers.Authorization = apiKey;
  }

  if (options?.requireAuth && !apiKey) {
    throw new Error("CKAN_API_KEY belum diisi.");
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(endpoint, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
      next: { revalidate: options?.nextRevalidateSeconds ?? 120 },
    });
    clearCkanUnavailable();
  } catch (error) {
    if (isUpstreamNetworkError(error)) {
      markCkanUnavailable();
    }

    const reason = summarizeUpstreamError(error);
    throw new Error(`CKAN request gagal untuk action ${action} (${reason}).`);
  }

  if (!response.ok) {
    throw new Error(`CKAN request gagal (${response.status}) untuk action ${action}.`);
  }

  const data = (await response.json()) as CkanActionResponse<T>;
  if (!data.success) {
    throw new Error(`CKAN action ${action} mengembalikan success=false.`);
  }

  return data.result;
}

function mapOrganization(raw: CkanOrganizationRaw): PortalOrganization {
  const extras = toExtrasMap(raw.extras);
  return {
    id: raw.id,
    slug: raw.name,
    name: raw.title?.trim() || raw.name,
    description: raw.description?.trim() || "",
    packageCount: Number(raw.package_count ?? 0),
    website: extras.website ?? "",
    address: extras.address ?? "",
    phone: extras.phone ?? "",
    email: extras.email ?? "",
    whatsapp: extras.whatsapp ?? "",
    facebook: extras.facebook ?? "",
    instagram: extras.instagram ?? "",
    youtube: extras.youtube ?? "",
    tiktok: extras.tiktok ?? "",
    twitter: extras.twitter ?? "",
    sourceUrl: extras.source_url ?? "",
  };
}

function detectContentType(extras: Record<string, string>): PortalContentType {
  const raw = (extras.content_type || extras.tipe_konten || "dataset").toLowerCase();
  if (raw.includes("infografis")) return "infografis";
  if (raw.includes("publikasi") || raw.includes("buku")) return "publikasi";
  if (raw.includes("account") || raw.includes("akun")) return "accounts";
  return "dataset";
}

function mapDataset(raw: CkanPackageRaw): PortalDataset {
  const extras = toExtrasMap(raw.extras);
  const metadataModified = raw.metadata_modified || new Date().toISOString();
  const contentType = detectContentType(extras);
  const tags = (raw.tags ?? [])
    .map((item) => item.display_name?.trim() || item.name?.trim() || "")
    .filter(Boolean);
  const topicsFromGroups = (raw.groups ?? [])
    .map((item) => item.title?.trim() || item.name?.trim() || "")
    .filter(Boolean);
  const topics = topicsFromGroups.length
    ? topicsFromGroups
    : [extras.topik || extras.topic || "Umum"];
  const year = Number(extras.tahun_data || extras.tahun_terbit || metadataModified.slice(0, 4));

  return {
    id: raw.id,
    slug: raw.name,
    title: raw.title?.trim() || raw.name,
    description: raw.notes?.trim() || "",
    summary: (extras.summary || raw.notes || "").slice(0, 180),
    organizationId: raw.organization?.id || raw.owner_org || "",
    organizationName: raw.organization?.title || raw.organization?.name || "Organisasi tidak diketahui",
    tags,
    topics,
    year: Number.isFinite(year) ? year : Number(metadataModified.slice(0, 4)),
    period: extras.periode || extras.period || `${metadataModified.slice(0, 4)}`,
    frequency: extras.frekuensi_pembaruan || extras.frequency || "Tahunan",
    status: (extras.status || (raw.private ? "Draft" : "Published")).trim(),
    contentType,
    metadataModified,
    resources: (raw.resources ?? []).map((resource, index) => ({
      id: resource.id || `${raw.id}-res-${index + 1}`,
      name: resource.name || `resource-${index + 1}`,
      format: resource.format || "DATA",
      description: resource.description || "",
      url: resource.url || "",
      lastModified: resource.last_modified,
    })),
    extras,
  };
}

function getRolePermissions(role: InternalRole): string[] {
  return rolePermissions[role] ?? [];
}

function mapAccountRow(row: Record<string, unknown>, organizationsById: Map<string, PortalOrganization>): PortalAccount {
  const roleRaw = `${row.role ?? "operator"}` as InternalRole;
  const role: InternalRole =
    roleRaw === "admin" || roleRaw === "pembina" || roleRaw === "walidata" ? roleRaw : "operator";
  const orgId = `${row.organizationId ?? ""}`;
  const org = organizationsById.get(orgId);

  return {
    id: `${row.id ?? row.username ?? ""}`,
    username: `${row.username ?? ""}`,
    password: `${row.password ?? ""}`,
    name: `${row.name ?? ""}`,
    email: `${row.email ?? ""}`,
    phone: `${row.phone ?? ""}`,
    role,
    organizationId: orgId,
    organizationName: org?.name || `${row.organizationName ?? ""}`,
    title: `${row.title ?? ""}`,
    status: `${row.status ?? "Aktif"}` === "Nonaktif" ? "Nonaktif" : "Aktif",
    permissions: Array.isArray(row.permissions)
      ? row.permissions.map((item) => `${item}`)
      : getRolePermissions(role),
  };
}

async function getAccountsPackage(): Promise<CkanPackageRaw | null> {
  const search = await ckanAction<CkanPackageSearchResult>(
    "package_search",
    {
      q: `name:${ACCOUNTS_PACKAGE_NAME}`,
      rows: 1,
      start: 0,
    },
    { method: "POST", nextRevalidateSeconds: 30 },
  );

  const found = search.results.find((item) => item.name === ACCOUNTS_PACKAGE_NAME) ?? search.results[0];
  return found ?? null;
}

export async function getOrganizations(): Promise<PortalOrganization[]> {
  const names = await ckanAction<string[]>("organization_list", { all_fields: false }, { method: "POST" });
  const organizations = await Promise.all(
    names.map((name) =>
      ckanAction<CkanOrganizationRaw>(
        "organization_show",
        {
          id: name,
          include_datasets: false,
          include_dataset_count: true,
          include_extras: true,
          include_users: false,
          include_groups: false,
        },
        { method: "POST" },
      ),
    ),
  );

  return organizations.map(mapOrganization).sort((left, right) => left.name.localeCompare(right.name, "id-ID"));
}

export async function getOrganizationById(id: string): Promise<PortalOrganization | null> {
  if (!id.trim()) {
    return null;
  }

  const raw = await ckanAction<CkanOrganizationRaw>(
    "organization_show",
    {
      id,
      include_datasets: false,
      include_dataset_count: true,
      include_extras: true,
      include_users: false,
      include_groups: false,
    },
    { method: "POST" },
  ).catch(() => null);

  return raw ? mapOrganization(raw) : null;
}

export async function getDatasets(filters?: { organizationId?: string; topic?: string; contentType?: PortalContentType }): Promise<PortalDataset[]> {
  const search = await ckanAction<CkanPackageSearchResult>(
    "package_search",
    {
      q: "*:*",
      rows: 1000,
      start: 0,
      include_private: true,
    },
    { method: "POST" },
  );

  return search.results
    .map(mapDataset)
    .filter((item) => {
      if (item.contentType === "accounts") return false;
      if (filters?.organizationId && item.organizationId !== filters.organizationId) return false;
      if (filters?.topic && !item.topics.some((topic) => topic.toLowerCase() === filters.topic?.toLowerCase())) return false;
      if (filters?.contentType && item.contentType !== filters.contentType) return false;
      return true;
    })
    .sort((left, right) => right.metadataModified.localeCompare(left.metadataModified));
}

export async function getDatasetById(id: string): Promise<PortalDataset | null> {
  if (!id.trim()) {
    return null;
  }

  const raw = await ckanAction<CkanPackageRaw>("package_show", { id }, { method: "POST" }).catch(() => null);
  return raw ? mapDataset(raw) : null;
}

export async function getDatasetsByOrganization(organizationId: string): Promise<PortalDataset[]> {
  return getDatasets({ organizationId, contentType: "dataset" });
}

export async function getDatasetsByTopic(topic: string): Promise<PortalDataset[]> {
  return getDatasets({ topic, contentType: "dataset" });
}

export async function getInfographics(): Promise<PortalDataset[]> {
  return getDatasets({ contentType: "infografis" });
}

export async function getBooks(): Promise<PortalDataset[]> {
  return getDatasets({ contentType: "publikasi" });
}

export async function getAccounts(): Promise<PortalAccount[]> {
  const organizations = await getOrganizations();
  const organizationsById = new Map(organizations.map((item) => [item.id, item]));
  const accountsPackage = await getAccountsPackage();

  if (!accountsPackage) {
    return [];
  }

  const extras = toExtrasMap(accountsPackage.extras);
  const accountRows = parseJson<Array<Record<string, unknown>>>(extras.portal_accounts_json, []);

  return accountRows.map((row) => mapAccountRow(row, organizationsById));
}

export async function login(username: string, password: string): Promise<InternalSession | null> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password.trim()) {
    return null;
  }

  const accounts = await getAccounts();
  const account = accounts.find(
    (item) =>
      item.username.toLowerCase() === normalizedUsername &&
      item.password === password &&
      item.status === "Aktif",
  );

  if (!account) {
    return null;
  }

  return {
    userId: account.id,
    username: account.username,
    name: account.name,
    email: account.email,
    title: account.title,
    role: account.role,
    organizationId: account.organizationId,
    organizationName: account.organizationName,
  };
}

export async function getCurrentUser(session: InternalSession): Promise<PortalAccount | null> {
  const accounts = await getAccounts();
  return accounts.find((item) => item.id === session.userId) ?? null;
}

export function checkPermission(role: InternalRole, permission: string): boolean {
  return getRolePermissions(role).includes(permission);
}

export async function getDashboard(session: InternalSession): Promise<PortalDashboard> {
  const datasets = await getDatasets();
  const scoped =
    session.role === "admin" || session.role === "walidata"
      ? datasets
      : datasets.filter((item) => item.organizationId === session.organizationId);

  const visibleDatasetCount = scoped.length;
  const publishedCount = scoped.filter((item) => item.status.toLowerCase() === "published").length;
  const reviewQueueCount = scoped.filter((item) => {
    const status = item.status.toLowerCase();
    return status === "submitted" || status.includes("revision");
  }).length;

  return {
    visibleDatasetCount,
    publishedCount,
    reviewQueueCount,
    organizationCount: new Set(datasets.map((item) => item.organizationId)).size,
    contentCounts: {
      dataset: datasets.filter((item) => item.contentType === "dataset").length,
      infografis: datasets.filter((item) => item.contentType === "infografis").length,
      publikasi: datasets.filter((item) => item.contentType === "publikasi").length,
    },
  };
}

type UploadPayload = {
  title: string;
  notes: string;
  ownerOrgId: string;
  tags: string[];
  groups?: string[];
  extras?: Record<string, string>;
  resourceName: string;
  resourceFormat: string;
  resourceDescription: string;
  resourceContent: string;
  resourceFileName: string;
};

async function upsertDataset(payload: UploadPayload, contentType: PortalContentType): Promise<{ id: string; name: string }> {
  const apiKey = getServerApiKey();
  if (!apiKey) {
    throw new Error("CKAN_API_KEY wajib diisi untuk proses upload.");
  }

  const slug = payload.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 95);

  const extrasArray = Object.entries({
    ...(payload.extras ?? {}),
    content_type: contentType,
  }).map(([key, value]) => ({ key, value }));

  const form = new FormData();
  form.set("name", slug);
  form.set("title", payload.title);
  form.set("notes", payload.notes);
  form.set("owner_org", payload.ownerOrgId);
  form.set("private", "false");
  form.set("tags", JSON.stringify(payload.tags.map((tag) => ({ name: tag }))));
  form.set("extras", JSON.stringify(extrasArray));

  if (payload.groups?.length) {
    form.set("groups", JSON.stringify(payload.groups.map((name) => ({ name }))));
  }

  form.set("resources", "[]");
  form.set("resource_name", payload.resourceName);
  form.set("resource_format", payload.resourceFormat);
  form.set("resource_description", payload.resourceDescription);
  form.set(
    "upload",
    new Blob([payload.resourceContent], {
      type:
        payload.resourceFormat.toUpperCase() === "JSON"
          ? "application/json"
          : payload.resourceFormat.toUpperCase() === "PDF"
            ? "application/pdf"
            : "text/csv",
    }),
    payload.resourceFileName,
  );

  const createResponse = await fetchWithTimeout(getActionEndpoint("package_create"), {
    method: "POST",
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
    body: form,
  });

  const body = (await createResponse.json()) as CkanActionResponse<CkanPackageRaw>;
  if (!createResponse.ok || !body.success) {
    throw new Error("Gagal upload dataset ke CKAN.");
  }

  return {
    id: body.result.id,
    name: body.result.name,
  };
}

export async function uploadDataset(payload: UploadPayload): Promise<{ id: string; name: string }> {
  return upsertDataset(payload, "dataset");
}

export async function uploadInfographic(payload: UploadPayload): Promise<{ id: string; name: string }> {
  return upsertDataset(payload, "infografis");
}

export async function uploadBook(payload: UploadPayload): Promise<{ id: string; name: string }> {
  return upsertDataset(payload, "publikasi");
}

