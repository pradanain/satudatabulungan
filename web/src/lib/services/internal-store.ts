import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getRolePermissions, hasPermission, normalizeInternalRole } from "@/lib/utils/internal-auth";
import { dirname } from "node:path";
import opdDirectory from "@/lib/data/opd-directory.json";
import { matchesHomepageTopicFilter } from "@/lib/data/homepage-topics";
import type {
  Dataset,
  DatasetFilterOptions,
  DatasetFilters,
  DatasetSort,
  PortalStats,
} from "@/lib/types/dataset";
import type {
  DatasetDraftInput,
  DatasetUpdateInput,
  InternalAuditLog,
  InternalDataset,
  InternalNotification,
  InternalOrganization,
  InternalPortalStore,
  InternalRole,
  InternalSession,
  InternalTopicReference,
  InternalUser,
  InternalWorkflowEvent,
  PortalSettings,
  DatasetNote,
  DatasetNoteType,
  DatasetNoteCategory,
  InternalPublication,
} from "@/lib/types/internal";
import { canTransition, normalizeDatasetStatus, getStatusLabel, type WorkflowItem } from "@/lib/types/workflow";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { resolveLocalStorePath } from "@/lib/utils/local-store-path";

const STORE_VERSION = 4;
const defaultSort: DatasetSort = "terbaru";

type WorkflowOverrideEntry = {
  status: Dataset["status"];
  updatedAt: string;
  reviewNote?: string;
};

type WorkflowOverrides = Record<string, WorkflowOverrideEntry>;

type LegacyWorkflowEvent = {
  slug: string;
  actor: string;
  at: string;
  fromStatus: string;
  toStatus: Dataset["status"];
  persistedTo: "ckan" | "mock-api";
  reviewNote?: string;
};

type LegacyWorkflowTrail = Record<string, LegacyWorkflowEvent[]>;

type LegacyDraftEntry = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  status: Dataset["status"];
  lastUpdated: string;
  resourceCount: number;
};

type LegacyDrafts = Record<string, LegacyDraftEntry>;

function getLocalPath(filename: string): string {
  return resolveLocalStorePath(filename, "internal-portal-store");
}

function getStorePath(): string {
  return getLocalPath("internal-portal-store.json");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function pickUserIdByRole(users: InternalUser[], role: InternalRole): string {
  return users.find((user) => user.role === role)?.id ?? users[0]?.id ?? "system";
}

function formatSizeLabel(format: Dataset["formats"][number]): string {
  if (format === "API" || format === "JSON") {
    return "JSON";
  }

  if (format === "PDF") {
    return "640 KB";
  }

  if (format === "XLSX") {
    return "1.4 MB";
  }

  return "1.2 MB";
}

function toInternalWorkflowEvent(
  slug: string,
  actor: string,
  actorName: string,
  actorRole: InternalRole,
  fromStatus: string,
  toStatus: Dataset["status"],
  at: string,
  reviewNote?: string,
): InternalWorkflowEvent {
  return {
    id: `${slug}-${at}-${toStatus}`.toLowerCase(),
    slug,
    actor,
    actorName,
    actorRole,
    at,
    fromStatus,
    toStatus,
    persistedTo: "mock-api",
    reviewNote,
  };
}


function buildOrganizations(): InternalOrganization[] {
  const entries = opdDirectory as any[];
  
  const mapped = entries
    .filter((entry) => entry.name && entry.name.trim())
    .map((entry, index) => {
      const name = entry.name.trim();
      const slug = slugify(name);
      
      // Map legacy IDs to match existing accounts & guard checks
      let id = `opd-${slug}`;
      let shortName = name;
      let category = "Layanan Teknis";
      
      if (name.includes("Kependudukan")) {
        id = "opd-disdukcapil";
        shortName = "Disdukcapil";
        category = "Layanan Dasar";
      } else if (name.includes("Kesehatan")) {
        id = "opd-dinkes";
        shortName = "Dinas Kesehatan";
        category = "Layanan Dasar";
      } else if (name.includes("Pendidikan")) {
        id = "opd-dikbud";
        shortName = "Dinas Pendidikan";
        category = "Layanan Dasar";
      } else if (name.includes("Koperasi") || name.includes("UMKM")) {
        id = "opd-koperasi";
        shortName = "Dinas Koperasi & UKM";
        category = "Perekonomian";
      } else if (name.includes("Lingkungan Hidup")) {
        id = "opd-dlh";
        shortName = "DLH";
        category = "Infrastruktur";
      } else if (name.includes("Sosial")) {
        id = "opd-dinsos";
        shortName = "Dinas Sosial";
        category = "Layanan Dasar";
      } else if (name.includes("Pertanian")) {
        id = "opd-pertanian";
        shortName = "Dinas Pertanian";
        category = "Perekonomian";
      } else if (name.includes("Perencanaan") || name.includes("Bappeda")) {
        id = "opd-bappedalitbang";
        shortName = "Bappeda Litbang";
        category = "Perencanaan";
      } else if (name.includes("Komunikasi") || name.includes("DKIP")) {
        id = "opd-dkip";
        shortName = "DKIP";
        category = "Layanan Teknis";
      } else if (name.includes("Perumahan Rakyat") || name.includes("Kawasan Permukiman")) {
        id = "opd-pupr";
        shortName = "Dinas PUPR";
        category = "Infrastruktur";
      }
      
      return {
        id,
        slug,
        name,
        shortName,
        category,
        leadName: "Kepala Instansi",
        leadTitle: "Kepala",
        email: entry.email?.trim() || `${slug}@bulungankab.go.id`,
        phone: entry.phone?.trim() || entry.whatsapp?.trim() || "-",
        datasetTarget: 10,
        status: "Aktif" as const,
        lastUpdated: new Date().toISOString(),
      };
    });

  // Ensure BPS exists
  const hasBps = mapped.some((org) => org.id === "opd-bps");
  if (!hasBps) {
    mapped.push({
      id: "opd-bps",
      slug: "bps",
      name: "Badan Pusat Statistik Kabupaten Bulungan",
      shortName: "BPS Bulungan",
      category: "Statistik",
      leadName: "Kepala BPS",
      leadTitle: "Kepala",
      email: "bps@bps.go.id",
      phone: "-",
      datasetTarget: 15,
      status: "Aktif",
      lastUpdated: new Date().toISOString(),
    });
  }

  const seenIds = new Set<string>();
  return mapped.filter((org) => {
    if (seenIds.has(org.id)) return false;
    seenIds.add(org.id);
    return true;
  });
}

function buildUsers(): InternalUser[] {
  const baseUsers: InternalUser[] = [
    {
      id: "user-sekretariat",
      username: "sekretariat.bappeda",
      password: "bulunganbisa",
      name: "Koordinator Sekretariat",
      email: "sekretariat@bulungankab.go.id",
      phone: "0811-5400-001",
      role: "sekretariat",
      title: "Koordinator Sekretariat Satu Data",
      organizationId: "opd-bappedalitbang",
      avatar: "female",
      permissions: getRolePermissions("sekretariat"),
      status: "Aktif",
    },
    {
      id: "user-walidata",
      username: "walidata.dkip",
      password: "bulunganbisa",
      name: "Walidata DKIP",
      email: "walidata@bulungankab.go.id",
      phone: "0811-5400-002",
      role: "walidata",
      title: "Koordinator Walidata",
      organizationId: "opd-dkip",
      avatar: "male",
      permissions: getRolePermissions("walidata"),
      status: "Aktif",
    },
    {
      id: "user-pembina",
      username: "pembina.bps",
      password: "bulunganbisa",
      name: "Pembina Data BPS",
      email: "pembina@bps.go.id",
      phone: "0811-5400-003",
      role: "pembina",
      title: "Pembina Data",
      organizationId: "opd-bps",
      avatar: "male",
      permissions: getRolePermissions("pembina"),
      status: "Aktif",
    },
  ];

  const organizations = buildOrganizations();
  const produsenUsers = organizations.map((org, index) => {
    const slug = org.slug;
    return {
      id: `user-operator-${slug}`,
      username: `operator.${slug}`,
      password: "bulunganbisa",
      name: `Operator ${org.shortName}`,
      email: `operator.${slug}@bulungankab.go.id`,
      phone: `0811-5400-${200 + index}`,
      role: "produsen" as const,
      title: `Produsen Data ${org.shortName}`,
      organizationId: org.id,
      avatar: index % 2 === 0 ? ("male" as const) : ("female" as const),
      permissions: getRolePermissions("produsen"),
      status: "Aktif" as const,
    };
  });

  return [...baseUsers, ...produsenUsers];
}

function buildBaseWorkflow(
  slug: string,
  actor: string,
  actorName: string,
  actorRole: InternalRole,
  toStatus: Dataset["status"],
  at: string,
  note: string,
): InternalWorkflowEvent[] {
  return [toInternalWorkflowEvent(slug, actor, actorName, actorRole, "None", toStatus, at, note)];
}

function buildInternalDataset(
  dataset: Dataset,
  organizationId: string,
  ownerUserId: string,
  walidataUserId: string,  
): InternalDataset {
  const createdAt = dataset.lastUpdated.includes("T")
    ? dataset.lastUpdated
    : `${dataset.lastUpdated}T08:00:00.000Z`;
  return {
    ...dataset,
    organizationId,
    ownerUserId,
    walidataUserId,
    createdAt,
    updatedByUserId: ownerUserId,
    metadataScore: 92,
    qualityScore: 89,
    completionScore: 94,
    submissionCount: dataset.status === "Published" ? 1 : 0,
    revisionCount: 0,
    reviewSummary: "Metadata lengkap dan resource dapat dibaca.",
    featuredOnHome: dataset.status === "Published",
    workflowHistory: buildBaseWorkflow(
      dataset.slug,
      ownerUserId,
      ownerUserId,
      "produsen",
      dataset.status,
      createdAt,
      "Dataset awal dimuat dari seed portal.",
    ),
  };
}

function cloneDataset(
  source: Dataset,
  overrides: Partial<InternalDataset> & {
    slug: string;
    title: string;
    organizationId: string;
    ownerUserId: string;
    walidataUserId: string;
    status: Dataset["status"];
    lastUpdated: string;
    topic: string;
    organization: string;
    period: string;
    reviewSummary: string;
    tags?: string[];
    resourceName?: string;
    resourceFormat?: Dataset["formats"][number];
    resourceUrl?: string;
  },
): InternalDataset {
  const [format = "CSV"] = source.formats;
  const history = buildBaseWorkflow(
    overrides.slug,
    overrides.ownerUserId,
    overrides.ownerUserId,
    "produsen",
    overrides.status,
    overrides.lastUpdated,
    "Dataset seed internal disiapkan untuk simulasi workflow.",
  );

  return {
    ...source,
    id: overrides.id ?? source.id.replace("BLG", "INT"),
    slug: overrides.slug,
    title: overrides.title,
    summary: overrides.summary ?? source.summary,
    description: overrides.description ?? source.description,
    topic: overrides.topic,
    organization: overrides.organization,
    status: overrides.status,
    lastUpdated: overrides.lastUpdated,
    frequency: overrides.frequency ?? source.frequency,
    formats: overrides.formats ?? source.formats,
    metadata: {
      ...source.metadata,
      identifier: overrides.id ?? `${source.id}-INT`,
      opd: overrides.organization,
      walidata: "DKIP / Walidata",
      status: overrides.status,
      period: overrides.period,
      lastUpdated: overrides.lastUpdated,
      tags: overrides.tags ?? source.metadata.tags,
    },
    resources: [
      {
        id: `${overrides.slug}-resource-main`,
        name: overrides.resourceName ?? `${overrides.slug}.${format.toLowerCase()}`,
        description: `Resource utama ${overrides.title}`,
        format: overrides.resourceFormat ?? format,
        url: overrides.resourceUrl ?? `/api/mock/resources/${overrides.slug}/${format.toLowerCase()}`,
        sizeLabel: formatSizeLabel(overrides.resourceFormat ?? format),
        lastUpdated: overrides.lastUpdated,
      },
      {
        id: `${overrides.slug}-resource-api`,
        name: `package_show?id=${overrides.slug}`,
        description: "Metadata API internal",
        format: "API",
        url: `/api/3/action/package_show?id=${overrides.slug}`,
        sizeLabel: "JSON",
        lastUpdated: overrides.lastUpdated,
      },
    ],
    organizationId: overrides.organizationId,
    ownerUserId: overrides.ownerUserId,
    walidataUserId: overrides.walidataUserId,
    createdAt: overrides.createdAt ?? overrides.lastUpdated,
    updatedByUserId: overrides.updatedByUserId ?? overrides.ownerUserId,
    metadataScore: overrides.metadataScore ?? 86,
    qualityScore: overrides.qualityScore ?? 82,
    completionScore: overrides.completionScore ?? 88,
    submissionCount: overrides.submissionCount ?? (overrides.status === "Published" ? 1 : 0),
    revisionCount: overrides.revisionCount ?? (overrides.status === "Need Revision" ? 1 : 0),
    reviewSummary: overrides.reviewSummary,
    internalNote: overrides.internalNote,
    publishedAt: overrides.status === "Published" ? overrides.lastUpdated : undefined,
    archivedAt: overrides.status === "Archived" ? overrides.lastUpdated : undefined,
    archiveReason: overrides.archiveReason,
    featuredOnHome: overrides.featuredOnHome ?? false,
    workflowHistory: overrides.workflowHistory ?? history,
    preview: overrides.preview ?? source.preview,
    relatedSlugs: overrides.relatedSlugs ?? source.relatedSlugs,
    popularityScore: overrides.popularityScore ?? source.popularityScore,
    viewCount: overrides.viewCount ?? source.viewCount,
    downloadCount: overrides.downloadCount ?? source.downloadCount,
  };
}

function buildTopics(organizations: InternalOrganization[]): InternalTopicReference[] {
  const stewardBySlug = new Map(organizations.map((item) => [item.slug, item.id]));
  return [
    {
      id: "topic-kependudukan",
      slug: "kependudukan",
      name: "Kependudukan",
      code: "TOP-001",
      stewardOrganizationId: stewardBySlug.get("disdukcapil") ?? "opd-disdukcapil",
      description: "Topik data kependudukan, sosial, dan kepesertaan layanan publik.",
      recommendedFormat: "CSV",
      defaultFrequency: "Tahunan",
      status: "Aktif",
    },
    {
      id: "topic-kesehatan",
      slug: "kesehatan",
      name: "Kesehatan",
      code: "TOP-002",
      stewardOrganizationId: stewardBySlug.get("dinas-kesehatan") ?? "opd-dinkes",
      description: "Referensi data fasilitas kesehatan, tenaga medis, dan capaian layanan.",
      recommendedFormat: "XLSX",
      defaultFrequency: "Bulanan",
      status: "Aktif",
    },
    {
      id: "topic-pendidikan",
      slug: "pendidikan",
      name: "Pendidikan",
      code: "TOP-003",
      stewardOrganizationId: stewardBySlug.get("dinas-pendidikan") ?? "opd-dikbud",
      description: "Master data pendidikan dan indikator pembelajaran.",
      recommendedFormat: "CSV",
      defaultFrequency: "Semesteran",
      status: "Aktif",
    },
    {
      id: "topic-ekonomi",
      slug: "ekonomi",
      name: "Ekonomi",
      code: "TOP-004",
      stewardOrganizationId: stewardBySlug.get("dinas-koperasi-ukm") ?? "opd-koperasi",
      description: "Data ekonomi daerah, UMKM, perdagangan, dan ketahanan pangan.",
      recommendedFormat: "CSV",
      defaultFrequency: "Triwulanan",
      status: "Aktif",
    },
    {
      id: "topic-infrastruktur",
      slug: "infrastruktur",
      name: "Infrastruktur",
      code: "TOP-005",
      stewardOrganizationId: stewardBySlug.get("dinas-pupr") ?? "opd-pupr",
      description: "Referensi infrastruktur, jalan, jembatan, dan aset layanan dasar.",
      recommendedFormat: "XLSX",
      defaultFrequency: "Tahunan",
      status: "Review",
    },
  ];
}

function buildSettings(): PortalSettings {
  return {
    portalName: "Satu Data Bulungan",
    publicEmail: "satudata@bulungankab.go.id",
    publicPhone: "(0552) 22001",
    heroHeadline: "Portal Data Terpadu Kabupaten Bulungan",
    heroSubheadline: "Menyatukan dataset sektoral, metadata, dan publikasi lintas OPD dalam satu alur kerja yang terpantau.",
    footerNote: "Kelola data lebih cepat, konsisten, dan siap dipublikasikan.",
    highlightDatasetSlugs: [
      "jumlah-penduduk-bulungan-2023-2025",
      "peta-sebaran-fasilitas-kesehatan",
      "data-sekolah-dan-peserta-didik",
    ],
    notificationBanner: "Perbarui metadata minimum sebelum mengajukan dataset ke walidata.",
    defaultWalidataUserId: "user-walidata",
  };
}

function buildSeedStore(): InternalPortalStore {
  const organizations = buildOrganizations();
  const users = buildUsers();
  const datasets: InternalDataset[] = [];
  const topics = buildTopics(organizations);

  const notifications: InternalNotification[] = [
    {
      id: "notif-1",
      title: "Dataset baru menunggu review",
      message: "Cakupan Imunisasi Balita 2026 baru saja diajukan dan menunggu verifikasi walidata.",
      type: "review",
      createdAt: "2026-04-22T08:35:00.000Z",
      link: "/internal/workflow",
      targetRoles: ["sekretariat", "walidata"],
      readByUserIds: [],
    },
    {
      id: "notif-2",
      title: "Revisi diminta",
      message: "Rekap Partisipasi Sekolah Menengah 2026 perlu melengkapi metodologi indikator.",
      type: "warning",
      createdAt: "2026-04-21T14:05:00.000Z",
      link: "/internal/datasets/rekap-partisipasi-sekolah-menengah-2026",
      targetRoles: ["produsen"],
      userId: "user-operator-dikbud",
      readByUserIds: [],
    },
    {
      id: "notif-3",
      title: "Publikasi siap dijadwalkan",
      message: "Indikator Kemantapan Jalan 2026 telah approved dan dapat dipublikasikan.",
      type: "success",
      createdAt: "2026-04-22T09:50:00.000Z",
      link: "/internal/workflow",
      targetRoles: ["sekretariat", "walidata"],
      readByUserIds: [],
    },
    {
      id: "notif-4",
      title: "Pengingat metadata",
      message: "Pastikan seluruh resource memiliki deskripsi yang jelas sebelum submit review.",
      type: "info",
      createdAt: "2026-04-22T06:30:00.000Z",
      link: "/internal/help",
      targetRoles: ["produsen"],
      readByUserIds: [],
    },
  ];

  const auditLogs: InternalAuditLog[] = [];

  return {
    version: STORE_VERSION,
    lastUpdated: new Date().toISOString(),
    datasets,
    users,
    organizations,
    topics,
    notifications,
    auditLogs,
    settings: buildSettings(),
    publications: [],
  };
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path: string, payload: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildSession(user: InternalUser, organizations: InternalOrganization[]): InternalSession {
  const organization = organizations.find((item) => item.id === user.organizationId);

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    title: user.title,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: organization?.shortName ?? organization?.name ?? "Walidata",
  };
}

function attachLegacyWorkflowEvents(dataset: InternalDataset, events: LegacyWorkflowEvent[]): InternalDataset {
  const mapped = events.map((event) =>
    toInternalWorkflowEvent(
      dataset.slug,
      event.actor,
      event.actor,
      dataset.ownerUserId.startsWith("user-walidata") ? "walidata" : "produsen",
      event.fromStatus,
      event.toStatus,
      event.at,
      event.reviewNote,
    ),
  );

  return {
    ...dataset,
    status: mapped[mapped.length - 1]?.toStatus ?? dataset.status,
    lastUpdated: mapped[mapped.length - 1]?.at ?? dataset.lastUpdated,
    workflowHistory: [...dataset.workflowHistory, ...mapped],
  };
}

async function bootstrapFromLegacyFiles(store: InternalPortalStore): Promise<InternalPortalStore> {
  return store;
}

export async function loadInternalPortalStore(): Promise<InternalPortalStore> {
  const storePath = getStorePath();
  const existing = await readJsonFile<InternalPortalStore | null>(storePath, null);

  let loaded: InternalPortalStore;
  if (existing?.version === STORE_VERSION) {
    loaded = existing;
  } else {
    loaded = await bootstrapFromLegacyFiles(buildSeedStore());
    await writeJsonFile(storePath, loaded);
  }

  // Normalize legacy roles (admin→sekretariat, operator/operator_opd→produsen)
  let dirty = false;
  if (loaded) {
    if (Array.isArray(loaded.users)) {
      for (const user of loaded.users) {
        const normalized = normalizeInternalRole(user.role as string);
        if (normalized !== user.role) {
          user.role = normalized;
          dirty = true;
        }
        // Normalize legacy permissions to action-based
        if (Array.isArray(user.permissions) && user.permissions.length > 0) {
          const hasLegacy = user.permissions.some((p: string) =>
            !p.includes("."),
          );
          if (hasLegacy) {
            user.permissions = getRolePermissions(user.role);
            dirty = true;
          }
        }
      }
    }
    if (Array.isArray(loaded.datasets)) {
      for (const dataset of loaded.datasets) {
        // Normalize legacy dataset status
        const normalizedStatus = normalizeDatasetStatus(dataset.status as string);
        if (normalizedStatus !== dataset.status) {
          dataset.status = normalizedStatus;
          dirty = true;
        }
        if (Array.isArray(dataset.workflowHistory)) {
          for (const event of dataset.workflowHistory) {
            const normalized = normalizeInternalRole(event.actorRole as string);
            if (normalized !== event.actorRole) {
              event.actorRole = normalized;
              dirty = true;
            }
            // Normalize legacy status in workflow events
            const normalizedTo = normalizeDatasetStatus(event.toStatus as string);
            if (normalizedTo !== event.toStatus) {
              event.toStatus = normalizedTo;
              dirty = true;
            }
          }
        }
      }
    }
    if (Array.isArray(loaded.auditLogs)) {
      for (const log of loaded.auditLogs) {
        const normalized = normalizeInternalRole(log.actorRole as string);
        if (normalized !== log.actorRole) {
          log.actorRole = normalized;
          dirty = true;
        }
      }
    }
    if (Array.isArray(loaded.notifications)) {
      for (const notif of loaded.notifications) {
        if (Array.isArray(notif.targetRoles)) {
          notif.targetRoles = notif.targetRoles.map(
            (r) => normalizeInternalRole(r as string),
          );
        }
      }
    }
    if (dirty) {
      await writeJsonFile(storePath, loaded);
    }
  }

  return loaded;
}

export async function saveInternalPortalStore(store: InternalPortalStore): Promise<void> {
  await writeJsonFile(getStorePath(), {
    ...store,
    version: STORE_VERSION,
    lastUpdated: new Date().toISOString(),
  });
}

export async function withInternalPortalStore<T>(
  mutator: (store: InternalPortalStore) => Promise<{ store: InternalPortalStore; result: T }> | { store: InternalPortalStore; result: T },
): Promise<T> {
  const store = await loadInternalPortalStore();
  const output = await mutator(store);
  await saveInternalPortalStore(output.store);
  return output.result;
}

export async function authenticateInternalUser(
  username: string,
  password: string,
): Promise<InternalSession | null> {
  const store = await loadInternalPortalStore();
  const user = store.users.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password && item.status === "Aktif",
  );

  if (!user) {
    return null;
  }

  user.lastLoginAt = new Date().toISOString();
  await saveInternalPortalStore(store);
  return buildSession(user, store.organizations);
}

export async function getInternalUserBySession(session: InternalSession): Promise<InternalUser | null> {
  const store = await loadInternalPortalStore();
  return store.users.find((user) => user.id === session.userId) ?? null;
}

export async function getInternalStoreForSession(session: InternalSession): Promise<{
  store: InternalPortalStore;
  user: InternalUser;
}> {
  const store = await loadInternalPortalStore();
  const user = store.users.find((item) => item.id === session.userId);
  if (!user) {
    throw new Error("Sesi internal tidak lagi valid.");
  }

  return { store, user };
}

export function isSameOrgId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const normA = a.toLowerCase();
  const normB = b.toLowerCase();

  if (normA === normB) return true;

  const keywords = [
    ["dukcapil", "disdukcapil", "kependudukan"],
    ["kesehatan", "dinkes"],
    ["pendidikan", "dikbud", "disdik"],
    ["koperasi"],
    ["pupr", "pekerjaan-umum"],
    ["dlh", "lingkungan-hidup"],
    ["sosial", "dinsos"],
    ["pertanian"],
    ["bappeda", "litbang", "bappedalitbang"],
    ["dkip", "kominfo", "walidata"],
  ];

  for (const group of keywords) {
    const matchA = group.some((kw) => normA.includes(kw));
    const matchB = group.some((kw) => normB.includes(kw));
    if (matchA && matchB) {
      return true;
    }
  }

  return false;
}

export function getScopedDatasets(store: InternalPortalStore, session: InternalSession): InternalDataset[] {
  if (hasPermission(session, "dataset.view_all")) {
    return [...store.datasets];
  }

  return store.datasets.filter(
    (dataset) => isSameOrgId(dataset.organizationId, session.organizationId) || dataset.ownerUserId === session.userId,
  );
}

export function getScopedPublications(store: InternalPortalStore, session: InternalSession): InternalPublication[] {
  if (hasPermission(session, "content.view_all")) {
    return store.publications ? [...store.publications] : [];
  }

  return (store.publications || []).filter(
    (pub) => isSameOrgId(pub.organizationId, session.organizationId) || pub.createdByUserId === session.userId,
  );
}

export function getScopedNotifications(
  store: InternalPortalStore,
  session: InternalSession,
): InternalNotification[] {
  return store.notifications.filter(
    (notification) =>
      notification.targetRoles.includes(session.role) &&
      (!notification.userId || notification.userId === session.userId),
  );
}

export function getScopedAuditLogs(store: InternalPortalStore, session: InternalSession): InternalAuditLog[] {
  if (hasPermission(session, "audit.view_all")) {
    return [...store.auditLogs];
  }

  return store.auditLogs.filter((item) => isSameOrgId(item.organizationId, session.organizationId));
}

export function buildWorkflowItems(
  datasets: InternalDataset[],
): WorkflowItem[] {
  return datasets
    .map((dataset) => ({
      id: dataset.id,
      slug: dataset.slug,
      title: dataset.title,
      organization: dataset.organization,
      status: dataset.status,
      lastUpdated: dataset.lastUpdated,
      resourceCount: dataset.resources.length,
      reviewNote: dataset.reviewSummary,
      auditTrail: dataset.workflowHistory.map((event) => ({
        slug: event.slug,
        actor: event.actorName,
        at: event.at,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        persistedTo: event.persistedTo,
        reviewNote: event.reviewNote,
      })),
    }))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
}

function filterDatasets(datasets: Dataset[], filters: DatasetFilters = {}): Dataset[] {
  const q = (filters.q ?? "").trim().toLowerCase();

  return datasets.filter((dataset) => {
    const searchArea = `${dataset.title} ${dataset.summary} ${dataset.organization} ${dataset.topic} ${dataset.metadata.tags.join(" ")}`.toLowerCase();
    const searchPass = q.length === 0 || searchArea.includes(q);
    const topicPass = !filters.topic || matchesHomepageTopicFilter(dataset, filters.topic);
    const organizationPass = !filters.organization || dataset.organization === filters.organization;
    const formatPass = !filters.format || dataset.formats.includes(filters.format as Dataset["formats"][number]);
    const frequencyPass = !filters.frequency || dataset.frequency === filters.frequency;
    const statusPass = !filters.status || dataset.status === filters.status;
    const yearPass =
      !filters.year ||
      dataset.lastUpdated.startsWith(filters.year) ||
      dataset.metadata.period.includes(filters.year);
    const tagPass =
      !filters.tag ||
      dataset.metadata.tags.some((tag) => tag.toLowerCase() === filters.tag?.toLowerCase());

    return (
      searchPass &&
      topicPass &&
      organizationPass &&
      formatPass &&
      frequencyPass &&
      statusPass &&
      yearPass &&
      tagPass
    );
  });
}

function sortDatasets(datasets: Dataset[], sort: DatasetSort = defaultSort): Dataset[] {
  if (sort === "az") {
    return [...datasets].sort((a, b) => a.title.localeCompare(b.title, "id-ID"));
  }

  if (sort === "populer") {
    return [...datasets].sort((a, b) => b.popularityScore - a.popularityScore);
  }

  return [...datasets].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
}

function buildFilterOptions(datasets: Dataset[]): DatasetFilterOptions {
  const countOccurrences = (values: string[]) => {
    const map = new Map<string, number>();
    values.forEach((v) => {
      if (!v) return;
      map.set(v, (map.get(v) || 0) + 1);
    });
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "id-ID"));
  };

  const years = countOccurrences(
    datasets.flatMap((item) => {
      const fromUpdated = item.lastUpdated.slice(0, 4);
      const fromPeriod = item.metadata.period.match(/\d{4}/g) ?? [];
      return [fromUpdated, ...fromPeriod];
    }),
  ).filter((item) => /^\d{4}$/.test(item.value));

  return {
    topics: countOccurrences(datasets.map((item) => item.topic)),
    organizations: countOccurrences(datasets.map((item) => item.organization)),
    formats: countOccurrences(datasets.flatMap((item) => item.formats)),
    frequencies: countOccurrences(datasets.map((item) => item.frequency)),
    statuses: [...new Set(datasets.map((item) => item.status))],
    years: years.length > 0 ? years : [],
    tags: countOccurrences(datasets.flatMap((item) => item.metadata.tags)),
  };
}

export async function listPublicDatasets(filters: DatasetFilters = {}): Promise<Dataset[]> {
  const store = await loadInternalPortalStore();
  const datasets = store.datasets.filter((dataset) => dataset.status === "Published");
  return sortDatasets(filterDatasets(datasets, filters), filters.sort ?? defaultSort);
}

export async function getPublicDatasetBySlug(slug: string): Promise<Dataset | null> {
  const store = await loadInternalPortalStore();
  return store.datasets.find((dataset) => dataset.slug === slug && dataset.status === "Published") ?? null;
}

export async function getPublicFilterOptions(): Promise<DatasetFilterOptions> {
  const store = await loadInternalPortalStore();
  return buildFilterOptions(store.datasets.filter((dataset) => dataset.status === "Published"));
}

export async function getPublicPortalStats(): Promise<PortalStats> {
  const store = await loadInternalPortalStore();
  const datasets = store.datasets.filter((dataset) => dataset.status === "Published");
  const resourceCount = datasets.reduce((acc, item) => acc + item.resources.length, 0);
  const completeMetadata = datasets.filter((item) => item.metadata.tags.length > 0).length;

  return {
    datasetCount: datasets.length,
    organizationCount: new Set(datasets.map((item) => item.organization)).size,
    resourceCount,
    metadataCompletionRate: datasets.length ? Math.round((completeMetadata / datasets.length) * 100) : 0,
  };
}

export async function getInternalDatasetBySlug(
  slug: string,
  session: InternalSession,
): Promise<InternalDataset | null> {
  const { store } = await getInternalStoreForSession(session);
  const dataset = store.datasets.find((item) => item.slug === slug) ?? null;

  if (!dataset) {
    return null;
  }

  if (hasPermission(session, "dataset.view_all")) {
    return dataset;
  }

  return isSameOrgId(dataset.organizationId, session.organizationId) ? dataset : null;
}

function ensureDatasetWriteAccess(dataset: InternalDataset, session: InternalSession): void {
  // Walidata can write any dataset via dataset.edit_metadata
  if (hasPermission(session, "dataset.edit_metadata") && hasPermission(session, "dataset.view_all")) {
    return;
  }

  // Produsen can write own org's datasets
  if (hasPermission(session, "dataset.edit_draft_own_opd") && isSameOrgId(dataset.organizationId, session.organizationId)) {
    return;
  }

  throw new Error("Anda tidak memiliki akses untuk mengubah dataset ini.");
}

function ensureTransitionAccess(
  session: InternalSession,
  fromStatus: Dataset["status"],
  toStatus: Dataset["status"],
): void {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`Transisi ${fromStatus} -> ${toStatus} tidak diperbolehkan.`);
  }

  // Map transitions to permission checks
  if (toStatus === "Submitted" && hasPermission(session, "dataset.submit")) {
    return;
  }
  if (toStatus === "Under Review" && hasPermission(session, "dataset.review")) {
    return;
  }
  if (toStatus === "Need Revision" && hasPermission(session, "dataset.request_revision")) {
    return;
  }
  if (toStatus === "Approved" && hasPermission(session, "dataset.approve")) {
    return;
  }
  if (toStatus === "Published" && hasPermission(session, "dataset.publish")) {
    return;
  }
  if (toStatus === "Archived" && hasPermission(session, "dataset.archive")) {
    return;
  }

  throw new Error("Peran Anda tidak memiliki izin untuk transisi workflow ini.");
}

function buildDatasetResource(
  slug: string,
  name: string,
  format: Dataset["formats"][number],
  url: string,
  updatedAt: string,
): InternalDataset["resources"] {
  return [
    {
      id: `${slug}-resource-main`,
      name,
      description: "Resource utama dataset",
      format,
      url,
      sizeLabel: formatSizeLabel(format),
      lastUpdated: updatedAt,
    },
    {
      id: `${slug}-resource-api`,
      name: `package_show?id=${slug}`,
      description: "Metadata API internal",
      format: "API",
      url: `/api/3/action/package_show?id=${slug}`,
      sizeLabel: "JSON",
      lastUpdated: updatedAt,
    },
  ];
}

function appendAudit(
  store: InternalPortalStore,
  dataset: InternalDataset,
  session: InternalSession,
  action: string,
  summary: string,
  severity: InternalAuditLog["severity"],
): InternalPortalStore {
  return {
    ...store,
    auditLogs: [
      {
        id: `${dataset.slug}-${Date.now()}-${action}`.toLowerCase(),
        module: "dataset",
        action,
        summary,
        createdAt: new Date().toISOString(),
        actorUserId: session.userId,
        actorName: session.name,
        actorRole: session.role,
        severity,
        datasetSlug: dataset.slug,
        organizationId: dataset.organizationId,
      },
      ...store.auditLogs,
    ],
  };
}

function pushNotification(
  store: InternalPortalStore,
  title: string,
  message: string,
  link: string,
  targetRoles: InternalRole[],
  userId?: string,
): InternalPortalStore {
  return {
    ...store,
    notifications: [
      {
        id: `notif-${Date.now()}-${slugify(title)}`,
        title,
        message,
        type: targetRoles.includes("walidata") ? "review" : "info",
        createdAt: new Date().toISOString(),
        link,
        targetRoles,
        userId,
        readByUserIds: [],
      },
      ...store.notifications,
    ],
  };
}

export async function createInternalDatasetDraft(
  input: DatasetDraftInput,
  session: InternalSession,
): Promise<{ slug: string; persistedTo: "mock-api"; createdAt: string }> {
  return withInternalPortalStore(async (store) => {
    const requestedOrganization =
      store.organizations.find(
        (item) =>
          item.slug === input.ownerOrgSlug ||
          item.shortName === input.organization ||
          item.name === input.organization ||
          item.id === input.organization ||
          isSameOrgId(item.slug, input.ownerOrgSlug) ||
          isSameOrgId(item.shortName, input.organization) ||
          isSameOrgId(item.name, input.organization) ||
          isSameOrgId(item.id, input.organization),
      ) ?? null;
    const sessionOrganization =
      store.organizations.find(
        (item) =>
          item.id === session.organizationId ||
          isSameOrgId(item.id, session.organizationId) ||
          isSameOrgId(item.slug, session.organizationId) ||
          isSameOrgId(item.shortName, session.organizationId) ||
          isSameOrgId(item.name, session.organizationId),
      ) ?? store.organizations[0];

    if (
      !hasPermission(session, "dataset.view_all") &&
      requestedOrganization &&
      !isSameOrgId(requestedOrganization.id, session.organizationId)
    ) {
      throw new Error("Anda hanya boleh membuat draft untuk organisasi sendiri.");
    }

    const organization =
      !hasPermission(session, "dataset.view_all")
        ? sessionOrganization
        : requestedOrganization ?? sessionOrganization;

    if (store.datasets.some((item) => item.slug === input.slug)) {
      throw new Error(`Draft dengan slug '${input.slug}' sudah ada.`);
    }

    const topic = store.topics.find((item) => item.name === input.topic || item.slug === slugify(input.topic));
    const now = new Date().toISOString();
    const walidataUserId =
      store.users.find((item) => item.id === store.settings.defaultWalidataUserId)?.id ??
      pickUserIdByRole(store.users, "walidata");

    const workflowHistory = [
      toInternalWorkflowEvent(
        input.slug,
        session.username,
        session.name,
        session.role,
        "None",
        "Draft",
        now,
        "Draft dibuat dari halaman internal.",
      ),
    ];

    const safeTitle = sanitizeStoredText(input.title);
    const safeSummary = sanitizeStoredText(input.summary);
    const safeDescription = sanitizeStoredText(input.description?.trim() || "") || safeSummary;
    const safeTopic = sanitizeStoredText(input.topic);
    const safeOrganizationName = sanitizeStoredText(input.organization);
    const safeCoverage = sanitizeStoredText(input.coverage?.trim() || "") || "Kabupaten Bulungan";
    const safePeriod = sanitizeStoredText(input.period);
    const safeResourceName = sanitizeStoredText(input.resourceName);
    const tags = [slugify(safeTopic), slugify(safeOrganizationName), "draft-internal"].filter(Boolean);
    const dataset: InternalDataset = {
      id: `INT-${slugify(input.slug)}`.toUpperCase(),
      slug: input.slug,
      title: safeTitle,
      summary: safeSummary,
      description: safeDescription,
      topic: topic?.name ?? safeTopic,
      organization: organization.shortName,
      organizationId: organization.id,
      ownerUserId: session.userId,
      walidataUserId,
      createdAt: now,
      updatedByUserId: session.userId,
      formats: [input.resourceFormat, "API"],
      frequency: input.frequency,
      status: "Draft",
      lastUpdated: now,
      metadata: {
        identifier: `INT-${input.slug}`.toUpperCase(),
        opd: organization.shortName,
        walidata: store.users.find((item) => item.id === walidataUserId)?.name ?? "Walidata",
        coverage: safeCoverage,
        period: safePeriod,
        license: "Data Terbuka Pemerintah",
        status: "Draft",
        frequency: input.frequency,
        lastUpdated: now,
        tags,
      },
      resources: input.resources ?? buildDatasetResource(input.slug, safeResourceName, input.resourceFormat, input.resourceUrl, now),
      preview: input.preview ?? {
        points: [
          { label: "Jan", value: 12 },
          { label: "Feb", value: 16 },
          { label: "Mar", value: 21 },
          { label: "Apr", value: 18 },
        ],
        rows: [
          { area: "Tanjung Selor", male: 110, female: 106, total: 216 },
          { area: "Tanjung Palas", male: 91, female: 95, total: 186 },
        ],
        insights: [
          { label: "Status", value: "Draft", description: "Preview awal untuk validasi internal." },
          { label: "Topik", value: topic?.code ?? "TOP-NEW", description: "Topik referensi internal diterapkan." },
          { label: "Sumber", value: organization.shortName, description: "Dataset dimiliki oleh OPD pembuat draft." },
        ],
      },
      relatedSlugs: store.datasets
        .filter((item) => item.topic === (topic?.name ?? safeTopic))
        .slice(0, 2)
        .map((item) => item.slug),
      popularityScore: 12,
      viewCount: 0,
      downloadCount: 0,
      metadataScore: 72,
      qualityScore: 70,
      completionScore: 74,
      submissionCount: 0,
      revisionCount: 0,
      reviewSummary: "Draft baru dibuat dan belum diajukan ke walidata.",
      workflowHistory,
      featuredOnHome: false,
    };

    let nextStore: InternalPortalStore = {
      ...store,
      datasets: [dataset, ...store.datasets],
    };
    nextStore = appendAudit(
      nextStore,
      dataset,
      session,
      "create_draft",
      `Draft dataset ${dataset.title} dibuat oleh ${session.name}.`,
      "info",
    );
    nextStore = pushNotification(
      nextStore,
      "Draft baru dibuat",
      `${dataset.title} dibuat dan siap dilengkapi sebelum submit review.`,
      `/internal/datasets/${dataset.slug}`,
      ["sekretariat", "walidata", "produsen"],
      session.userId,
    );

    return {
      store: nextStore,
      result: {
        slug: dataset.slug,
        persistedTo: "mock-api",
        createdAt: now,
      },
    };
  });
}

export async function updateInternalDataset(
  slug: string,
  input: DatasetUpdateInput,
  session: InternalSession,
): Promise<{ slug: string; updatedAt: string }> {
  return withInternalPortalStore(async (store) => {
    const index = store.datasets.findIndex((item) => item.slug === slug);
    if (index < 0) {
      throw new Error("Dataset tidak ditemukan.");
    }

    const current = store.datasets[index];
    ensureDatasetWriteAccess(current, session);

    const organization = store.organizations.find((item) => item.id === input.organizationId) ?? store.organizations[0];
    const updatedAt = new Date().toISOString();
    const safeTitle = sanitizeStoredText(input.title);
    const safeSummary = sanitizeStoredText(input.summary);
    const safeDescription = sanitizeStoredText(input.description);
    const safeTopic = sanitizeStoredText(input.topic);
    const safeWalidata = sanitizeStoredText(input.walidata);
    const safeCoverage = sanitizeStoredText(input.coverage);
    const safePeriod = sanitizeStoredText(input.period);
    const safeResourceName = sanitizeStoredText(input.resourceName);
    const safeTags = input.tags.map((item) => sanitizeStoredText(item)).filter(Boolean);

    const updated: InternalDataset = {
      ...current,
      title: safeTitle,
      summary: safeSummary,
      description: safeDescription,
      topic: safeTopic,
      organization: organization.shortName,
      organizationId: organization.id,
      frequency: input.frequency,
      lastUpdated: updatedAt,
      updatedByUserId: session.userId,
      formats: [input.resourceFormat, "API"],
      resources: input.resources ?? buildDatasetResource(
        current.slug,
        safeResourceName,
        input.resourceFormat,
        input.resourceUrl,
        updatedAt,
      ),
      preview: input.preview ?? current.preview,
      metadata: {
        ...current.metadata,
        opd: organization.shortName,
        walidata: safeWalidata,
        coverage: safeCoverage,
        period: safePeriod,
        frequency: input.frequency,
        lastUpdated: updatedAt,
        tags: safeTags,
      },
      reviewSummary: sanitizeStoredText(input.reviewSummary?.trim() || "") || current.reviewSummary,
      completionScore: Math.max(75, Math.min(100, current.completionScore + 2)),
      metadataScore: Math.max(78, Math.min(100, current.metadataScore + 2)),
    };

    let nextStore: InternalPortalStore = {
      ...store,
      datasets: [...store.datasets],
    };
    nextStore.datasets[index] = updated;
    nextStore = appendAudit(
      nextStore,
      updated,
      session,
      "update_dataset",
      `Dataset ${updated.title} diperbarui dari form internal.`,
      "info",
    );

    return {
      store: nextStore,
      result: {
        slug: updated.slug,
        updatedAt,
      },
    };
  });
}

export async function transitionInternalDataset(
  slug: string,
  fromStatus: Dataset["status"],
  toStatus: Dataset["status"],
  session: InternalSession,
  reviewNote?: string,
): Promise<{ persistedTo: "mock-api"; updatedAt: string }> {
  return withInternalPortalStore(async (store) => {
    const index = store.datasets.findIndex((item) => item.slug === slug);
    if (index < 0) {
      throw new Error("Dataset workflow tidak ditemukan.");
    }

    const dataset = store.datasets[index];
    if (!hasPermission(session, "dataset.view_all") && !isSameOrgId(dataset.organizationId, session.organizationId)) {
      throw new Error("Anda hanya boleh melakukan transisi pada dataset organisasi sendiri.");
    }

    ensureTransitionAccess(session, fromStatus, toStatus);

    const updatedAt = new Date().toISOString();
    const safeReviewNote = sanitizeStoredText(reviewNote?.trim() || "") || undefined;
    const event = toInternalWorkflowEvent(
      dataset.slug,
      session.username,
      session.name,
      session.role,
      fromStatus,
      toStatus,
      updatedAt,
      safeReviewNote,
    );

    const updated: InternalDataset = {
      ...dataset,
      status: toStatus,
      lastUpdated: updatedAt,
      metadata: {
        ...dataset.metadata,
        status: toStatus,
        lastUpdated: updatedAt,
      },
      submissionCount: toStatus === "Submitted" ? dataset.submissionCount + 1 : dataset.submissionCount,
      revisionCount: toStatus === "Need Revision" ? dataset.revisionCount + 1 : dataset.revisionCount,
      reviewSummary:
        safeReviewNote ||
        (toStatus === "Published"
          ? "Dataset dipublikasikan dan langsung tersedia di portal publik."
          : toStatus === "Need Revision"
            ? "Perlu revisi metadata dan resource sebelum diajukan kembali."
            : `Status dataset berubah ke ${toStatus}.`),
      publishedAt: toStatus === "Published" ? updatedAt : dataset.publishedAt,
      archivedAt: toStatus === "Archived" ? updatedAt : dataset.archivedAt,
      workflowHistory: [...dataset.workflowHistory, event],
    };

    let nextStore: InternalPortalStore = {
      ...store,
      datasets: [...store.datasets],
    };
    nextStore.datasets[index] = updated;
    nextStore = appendAudit(
      nextStore,
      updated,
      session,
      `transition_${fromStatus.toLowerCase()}_${toStatus.toLowerCase()}`,
      `${updated.title} dipindahkan dari ${fromStatus} ke ${toStatus}.`,
      toStatus === "Need Revision" ? "warning" : "info",
    );

    if (toStatus === "Submitted") {
      nextStore = pushNotification(
        nextStore,
        "Dataset diajukan untuk review",
        `${updated.title} diajukan oleh ${session.name} dan masuk antrian walidata.`,
        "/internal/workflow",
        ["sekretariat", "walidata"],
      );
    }

    if (toStatus === "Need Revision") {
      nextStore = pushNotification(
        nextStore,
        "Dataset perlu revisi",
        `${updated.title} perlu revisi. Catatan: ${safeReviewNote || "Lengkapi metadata."}`,
        `/internal/datasets/${updated.slug}`,
        ["produsen"],
        updated.ownerUserId,
      );
    }

    if (toStatus === "Published") {
      nextStore = pushNotification(
        nextStore,
        "Dataset dipublikasikan",
        `${updated.title} telah dipublikasikan dan kini tampil di portal publik.`,
        `/dataset/${updated.slug}`,
        ["sekretariat", "walidata", "produsen"],
      );
    }

    return {
      store: nextStore,
      result: {
        persistedTo: "mock-api",
        updatedAt,
      },
    };
  });
}

export async function updateInternalPassword(
  session: InternalSession,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  await withInternalPortalStore(async (store) => {
    const user = store.users.find((item) => item.id === session.userId);
    if (!user) {
      throw new Error("User internal tidak ditemukan.");
    }

    if (user.password !== currentPassword) {
      throw new Error("Password saat ini tidak sesuai.");
    }

    user.password = nextPassword;

    return {
      store,
      result: undefined,
    };
  });
}

export async function updatePortalSettings(
  session: InternalSession,
  input: Partial<PortalSettings>,
): Promise<PortalSettings> {
  if (!hasPermission(session, "portal.manage_settings")) {
    throw new Error("Hanya Walidata yang dapat mengubah pengaturan portal.");
  }

  return withInternalPortalStore(async (store) => {
    const settings = {
      ...store.settings,
      ...input,
    };

    return {
      store: {
        ...store,
        settings,
      },
      result: settings,
    };
  });
}

export async function addDatasetNote(
  slug: string,
  type: DatasetNoteType,
  category: DatasetNoteCategory,
  message: string,
  session: InternalSession,
): Promise<DatasetNote> {
  const safeMessage = sanitizeStoredText(message.trim());
  if (!safeMessage) {
    throw new Error("Pesan catatan tidak boleh kosong.");
  }

  // Guard backend/service permissions
  if (type === "pembina_recommendation") {
    if (!hasPermission(session, "dataset.add_review_note") && !hasPermission(session, "standard_data.recommend")) {
      throw new Error("Anda tidak memiliki hak untuk menambahkan rekomendasi Pembina.");
    }
  } else if (type === "sekretariat_monitoring") {
    if (!hasPermission(session, "monitoring.create_evaluation_note") && !hasPermission(session, "monitoring.create_issue_note")) {
      throw new Error("Anda tidak memiliki hak untuk menambahkan catatan monitoring Sekretariat.");
    }
  } else if (type === "walidata_review") {
    if (!hasPermission(session, "dataset.add_review_note")) {
      throw new Error("Anda tidak memiliki hak untuk menambahkan catatan pemeriksaan Walidata.");
    }
  } else if (type === "produsen_follow_up") {
    // Produsen must have access to edit own OPD
    if (!hasPermission(session, "dataset.edit_draft_own_opd")) {
      throw new Error("Anda tidak memiliki hak untuk memberikan respons tindak lanjut.");
    }
  } else {
    throw new Error("Tipe catatan tidak valid.");
  }

  return withInternalPortalStore(async (store) => {
    const index = store.datasets.findIndex((item) => item.slug === slug);
    if (index < 0) {
      throw new Error("Dataset tidak ditemukan.");
    }

    const dataset = store.datasets[index];

    // Ownership check for Produsen: only response for own OPD dataset
    if (type === "produsen_follow_up" || session.role === "produsen") {
      if (!isSameOrgId(dataset.organizationId, session.organizationId)) {
        throw new Error("Anda hanya boleh memberikan catatan respons pada dataset organisasi sendiri.");
      }
    }

    const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNote: DatasetNote = {
      id: noteId,
      datasetId: dataset.id,
      type,
      category,
      message: safeMessage,
      createdByUserId: session.userId,
      createdByUserName: session.name,
      createdByRole: session.role,
      createdByOrganizationId: session.organizationId,
      createdAt: new Date().toISOString(),
      isResolved: false,
    };

    // Log the audit event with the correct label based on user request
    let actionLabel = "";
    if (type === "pembina_recommendation") {
      actionLabel = "Pembina memberi rekomendasi";
    } else if (type === "sekretariat_monitoring") {
      actionLabel = "Sekretariat menambahkan catatan monitoring";
    } else if (type === "walidata_review") {
      actionLabel = "Walidata memberi catatan pemeriksaan";
    } else if (type === "produsen_follow_up") {
      actionLabel = "Produsen memberi tanggapan/klarifikasi";
    }

    const event = toInternalWorkflowEvent(
      dataset.slug,
      session.username,
      session.name,
      session.role,
      actionLabel,
      dataset.status,
      newNote.createdAt,
      newNote.message
    );

    const updatedNotes = [...(dataset.notes || []), newNote];
    const updatedDataset: InternalDataset = {
      ...dataset,
      notes: updatedNotes,
      lastUpdated: new Date().toISOString(),
      workflowHistory: [...dataset.workflowHistory, event],
    };

    let nextStore = {
      ...store,
      datasets: [...store.datasets],
    };
    nextStore.datasets[index] = updatedDataset;

    nextStore = appendAudit(
      nextStore,
      updatedDataset,
      session,
      `add_note_${type}`,
      `${actionLabel}: "${safeMessage.slice(0, 50)}${safeMessage.length > 50 ? "..." : ""}"`,
      "info"
    );

    // Push notification to relevant actors
    if (type === "pembina_recommendation") {
      nextStore = pushNotification(
        nextStore,
        "Rekomendasi Pembina Baru",
        `${session.name} menambahkan rekomendasi standar data pada ${dataset.title}.`,
        `/internal/datasets/${dataset.slug}`,
        ["walidata", "sekretariat"]
      );
    } else if (type === "sekretariat_monitoring") {
      nextStore = pushNotification(
        nextStore,
        "Catatan Monitoring Baru",
        `${session.name} menambahkan catatan evaluasi/isu pada ${dataset.title}.`,
        `/internal/datasets/${dataset.slug}`,
        ["walidata", "produsen"]
      );
    } else if (type === "walidata_review") {
      nextStore = pushNotification(
        nextStore,
        "Catatan Pemeriksaan Walidata",
        `${session.name} menambahkan catatan review pada ${dataset.title}.`,
        `/internal/datasets/${dataset.slug}`,
        ["produsen"]
      );
    }

    return {
      store: nextStore,
      result: newNote,
    };
  });
}

export async function resolveDatasetNote(
  slug: string,
  noteId: string,
  session: InternalSession,
): Promise<DatasetNote> {
  return withInternalPortalStore(async (store) => {
    const index = store.datasets.findIndex((item) => item.slug === slug);
    if (index < 0) {
      throw new Error("Dataset tidak ditemukan.");
    }

    const dataset = store.datasets[index];

    // View/Edit boundary check for resolve
    if (!hasPermission(session, "dataset.view_all") && !isSameOrgId(dataset.organizationId, session.organizationId)) {
      throw new Error("Anda tidak memiliki akses ke dataset ini.");
    }

    const notes = dataset.notes || [];
    const noteIndex = notes.findIndex((item) => item.id === noteId);
    if (noteIndex < 0) {
      throw new Error("Catatan tidak ditemukan.");
    }

    const note = notes[noteIndex];

    // Check resolve permissions
    if (note.type === "pembina_recommendation") {
      if (session.role !== "pembina" && session.role !== "walidata") {
        throw new Error("Hanya Pembina atau Walidata yang dapat menyelesaikan rekomendasi ini.");
      }
    } else if (note.type === "sekretariat_monitoring") {
      if (session.role !== "sekretariat" && session.role !== "walidata") {
        throw new Error("Hanya Sekretariat atau Walidata yang dapat menyelesaikan catatan monitoring ini.");
      }
    } else if (note.type === "walidata_review") {
      if (session.role !== "walidata" && session.role !== "produsen") {
        throw new Error("Hanya Walidata atau Produsen yang dapat menyelesaikan catatan ini.");
      }
    }

    const resolvedNote: DatasetNote = {
      ...note,
      isResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedByUserId: session.userId,
    };

    const actionLabel = "Catatan ditandai selesai";
    const event = toInternalWorkflowEvent(
      dataset.slug,
      session.username,
      session.name,
      session.role,
      actionLabel,
      dataset.status,
      resolvedNote.resolvedAt!,
      `Catatan oleh ${note.createdByUserName} (${note.createdByRole}): "${note.message}"`
    );

    const updatedNotes = [...notes];
    updatedNotes[noteIndex] = resolvedNote;

    const updatedDataset: InternalDataset = {
      ...dataset,
      notes: updatedNotes,
      lastUpdated: new Date().toISOString(),
      workflowHistory: [...dataset.workflowHistory, event],
    };

    let nextStore = {
      ...store,
      datasets: [...store.datasets],
    };
    nextStore.datasets[index] = updatedDataset;

    nextStore = appendAudit(
      nextStore,
      updatedDataset,
      session,
      `resolve_note_${note.type}`,
      `Catatan diselesaikan: "${note.message.slice(0, 50)}..."`,
      "info"
    );

    return {
      store: nextStore,
      result: resolvedNote,
    };
  });
}

export async function createInternalPublication(
  input: Omit<InternalPublication, "id" | "slug" | "createdByUserId" | "updatedByUserId" | "createdAt" | "updatedAt" | "organizationName"> & { slug?: string },
  session: InternalSession
): Promise<InternalPublication> {
  return withInternalPortalStore(async (store) => {
    const org = store.organizations.find((o) => o.id === input.organizationId);
    if (!org) {
      throw new Error("Organisasi tidak ditemukan.");
    }

    const slug = input.slug || slugify(input.title);

    // Check slug uniqueness
    if (store.publications?.some((p) => p.slug === slug)) {
      throw new Error("Slug/Judul publikasi sudah digunakan.");
    }

    const newPublication: InternalPublication = {
      ...input,
      id: `pub-${Date.now()}`,
      slug,
      organizationName: org.shortName,
      visibility: "public",
      createdByUserId: session.userId,
      updatedByUserId: session.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newPublication.status === "Published") {
      newPublication.publishedAt = new Date().toISOString();
    }

    const nextStore = {
      ...store,
      publications: [...(store.publications || []), newPublication],
    };

    return {
      store: nextStore,
      result: newPublication,
    };
  });
}

export async function updateInternalPublication(
  slug: string,
  input: Partial<Omit<InternalPublication, "id" | "slug" | "createdByUserId" | "createdAt" | "organizationName">>,
  session: InternalSession
): Promise<InternalPublication> {
  return withInternalPortalStore(async (store) => {
    const index = (store.publications || []).findIndex((p) => p.slug === slug);
    if (index < 0) {
      throw new Error("Publikasi tidak ditemukan.");
    }

    const original = store.publications[index];

    // Auth check: Produsen can only edit own OPD
    if (!hasPermission(session, "content.manage_all")) {
      if (original.organizationId !== session.organizationId) {
        throw new Error("Anda hanya bisa memperbarui publikasi milik OPD sendiri.");
      }
    }

    const updated: InternalPublication = {
      ...original,
      ...input,
      updatedByUserId: session.userId,
      updatedAt: new Date().toISOString(),
    } as InternalPublication;

    if (input.status === "Published" && original.status !== "Published") {
      updated.publishedAt = new Date().toISOString();
    }

    const nextPubs = [...store.publications];
    nextPubs[index] = updated;

    const nextStore = {
      ...store,
      publications: nextPubs,
    };

    return {
      store: nextStore,
      result: updated,
    };
  });
}

