import type { InternalNavKey, InternalRole, InternalSession } from "@/lib/types/internal";

export const INTERNAL_SESSION_COOKIE = "satudata_internal_session";
const INTERNAL_SESSION_TOKEN_VERSION = "v1";
const DEFAULT_DEV_INTERNAL_SESSION_SECRET = "satudata-dev-internal-session-secret-change-me";

export const internalNavLabels: Record<InternalNavKey, string> = {
  dashboard: "Dashboard",
  datasets: "Dataset Internal",
  review: "Review & Approval",
  monitoring: "Monitoring & Audit",
  users: "Users & Roles",
  archive: "Arsip Dataset",
  organizations: "Organisasi / OPD",
  topics: "Topik & Referensi",
  notifications: "Notifikasi & Aktivitas",
  workflowHistory: "Riwayat Workflow",
  settings: "Pengaturan Portal",
  profile: "Profil",
  help: "Bantuan / FAQ",
  integrations: "Integrasi",
};

export const internalRoleLabels: Record<InternalRole, string> = {
  admin: "Admin (Bappedalitbang / Sekretariat)",
  pembina: "Pembina Data (BPS)",
  walidata: "Walidata (DKIP)",
  operator: "Operator (OPD)",
};

export const internalNavAccess: Record<InternalNavKey, InternalRole[]> = {
  dashboard: ["admin", "pembina", "walidata", "operator"],
  datasets: ["admin", "pembina", "walidata", "operator"],
  review: ["admin", "pembina", "walidata", "operator"],
  monitoring: ["admin", "pembina", "walidata"],
  users: ["admin"],
  archive: ["admin", "pembina", "walidata"],
  organizations: ["admin", "pembina", "walidata"],
  topics: ["admin", "pembina", "walidata"],
  notifications: ["admin", "pembina", "walidata", "operator"],
  workflowHistory: ["admin", "pembina", "walidata"],
  settings: ["admin"],
  profile: ["admin", "pembina", "walidata", "operator"],
  help: ["admin", "pembina", "walidata", "operator"],
  integrations: ["admin", "walidata"],
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

    const parsed = JSON.parse(bytesToString(fromBase64UrlToBytes(payload))) as unknown;
    if (!isValidInternalSessionCandidate(parsed)) {
      return null;
    }

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
