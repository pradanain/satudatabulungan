import type { InternalNavKey, InternalRole, InternalSession } from "@/lib/types/internal";

export const INTERNAL_SESSION_COOKIE = "satudata_internal_session";

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
  admin: "Admin",
  walidata: "Walidata",
  operator_opd: "Operator OPD",
};

export const internalNavAccess: Record<InternalNavKey, InternalRole[]> = {
  dashboard: ["admin", "walidata", "operator_opd"],
  datasets: ["admin", "walidata", "operator_opd"],
  review: ["admin", "walidata", "operator_opd"],
  monitoring: ["admin", "walidata"],
  users: ["admin"],
  archive: ["admin", "walidata"],
  organizations: ["admin", "walidata"],
  topics: ["admin", "walidata"],
  notifications: ["admin", "walidata", "operator_opd"],
  workflowHistory: ["admin", "walidata", "operator_opd"],
  settings: ["admin"],
  profile: ["admin", "walidata", "operator_opd"],
  help: ["admin", "walidata", "operator_opd"],
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

function toBase64(value: string): string {
  if (typeof btoa === "function") {
    return btoa(value);
  }

  return Buffer.from(value, "utf8").toString("base64");
}

function fromBase64(value: string): string {
  if (typeof atob === "function") {
    return atob(value);
  }

  return Buffer.from(value, "base64").toString("utf8");
}

export function encodeInternalSession(session: InternalSession): string {
  return toBase64(JSON.stringify(session));
}

export function decodeInternalSession(value: string | null | undefined): InternalSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64(value)) as InternalSession;
    if (!parsed.userId || !parsed.role || !parsed.username) {
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
