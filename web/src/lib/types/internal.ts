import type {
  Dataset,
  DatasetFormat,
  DatasetFrequency,
  DatasetStatus,
  DatasetPreview,
  DatasetResource,
} from "@/lib/types/dataset";

export type InternalRole = "sekretariat" | "pembina" | "walidata" | "produsen";

export type InternalPermission =
  // Dataset
  | "dataset.view_all"
  | "dataset.view_own_opd"
  | "dataset.create_own_opd"
  | "dataset.edit_draft_own_opd"
  | "dataset.upload_file"
  | "dataset.edit_metadata"
  | "dataset.submit"
  | "dataset.review"
  | "dataset.add_review_note"
  | "dataset.request_revision"
  | "dataset.approve"
  | "dataset.publish"
  | "dataset.unpublish"
  | "dataset.archive"
  | "dataset.restore_from_archive"
  | "dataset.delete_permanent"
  // Monitoring
  | "monitoring.view_all"
  | "monitoring.view_own_opd"
  | "monitoring.create_evaluation_note"
  | "monitoring.create_issue_note"
  | "monitoring.assign_follow_up"
  // Data Prioritas
  | "priority_data.view"
  | "priority_data.manage"
  | "priority_data.propose"
  // Forum
  | "forum.view"
  | "forum.manage"
  // Standar Data
  | "standard_data.view"
  | "standard_data.manage"
  | "standard_data.recommend"
  // Master Data
  | "master_data.view_topics"
  | "master_data.manage_topics"
  | "master_data.view_organizations"
  | "master_data.manage_organizations"
  // Portal
  | "portal.manage_settings"
  | "portal.manage_integrations"
  | "portal.manage_users"
  // Audit
  | "audit.view_all"
  | "audit.view_own"
  // Akun & Bantuan
  | "notifications.view"
  | "profile.view"
  | "help.view"
  // Content / Publikasi
  | "content.view_all"
  | "content.view_own_opd"
  | "content.create_own_opd"
  | "content.edit_own_draft"
  | "content.upload_file"
  | "content.submit"
  | "content.review"
  | "content.approve"
  | "content.publish"
  | "content.unpublish"
  | "content.archive"
  | "content.manage_all"
  // Berita
  | "news.view"
  | "news.manage"
  // Regulasi
  | "regulation.view"
  | "regulation.manage"
  // Petunjuk Teknis
  | "technical_guide.view"
  | "technical_guide.manage"
  // Infografis
  | "infographic.view_all"
  | "infographic.view_own_opd"
  | "infographic.create_own_opd"
  | "infographic.manage_all"
  // Publikasi Digital
  | "digital_publication.view_all"
  | "digital_publication.view_own_opd"
  | "digital_publication.create_own_opd"
  | "digital_publication.manage_all";

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
  | "integrations"
  | "publications";

export type ContentType = "news" | "digital_publication" | "infographic" | "regulation" | "technical_guide";
export type ContentStatus = DatasetStatus;

export interface InternalPublication {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  description: string;
  content?: string;
  fileUrl?: string;
  imageUrl?: string;
  organizationId: string;
  organizationName: string;
  status: ContentStatus;
  visibility: "public" | "internal";
  publishedAt?: string;
  year?: string;
  regulationNumber?: string;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type DatasetNoteType =
  | "pembina_recommendation"
  | "sekretariat_monitoring"
  | "walidata_review"
  | "produsen_follow_up";

export type DatasetNoteCategory =
  // Pembina
  | "quality_note"
  | "standard_note"
  | "metadata_note"
  | "statistic_recommendation"
  | "general_recommendation"
  // Sekretariat
  | "evaluation_note"
  | "issue_note"
  | "coordination_note"
  | "follow_up_assignment";

export interface DatasetNote {
  id: string;
  datasetId: string;
  type: DatasetNoteType;
  category: DatasetNoteCategory;
  message: string;
  createdByUserId: string;
  createdByUserName: string;
  createdByRole: InternalRole;
  createdByOrganizationId?: string;
  targetRole?: InternalRole;
  targetOrganizationId?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedByUserId?: string;
  createdAt: string;
}

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
  notes?: DatasetNote[];
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
  permissions: InternalPermission[];
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
  publications: InternalPublication[];
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
  preview?: DatasetPreview;
  resources?: DatasetResource[];
  unit?: string;
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
  preview?: DatasetPreview;
  resources?: DatasetResource[];
  unit?: string;
}
