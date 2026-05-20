import type { InternalNavKey, InternalPermission, InternalRole, InternalSession } from "@/lib/types/internal";

type LegacyRole = "admin" | "operator" | "operator_opd";

export function normalizeInternalRole(role: string): InternalRole {
  switch (role) {
    case "admin":
      return "sekretariat";
    case "operator":
    case "operator_opd":
      return "produsen";
    case "sekretariat":
    case "pembina":
    case "walidata":
    case "produsen":
      return role;
    default:
      return "produsen";
  }
}

// ---------------------------------------------------------------------------
// Action-based permission system
// ---------------------------------------------------------------------------

export const internalRolePermissions: Record<InternalRole, InternalPermission[]> = {
  sekretariat: [
    "dataset.view_all",
    "dataset.view_own_opd",
    "monitoring.view_all",
    "monitoring.create_evaluation_note",
    "monitoring.create_issue_note",
    "monitoring.assign_follow_up",
    "priority_data.view",
    "priority_data.manage",
    "forum.view",
    "forum.manage",
    "standard_data.view",
    "master_data.view_topics",
    "master_data.view_organizations",
    "audit.view_all",
    "notifications.view",
    "profile.view",
    "help.view",
    "content.view_all",
    "news.view",
    "regulation.view",
    "technical_guide.view",
    "infographic.view_all",
    "digital_publication.view_all",
  ],
  pembina: [
    "dataset.view_all",
    "dataset.view_own_opd",
    "dataset.review",
    "dataset.add_review_note",
    "standard_data.view",
    "standard_data.manage",
    "standard_data.recommend",
    "monitoring.view_all",
    "monitoring.create_evaluation_note",
    "monitoring.create_issue_note",
    "priority_data.view",
    "forum.view",
    "master_data.view_topics",
    "master_data.view_organizations",
    "audit.view_all",
    "notifications.view",
    "profile.view",
    "help.view",
    "content.view_all",
    "news.view",
    "regulation.view",
    "technical_guide.view",
    "infographic.view_all",
    "digital_publication.view_all",
  ],
  walidata: [
    "dataset.view_all",
    "dataset.view_own_opd",
    "dataset.create_own_opd",
    "dataset.edit_draft_own_opd",
    "dataset.upload_file",
    "dataset.edit_metadata",
    "dataset.submit",
    "dataset.review",
    "dataset.add_review_note",
    "dataset.request_revision",
    "dataset.approve",
    "dataset.publish",
    "dataset.unpublish",
    "dataset.archive",
    "dataset.restore_from_archive",
    "monitoring.view_all",
    "monitoring.create_evaluation_note",
    "monitoring.create_issue_note",
    "monitoring.assign_follow_up",
    "priority_data.view",
    "priority_data.manage",
    "forum.view",
    "standard_data.view",
    "master_data.view_topics",
    "master_data.manage_topics",
    "master_data.view_organizations",
    "master_data.manage_organizations",
    "portal.manage_settings",
    "portal.manage_integrations",
    "portal.manage_users",
    "audit.view_all",
    "notifications.view",
    "profile.view",
    "help.view",
    "content.view_all",
    "content.create_own_opd",
    "content.edit_own_draft",
    "content.upload_file",
    "content.submit",
    "content.review",
    "content.approve",
    "content.publish",
    "content.unpublish",
    "content.archive",
    "content.manage_all",
    "news.view",
    "news.manage",
    "regulation.view",
    "regulation.manage",
    "technical_guide.view",
    "technical_guide.manage",
    "infographic.view_all",
    "infographic.view_own_opd",
    "infographic.create_own_opd",
    "infographic.manage_all",
    "digital_publication.view_all",
    "digital_publication.view_own_opd",
    "digital_publication.create_own_opd",
    "digital_publication.manage_all",
  ],
  produsen: [
    "dataset.view_own_opd",
    "dataset.create_own_opd",
    "dataset.edit_draft_own_opd",
    "dataset.upload_file",
    "dataset.edit_metadata",
    "dataset.submit",
    "monitoring.view_own_opd",
    "priority_data.view",
    "priority_data.propose",
    "forum.view",
    "standard_data.view",
    "audit.view_own",
    "notifications.view",
    "profile.view",
    "help.view",
    "content.view_own_opd",
    "content.create_own_opd",
    "content.edit_own_draft",
    "content.upload_file",
    "content.submit",
    "infographic.view_own_opd",
    "infographic.create_own_opd",
    "digital_publication.view_own_opd",
    "digital_publication.create_own_opd",
  ],
};

const _permissionCache = new Map<InternalRole, ReadonlySet<InternalPermission>>();

function getPermissionSet(role: InternalRole): ReadonlySet<InternalPermission> {
  let cached = _permissionCache.get(role);
  if (!cached) {
    cached = new Set(internalRolePermissions[role]);
    _permissionCache.set(role, cached);
  }
  return cached;
}

/** Check if a role has a specific permission */
export function hasPermission(
  sessionOrRole: InternalSession | InternalRole,
  permission: InternalPermission,
): boolean {
  const role = typeof sessionOrRole === "string" ? sessionOrRole : sessionOrRole.role;
  return getPermissionSet(role).has(permission);
}

/** Get the full permission list for a role */
export function getRolePermissions(role: InternalRole): InternalPermission[] {
  return [...internalRolePermissions[role]];
}

/** Get the effective permissions for a session (role-based) */
export function getUserEffectivePermissions(session: InternalSession): InternalPermission[] {
  return getRolePermissions(session.role);
}

/** Legacy permission string → new permission mapping for backward compatibility */
export function normalizeLegacyPermission(legacy: string): InternalPermission[] {
  switch (legacy) {
    case "full_access":
      return [];
    case "manage_users":
      return ["portal.manage_users"];
    case "manage_settings":
      return ["portal.manage_settings"];
    case "publish_dataset":
      return ["dataset.publish"];
    case "review_dataset":
      return ["dataset.review"];
    case "monitor_audit":
      return ["audit.view_all", "monitoring.view_all"];
    case "manage_own_dataset":
      return ["dataset.create_own_opd", "dataset.edit_draft_own_opd", "dataset.upload_file", "dataset.edit_metadata"];
    case "submit_review":
      return ["dataset.submit"];
    case "coordinate":
      return ["monitoring.create_evaluation_note", "monitoring.assign_follow_up"];
    case "view_all_datasets":
      return ["dataset.view_all"];
    default:
      return [];
  }
}


export const INTERNAL_SESSION_COOKIE = "satudata_internal_session";
const INTERNAL_SESSION_TOKEN_VERSION = "v1";
const DEFAULT_DEV_INTERNAL_SESSION_SECRET = "satudata-dev-internal-session-secret-change-me";

export const internalNavLabels: Record<InternalNavKey, string> = {
  dashboard: "Dashboard",
  datasets: "Dataset",
  review: "Verifikasi Data",
  monitoring: "Monitoring",
  users: "Users",
  archive: "Arsip Dataset",
  organizations: "OPD",
  topics: "Topik Dataset",
  notifications: "Notifikasi & Aktivitas",
  workflowHistory: "Riwayat Workflow",
  settings: "Pengaturan Portal",
  profile: "Profil",
  help: "Bantuan / FAQ",
  integrations: "Integrasi & API",
  publications: "Publikasi",
};

export const internalRoleLabels: Record<InternalRole, string> = {
  sekretariat: "Sekretariat",
  pembina: "Pembina",
  walidata: "Walidata",
  produsen: "Produsen",
};

export function getDisplayOrganizationName(session: InternalSession): string {
  if (session.role === "sekretariat") return "Bappeda Litbang";
  if (session.role === "walidata") return "DKIP";
  if (session.role === "pembina") return "BPS Bulungan";
  // For produsen, it should be the Perangkat Daerah name
  return session.organizationName || "Perangkat Daerah";
}

export const internalNavAccess: Record<InternalNavKey, InternalRole[]> = {
  dashboard: ["sekretariat", "pembina", "walidata", "produsen"],
  datasets: ["sekretariat", "pembina", "walidata", "produsen"],
  review: ["sekretariat", "pembina", "walidata", "produsen"],
  monitoring: ["sekretariat", "pembina", "walidata"],
  users: ["walidata"],
  archive: ["sekretariat", "pembina", "walidata"],
  organizations: ["sekretariat", "pembina", "walidata"],
  topics: ["sekretariat", "pembina", "walidata"],
  notifications: ["sekretariat", "pembina", "walidata", "produsen"],
  workflowHistory: ["sekretariat", "pembina", "walidata"],
  settings: ["walidata"],
  profile: ["sekretariat", "pembina", "walidata", "produsen"],
  help: ["sekretariat", "pembina", "walidata", "produsen"],
  integrations: ["walidata"],
  publications: ["sekretariat", "pembina", "walidata", "produsen"],
};

const pathMapping: Array<{ prefix: string; navKey: InternalNavKey }> = [
  { prefix: "/internal/dashboard", navKey: "dashboard" },
  { prefix: "/internal/datasets", navKey: "datasets" },
  { prefix: "/internal/workflow", navKey: "review" },
  { prefix: "/internal/monitoring", navKey: "monitoring" },
  { prefix: "/internal/users", navKey: "users" },
  { prefix: "/internal/archive", navKey: "archive" },
  { prefix: "/internal/organizations", navKey: "organizations" },
  { prefix: "/internal/topics", navKey: "topics" },
  { prefix: "/internal/notifications", navKey: "notifications" },
  { prefix: "/internal/workflow-history", navKey: "workflowHistory" },
  { prefix: "/internal/settings", navKey: "settings" },
  { prefix: "/internal/profile", navKey: "profile" },
  { prefix: "/internal/help", navKey: "help" },
  { prefix: "/internal/integrations", navKey: "integrations" },
  { prefix: "/internal/publications", navKey: "publications" },
];

const apiPathMapping: Array<{ prefix: string; navKey: InternalNavKey }> = [
  { prefix: "/api/internal/workflow/draft", navKey: "datasets" },
  { prefix: "/api/internal/datasets", navKey: "datasets" },
  { prefix: "/api/internal/workflow/transition", navKey: "review" },
  { prefix: "/api/internal/profile", navKey: "profile" },
  { prefix: "/api/internal/settings", navKey: "settings" },
];

function bytesToBase64(value: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }

  return btoa(bytesToBinary(value));
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64UrlFromBytes(value: Uint8Array): string {
  return bytesToBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return base64ToBytes(padded);
}

function stringToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function bytesToString(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

function toBufferSource(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function bytesToBinary(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  return binary;
}

function getInternalSessionSecret(): string {
  const configured = process.env.INTERNAL_SESSION_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_SESSION_SECRET wajib dikonfigurasi di production.");
  }

  return DEFAULT_DEV_INTERNAL_SESSION_SECRET;
}

let cachedSigningKeyPromise: Promise<CryptoKey> | null = null;

async function getSigningKey(): Promise<CryptoKey> {
  if (!cachedSigningKeyPromise) {
    cachedSigningKeyPromise = crypto.subtle.importKey(
      "raw",
      toBufferSource(stringToBytes(getInternalSessionSecret())),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }

  return cachedSigningKeyPromise;
}

async function signSessionPayload(payloadBase64Url: string): Promise<string> {
  const key = await getSigningKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    toBufferSource(stringToBytes(payloadBase64Url)),
  );
  return toBase64UrlFromBytes(new Uint8Array(signatureBuffer));
}

export async function encodeInternalSession(session: InternalSession): Promise<string> {
  const payload = toBase64UrlFromBytes(stringToBytes(JSON.stringify(session)));
  const signature = await signSessionPayload(payload);
  return `${INTERNAL_SESSION_TOKEN_VERSION}.${payload}.${signature}`;
}

function isValidInternalSessionCandidate(value: unknown): value is InternalSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<InternalSession>;
  return Boolean(session.userId && session.username && session.name && session.role && session.organizationId);
}

export async function decodeInternalSession(value: string | null | undefined): Promise<InternalSession | null> {
  if (!value) {
    return null;
  }

  const [version, payload, signature] = value.split(".");
  if (version !== INTERNAL_SESSION_TOKEN_VERSION || !payload || !signature) {
    return null;
  }

  try {
    const key = await getSigningKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      toBufferSource(fromBase64UrlToBytes(signature)),
      toBufferSource(stringToBytes(payload)),
    );
    if (!isValid) {
      return null;
    }

    const parsed = JSON.parse(bytesToString(fromBase64UrlToBytes(payload))) as any;
    if (!isValidInternalSessionCandidate(parsed)) {
      return null;
    }

    parsed.role = normalizeInternalRole(parsed.role as string);

    return parsed;
  } catch {
    return null;
  }
}

export function canAccessNav(role: InternalRole, navKey: InternalNavKey): boolean {
  return internalNavAccess[navKey]?.includes(role) ?? false;
}

export function getVisibleNavKeys(role: InternalRole): InternalNavKey[] {
  return (Object.keys(internalNavAccess) as InternalNavKey[]).filter((key) => canAccessNav(role, key));
}

export function resolveInternalNavKey(pathname: string): InternalNavKey | null {
  const normalized = pathname.toLowerCase();

  for (const item of pathMapping) {
    if (normalized === item.prefix || normalized.startsWith(`${item.prefix}/`)) {
      return item.navKey;
    }
  }

  for (const item of apiPathMapping) {
    if (normalized === item.prefix || normalized.startsWith(`${item.prefix}/`)) {
      return item.navKey;
    }
  }

  return null;
}
