import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mockDatasets } from "@/lib/data/mock-datasets";
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
} from "@/lib/types/internal";
import { canTransition, type WorkflowItem } from "@/lib/types/workflow";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { resolveLocalStorePath } from "@/lib/utils/local-store-path";

const STORE_VERSION = 1;
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
  return [
    {
      id: "opd-disdukcapil",
      slug: "disdukcapil",
      name: "Dinas Kependudukan dan Pencatatan Sipil",
      shortName: "Disdukcapil",
      category: "Layanan Dasar",
      leadName: "Ahmad Faisal",
      leadTitle: "Kepala Dinas",
      email: "disdukcapil@bulungankab.go.id",
      phone: "(0552) 21118",
      datasetTarget: 12,
      status: "Aktif",
      lastUpdated: "2026-04-21T09:20:00.000Z",
    },
    {
      id: "opd-dinkes",
      slug: "dinas-kesehatan",
      name: "Dinas Kesehatan",
      shortName: "Dinas Kesehatan",
      category: "Layanan Dasar",
      leadName: "Nur Aisyah",
      leadTitle: "Kepala Dinas",
      email: "dinkes@bulungankab.go.id",
      phone: "(0552) 21209",
      datasetTarget: 14,
      status: "Aktif",
      lastUpdated: "2026-04-21T10:05:00.000Z",
    },
    {
      id: "opd-dikbud",
      slug: "dinas-pendidikan",
      name: "Dinas Pendidikan",
      shortName: "Dinas Pendidikan",
      category: "Layanan Dasar",
      leadName: "Rudy Hartono",
      leadTitle: "Kepala Dinas",
      email: "disdik@bulungankab.go.id",
      phone: "(0552) 21088",
      datasetTarget: 13,
      status: "Aktif",
      lastUpdated: "2026-04-19T08:20:00.000Z",
    },
    {
      id: "opd-koperasi",
      slug: "dinas-koperasi-ukm",
      name: "Dinas Koperasi, UKM, Perindustrian dan Perdagangan",
      shortName: "Dinas Koperasi & UKM",
      category: "Perekonomian",
      leadName: "Mira Safitri",
      leadTitle: "Kepala Dinas",
      email: "diskopukm@bulungankab.go.id",
      phone: "(0552) 21456",
      datasetTarget: 10,
      status: "Aktif",
      lastUpdated: "2026-04-20T13:10:00.000Z",
    },
    {
      id: "opd-pupr",
      slug: "dinas-pupr",
      name: "Dinas Pekerjaan Umum dan Penataan Ruang",
      shortName: "Dinas PUPR",
      category: "Infrastruktur",
      leadName: "Hari Wibowo",
      leadTitle: "Kepala Dinas",
      email: "pupr@bulungankab.go.id",
      phone: "(0552) 21910",
      datasetTarget: 11,
      status: "Aktif",
      lastUpdated: "2026-04-18T11:12:00.000Z",
    },
    {
      id: "opd-dlh",
      slug: "dlh",
      name: "Dinas Lingkungan Hidup",
      shortName: "DLH",
      category: "Lingkungan",
      leadName: "Dewi Komala",
      leadTitle: "Kepala Dinas",
      email: "dlh@bulungankab.go.id",
      phone: "(0552) 21872",
      datasetTarget: 8,
      status: "Aktif",
      lastUpdated: "2026-04-17T07:45:00.000Z",
    },
    {
      id: "opd-dinsos",
      slug: "dinas-sosial",
      name: "Dinas Sosial",
      shortName: "Dinas Sosial",
      category: "Layanan Dasar",
      leadName: "Siti Rahmah",
      leadTitle: "Kepala Dinas",
      email: "dinsos@bulungankab.go.id",
      phone: "(0552) 21233",
      datasetTarget: 9,
      status: "Perlu Tindak Lanjut",
      lastUpdated: "2026-04-16T15:00:00.000Z",
    },
    {
      id: "opd-pertanian",
      slug: "dinas-pertanian",
      name: "Dinas Pertanian dan Ketahanan Pangan",
      shortName: "Dinas Pertanian",
      category: "Perekonomian",
      leadName: "Yusuf Kurnia",
      leadTitle: "Kepala Dinas",
      email: "pertanian@bulungankab.go.id",
      phone: "(0552) 21704",
      datasetTarget: 10,
      status: "Aktif",
      lastUpdated: "2026-04-15T10:42:00.000Z",
    },
    {
      id: "opd-dkip",
      slug: "dkip",
      name: "DKIP / Walidata Kabupaten Bulungan",
      shortName: "DKIP",
      category: "Walidata",
      leadName: "Bambang Irawan",
      leadTitle: "Kepala Dinas",
      email: "dkip@bulungankab.go.id",
      phone: "(0552) 22123",
      datasetTarget: 15,
      status: "Aktif",
      lastUpdated: "2026-04-22T08:00:00.000Z",
    },
    {
      id: "opd-bappedalitbang",
      slug: "bappedalitbang",
      name: "Bappedalitbang / Sekretariat Satu Data",
      shortName: "Bappedalitbang",
      category: "Sekretariat",
      leadName: "Dina Pratiwi",
      leadTitle: "Koordinator Sekretariat",
      email: "sekretariat@bulungankab.go.id",
      phone: "(0552) 22001",
      datasetTarget: 20,
      status: "Aktif",
      lastUpdated: "2026-04-22T09:00:00.000Z",
    },
    {
      id: "opd-bps",
      slug: "bps",
      name: "Badan Pusat Statistik (BPS)",
      shortName: "BPS",
      category: "Pembina Data",
      leadName: "Supriyanto",
      leadTitle: "Kepala BPS",
      email: "bps6504@bps.go.id",
      phone: "(0552) 21100",
      datasetTarget: 0,
      status: "Aktif",
      lastUpdated: "2026-04-22T09:00:00.000Z",
    },
  ];
}

function buildUsers(): InternalUser[] {
  return [
    {
      id: "user-admin",
      username: "admin",
      password: "bulungan123",
      name: "Admin Sekretariat",
      email: "admin.portal@bulungankab.go.id",
      phone: "0811-5400-001",
      role: "admin",
      title: "Administrator Portal",
      organizationId: "opd-bappedalitbang",
      avatar: "female",
      permissions: ["full_access", "manage_users", "manage_settings", "publish_dataset"],
      status: "Aktif",
    },
    {
      id: "user-walidata",
      username: "walidata",
      password: "walidata123",
      name: "Walidata DKIP",
      email: "walidata@bulungankab.go.id",
      phone: "0811-5400-002",
      role: "walidata",
      title: "Koordinator Walidata",
      organizationId: "opd-dkip",
      avatar: "male",
      permissions: ["review_dataset", "publish_dataset", "monitor_audit"],
      status: "Aktif",
    },
    {
      id: "user-pembina",
      username: "pembina",
      password: "pembina123",
      name: "Pembina Data BPS",
      email: "pembina@bps.go.id",
      phone: "0811-5400-003",
      role: "pembina",
      title: "Pembina Data",
      organizationId: "opd-bps",
      avatar: "male",
      permissions: ["review_dataset", "monitor_audit"],
      status: "Aktif",
    },
    {
      id: "user-operator-disdukcapil",
      username: "operator.disdukcapil",
      password: "operator123",
      name: "Ahmad Fadli",
      email: "operator.disdukcapil@bulungankab.go.id",
      phone: "0811-5400-101",
      role: "operator",
      title: "Operator Data Disdukcapil",
      organizationId: "opd-disdukcapil",
      avatar: "male",
      permissions: ["manage_own_dataset", "submit_review"],
      status: "Aktif",
    },
    {
      id: "user-operator-dinkes",
      username: "operator.dinkes",
      password: "operator123",
      name: "Maya Lestari",
      email: "operator.dinkes@bulungankab.go.id",
      phone: "0811-5400-102",
      role: "operator",
      title: "Operator Data Dinas Kesehatan",
      organizationId: "opd-dinkes",
      avatar: "female",
      permissions: ["manage_own_dataset", "submit_review"],
      status: "Aktif",
    },
    {
      id: "user-operator-dikbud",
      username: "operator.pendidikan",
      password: "operator123",
      name: "Raka Maulana",
      email: "operator.pendidikan@bulungankab.go.id",
      phone: "0811-5400-103",
      role: "operator",
      title: "Operator Data Dinas Pendidikan",
      organizationId: "opd-dikbud",
      avatar: "male",
      permissions: ["manage_own_dataset", "submit_review"],
      status: "Aktif",
    },
  ];
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
      "operator",
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
    "operator",
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
  const orgByShortName = new Map(organizations.map((item) => [item.shortName, item.id]));
  const operatorByOrg = new Map(users.filter((item) => item.role === "operator").map((item) => [item.organizationId, item.id]));
  const walidataUserId = pickUserIdByRole(users, "walidata");

  const publishedDatasets = mockDatasets.map((dataset) =>
    buildInternalDataset(
      dataset,
      orgByShortName.get(dataset.organization) ?? "opd-bappedalitbang",
      operatorByOrg.get(orgByShortName.get(dataset.organization) ?? "") ?? "user-admin",
      walidataUserId,
    ),
  );

  const extraDatasets: InternalDataset[] = [
    cloneDataset(mockDatasets[0], {
      id: "INT-OPD-001",
      slug: "rekap-aktivasi-identitas-digital-2026",
      title: "Rekap Aktivasi Identitas Digital 2026",
      topic: "Kependudukan",
      organization: "Disdukcapil",
      organizationId: "opd-disdukcapil",
      ownerUserId: "user-operator-disdukcapil",
      walidataUserId,
      status: "Draft",
      lastUpdated: "2026-04-22T07:15:00.000Z",
      period: "2026",
      summary: "Draft dataset aktivasi identitas digital per kecamatan dan kanal layanan.",
      reviewSummary: "Menunggu kelengkapan resource dan verifikasi metadata awal.",
      metadataScore: 78,
      qualityScore: 76,
      completionScore: 74,
      featuredOnHome: false,
      viewCount: 0,
      downloadCount: 0,
      popularityScore: 21,
      tags: ["identitas-digital", "dukcapil", "aktivasi"],
    }),
    cloneDataset(mockDatasets[1], {
      id: "INT-REV-002",
      slug: "cakupan-imunisasi-balita-2026",
      title: "Cakupan Imunisasi Balita 2026",
      topic: "Kesehatan",
      organization: "Dinas Kesehatan",
      organizationId: "opd-dinkes",
      ownerUserId: "user-operator-dinkes",
      walidataUserId,
      status: "Submitted",
      lastUpdated: "2026-04-22T08:30:00.000Z",
      period: "2026",
      summary: "Dataset pengajuan review walidata untuk imunisasi dasar lengkap per puskesmas.",
      reviewSummary: "Sedang menunggu review kelengkapan metadata dan standar kode wilayah.",
      metadataScore: 88,
      qualityScore: 84,
      completionScore: 86,
      tags: ["imunisasi", "balita", "puskesmas"],
    }),
    cloneDataset(mockDatasets[3], {
      id: "INT-REV-003",
      slug: "rekap-partisipasi-sekolah-menengah-2026",
      title: "Rekap Partisipasi Sekolah Menengah 2026",
      topic: "Pendidikan",
      organization: "Dinas Pendidikan",
      organizationId: "opd-dikbud",
      ownerUserId: "user-operator-dikbud",
      walidataUserId,
      status: "Need Revision",
      lastUpdated: "2026-04-21T14:00:00.000Z",
      period: "2026",
      summary: "Dataset perlu revisi karena struktur metadata indikator partisipasi belum lengkap.",
      reviewSummary: "Lengkapi definisi indikator APS dan tautan metodologi pengumpulan data.",
      metadataScore: 72,
      qualityScore: 70,
      completionScore: 68,
      revisionCount: 1,
      tags: ["aps", "sekolah-menengah", "pendidikan"],
      internalNote: "Walidata meminta penambahan definisi dan referensi metodologi.",
    }),
    cloneDataset(mockDatasets[4], {
      id: "INT-APR-004",
      slug: "indikator-kemantapan-jalan-2026",
      title: "Indikator Kemantapan Jalan 2026",
      topic: "Infrastruktur",
      organization: "Dinas PUPR",
      organizationId: "opd-pupr",
      ownerUserId: "user-admin",
      walidataUserId,
      status: "Approved",
      lastUpdated: "2026-04-22T09:45:00.000Z",
      period: "2026",
      summary: "Dataset telah disetujui dan menunggu publikasi ke portal publik.",
      reviewSummary: "Metadata lengkap, tinggal finalisasi banner publikasi dan penjadwalan rilis.",
      metadataScore: 94,
      qualityScore: 91,
      completionScore: 93,
      tags: ["jalan", "kemantapan", "infrastruktur"],
    }),
    cloneDataset(mockDatasets[2], {
      id: "INT-ARC-005",
      slug: "arsip-pembinaan-umkm-2024",
      title: "Arsip Pembinaan UMKM 2024",
      topic: "Ekonomi",
      organization: "Dinas Koperasi & UKM",
      organizationId: "opd-koperasi",
      ownerUserId: "user-admin",
      walidataUserId,
      status: "Archived",
      lastUpdated: "2026-04-10T13:15:00.000Z",
      period: "2024",
      summary: "Dataset arsip yang sudah diganti oleh versi terbaru untuk tahun berjalan.",
      reviewSummary: "Diarsipkan setelah dataset tahun 2025-2026 dipublikasikan.",
      metadataScore: 90,
      qualityScore: 88,
      completionScore: 92,
      archiveReason: "Versi 2024 digantikan oleh seri dataset baru 2025-2026.",
      tags: ["arsip", "umkm", "2024"],
      featuredOnHome: false,
    }),
  ];

  const datasets = [...publishedDatasets, ...extraDatasets];
  const topics = buildTopics(organizations);

  const notifications: InternalNotification[] = [
    {
      id: "notif-1",
      title: "Dataset baru menunggu review",
      message: "Cakupan Imunisasi Balita 2026 baru saja diajukan dan menunggu verifikasi walidata.",
      type: "review",
      createdAt: "2026-04-22T08:35:00.000Z",
      link: "/internal/workflow",
      targetRoles: ["admin", "walidata"],
      readByUserIds: [],
    },
    {
      id: "notif-2",
      title: "Revisi diminta",
      message: "Rekap Partisipasi Sekolah Menengah 2026 perlu melengkapi metodologi indikator.",
      type: "warning",
      createdAt: "2026-04-21T14:05:00.000Z",
      link: "/internal/datasets/rekap-partisipasi-sekolah-menengah-2026",
      targetRoles: ["operator"],
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
      targetRoles: ["admin", "walidata"],
      readByUserIds: [],
    },
    {
      id: "notif-4",
      title: "Pengingat metadata",
      message: "Pastikan seluruh resource memiliki deskripsi yang jelas sebelum submit review.",
      type: "info",
      createdAt: "2026-04-22T06:30:00.000Z",
      link: "/internal/help",
      targetRoles: ["operator"],
      readByUserIds: [],
    },
  ];

  const auditLogs: InternalAuditLog[] = datasets.flatMap((dataset) =>
    dataset.workflowHistory.map((event) => ({
      id: event.id,
      module: "workflow",
      action: `${event.fromStatus} -> ${event.toStatus}`,
      summary: `${dataset.title} dipindahkan ke status ${event.toStatus}.`,
      createdAt: event.at,
      actorUserId: event.actor,
      actorName: event.actorName,
      actorRole: event.actorRole,
      severity: event.toStatus === "Need Revision" ? "warning" : "info",
      datasetSlug: dataset.slug,
      organizationId: dataset.organizationId,
    })),
  );

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
      dataset.ownerUserId.startsWith("user-walidata") ? "walidata" : "operator",
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
  const overrides = await readJsonFile<WorkflowOverrides>(getLocalPath("mock-workflow-overrides.json"), {});
  const drafts = await readJsonFile<LegacyDrafts>(getLocalPath("mock-workflow-drafts.json"), {});
  const trail = await readJsonFile<LegacyWorkflowTrail>(getLocalPath("workflow-audit-trail.json"), {});

  const nextStore = { ...store, datasets: [...store.datasets] };

  nextStore.datasets = nextStore.datasets.map((dataset) => {
    const override = overrides[dataset.slug];
    const withOverride = override
      ? {
          ...dataset,
          status: override.status,
          lastUpdated: override.updatedAt,
          metadata: {
            ...dataset.metadata,
            status: override.status,
            lastUpdated: override.updatedAt,
          },
          reviewSummary: override.reviewNote || dataset.reviewSummary,
        }
      : dataset;

    const legacyTrail = trail[dataset.slug];
    return legacyTrail?.length ? attachLegacyWorkflowEvents(withOverride, legacyTrail) : withOverride;
  });

  for (const draft of Object.values(drafts)) {
    if (nextStore.datasets.some((item) => item.slug === draft.slug)) {
      continue;
    }

    const organization = nextStore.organizations.find((item) => item.shortName === draft.organization) ?? nextStore.organizations[0];
    const owner = nextStore.users.find((item) => item.organizationId === organization.id) ?? nextStore.users[0];
    const walidataUserId = pickUserIdByRole(nextStore.users, "walidata");
    const template = nextStore.datasets[0];
    nextStore.datasets.push(
      cloneDataset(template, {
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        summary: `Draft legacy ${draft.title} dimigrasikan ke shared store internal.`,
        topic: template.topic,
        organization: draft.organization,
        organizationId: organization.id,
        ownerUserId: owner.id,
        walidataUserId,
        status: draft.status,
        lastUpdated: draft.lastUpdated,
        period: "2026",
        reviewSummary: "Draft lama dimigrasikan dari persistence iterasi sebelumnya.",
        resourceName: `${draft.slug}.csv`,
        resourceUrl: `/api/mock/resources/${draft.slug}/csv`,
        resourceFormat: "CSV",
        featuredOnHome: false,
        viewCount: 0,
        downloadCount: 0,
        popularityScore: 5,
        workflowHistory: buildBaseWorkflow(
          draft.slug,
          owner.username,
          owner.name,
          owner.role,
          draft.status,
          draft.lastUpdated,
          "Draft lama dimigrasikan ke internal shared store.",
        ),
      }),
    );
  }

  nextStore.lastUpdated = new Date().toISOString();
  return nextStore;
}

export async function loadInternalPortalStore(): Promise<InternalPortalStore> {
  const storePath = getStorePath();
  const existing = await readJsonFile<InternalPortalStore | null>(storePath, null);

  if (existing?.version === STORE_VERSION) {
    return existing;
  }

  const seeded = await bootstrapFromLegacyFiles(buildSeedStore());
  await writeJsonFile(storePath, seeded);
  return seeded;
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

export function getScopedDatasets(store: InternalPortalStore, session: InternalSession): InternalDataset[] {
  if (session.role === "admin" || session.role === "walidata") {
    return [...store.datasets];
  }

  return store.datasets.filter(
    (dataset) => dataset.organizationId === session.organizationId || dataset.ownerUserId === session.userId,
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
  if (session.role === "admin" || session.role === "walidata") {
    return [...store.auditLogs];
  }

  return store.auditLogs.filter((item) => item.organizationId === session.organizationId);
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

  if (session.role === "admin" || session.role === "walidata") {
    return dataset;
  }

  return dataset.organizationId === session.organizationId ? dataset : null;
}

function ensureDatasetWriteAccess(dataset: InternalDataset, session: InternalSession): void {
  if (session.role === "admin") {
    return;
  }

  if (session.role === "operator" && dataset.organizationId === session.organizationId) {
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

  if (session.role === "admin") {
    return;
  }

  if (session.role === "operator" && ((fromStatus === "Draft" && toStatus === "Submitted") || (fromStatus === "Need Revision" && toStatus === "Submitted"))) {
    return;
  }

  if (
    session.role === "walidata" &&
    ((fromStatus === "Submitted" && (toStatus === "Need Revision" || toStatus === "Approved")) ||
      (fromStatus === "Approved" && toStatus === "Published") ||
      (fromStatus === "Published" && toStatus === "Archived"))
  ) {
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
          item.id === input.organization,
      ) ?? null;
    const sessionOrganization =
      store.organizations.find((item) => item.id === session.organizationId) ?? store.organizations[0];

    if (
      session.role === "operator" &&
      requestedOrganization &&
      requestedOrganization.id !== session.organizationId
    ) {
      throw new Error("Operator hanya boleh membuat draft untuk organisasi sendiri.");
    }

    const organization =
      session.role === "operator"
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
      resources: buildDatasetResource(input.slug, safeResourceName, input.resourceFormat, input.resourceUrl, now),
      preview: {
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
      ["admin", "walidata", "operator"],
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
      resources: buildDatasetResource(
        current.slug,
        safeResourceName,
        input.resourceFormat,
        input.resourceUrl,
        updatedAt,
      ),
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
    if (session.role === "operator" && dataset.organizationId !== session.organizationId) {
      throw new Error("Operator hanya boleh melakukan transisi pada dataset organisasi sendiri.");
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
        ["admin", "walidata"],
      );
    }

    if (toStatus === "Need Revision") {
      nextStore = pushNotification(
        nextStore,
        "Dataset perlu revisi",
        `${updated.title} perlu revisi. Catatan: ${safeReviewNote || "Lengkapi metadata."}`,
        `/internal/datasets/${updated.slug}`,
        ["operator"],
        updated.ownerUserId,
      );
    }

    if (toStatus === "Published") {
      nextStore = pushNotification(
        nextStore,
        "Dataset dipublikasikan",
        `${updated.title} telah dipublikasikan dan kini tampil di portal publik.`,
        `/dataset/${updated.slug}`,
        ["admin", "walidata", "operator"],
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
  if (session.role !== "admin") {
    throw new Error("Hanya admin yang dapat mengubah pengaturan portal.");
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
