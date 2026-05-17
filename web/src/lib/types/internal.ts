import type {
  Dataset,
  DatasetFormat,
  DatasetFrequency,
  DatasetStatus,
} from "@/lib/types/dataset";

export type InternalRole = "admin" | "pembina" | "walidata" | "operator";

export type InternalUserStatus = "Aktif" | "Nonaktif";

export type NotificationType = "info" | "review" | "warning" | "success";

export type AuditSeverity = "info" | "warning" | "critical";

export type InternalNavKey =
  | "dashboard"
  | "datasets"
  | "review"
  | "monitoring"
  | "users"
  | "archive"
  | "organizations"
  | "topics"
  | "notifications"
  | "workflowHistory"
  | "settings"
  | "profile"
  | "help"
  | "integrations";

export interface InternalWorkflowEvent {
  id: string;
  slug: string;
  actor: string;
  actorName: string;
  actorRole: InternalRole;
  at: string;
  fromStatus: string;
  toStatus: DatasetStatus;
  persistedTo: "ckan" | "mock-api";
  reviewNote?: string;
}

export interface InternalDataset extends Dataset {
  organizationId: string;
  ownerUserId: string;
  walidataUserId: string;
  createdAt: string;
  updatedByUserId: string;
  metadataScore: number;
  qualityScore: number;
  completionScore: number;
  submissionCount: number;
  revisionCount: number;
  reviewSummary: string;
  internalNote?: string;
  publishedAt?: string;
  archivedAt?: string;
  archiveReason?: string;
  featuredOnHome?: boolean;
  workflowHistory: InternalWorkflowEvent[];
}

export interface InternalUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: InternalRole;
  title: string;
  organizationId: string;
  avatar: "male" | "female";
  permissions: string[];
  status: InternalUserStatus;
  lastLoginAt?: string;
}

export interface InternalOrganization {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: string;
  leadName: string;
  leadTitle: string;
  email: string;
  phone: string;
  datasetTarget: number;
  status: "Aktif" | "Perlu Tindak Lanjut";
  lastUpdated: string;
}

export interface InternalTopicReference {
  id: string;
  slug: string;
  name: string;
  code: string;
  stewardOrganizationId: string;
  description: string;
  recommendedFormat: DatasetFormat;
  defaultFrequency: DatasetFrequency;
  status: "Aktif" | "Review";
}

export interface InternalNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  link: string;
  targetRoles: InternalRole[];
  userId?: string;
  readByUserIds: string[];
}

export interface InternalAuditLog {
  id: string;
  module: string;
  action: string;
  summary: string;
  createdAt: string;
  actorUserId: string;
  actorName: string;
  actorRole: InternalRole;
  severity: AuditSeverity;
  datasetSlug?: string;
  organizationId?: string;
}

export interface PortalSettings {
  portalName: string;
  publicEmail: string;
  publicPhone: string;
  heroHeadline: string;
  heroSubheadline: string;
  footerNote: string;
  highlightDatasetSlugs: string[];
  notificationBanner: string;
  defaultWalidataUserId: string;
}

export interface InternalPortalStore {
  version: number;
  lastUpdated: string;
  datasets: InternalDataset[];
  users: InternalUser[];
  organizations: InternalOrganization[];
  topics: InternalTopicReference[];
  notifications: InternalNotification[];
  auditLogs: InternalAuditLog[];
  settings: PortalSettings;
}

export interface InternalSession {
  userId: string;
  username: string;
  name: string;
  email: string;
  title: string;
  role: InternalRole;
  organizationId: string;
  organizationName: string;
}

export interface DatasetDraftInput {
  title: string;
  slug: string;
  summary: string;
  description?: string;
  organization: string;
  ownerOrgSlug?: string;
  topic: string;
  frequency: DatasetFrequency;
  period: string;
  walidata: string;
  coverage?: string;
  resourceName: string;
  resourceFormat: DatasetFormat;
  resourceUrl: string;
}

export interface DatasetUpdateInput {
  title: string;
  summary: string;
  description: string;
  topic: string;
  frequency: DatasetFrequency;
  period: string;
  walidata: string;
  coverage: string;
  organizationId: string;
  resourceName: string;
  resourceFormat: DatasetFormat;
  resourceUrl: string;
  tags: string[];
  reviewSummary?: string;
}
