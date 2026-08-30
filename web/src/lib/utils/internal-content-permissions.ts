import type { ContentType, InternalPermission, InternalSession } from "@/lib/types/internal";
import { hasPermission } from "@/lib/utils/internal-auth";

const writableContentTypes: ContentType[] = [
  "news",
  "digital_publication",
  "infographic",
  "regulation",
  "technical_guide",
];

const contentCreatePermissions: Record<ContentType, InternalPermission> = {
  news: "news.create_own_opd",
  digital_publication: "digital_publication.create_own_opd",
  infographic: "infographic.create_own_opd",
  regulation: "regulation.manage",
  technical_guide: "technical_guide.manage",
};

const contentManagePermissions: Record<ContentType, InternalPermission> = {
  news: "news.manage",
  digital_publication: "digital_publication.manage_all",
  infographic: "infographic.manage_all",
  regulation: "regulation.manage",
  technical_guide: "technical_guide.manage",
};

export function isInternalContentType(value: unknown): value is ContentType {
  return typeof value === "string" && writableContentTypes.includes(value as ContentType);
}

export function canManageContentType(session: InternalSession, contentType: ContentType): boolean {
  return hasPermission(session, "content.manage_all") || hasPermission(session, contentManagePermissions[contentType]);
}

export function canCreateContentType(session: InternalSession, contentType: ContentType): boolean {
  return canManageContentType(session, contentType) || hasPermission(session, contentCreatePermissions[contentType]);
}

export function canWriteContentForOrganization(
  session: InternalSession,
  contentType: ContentType,
  organizationId: string,
): boolean {
  if (canManageContentType(session, contentType)) {
    return true;
  }

  return canCreateContentType(session, contentType) && session.organizationId === organizationId;
}

export function canUploadDatasetFile(session: InternalSession, organizationId?: string): boolean {
  if (!hasPermission(session, "dataset.upload_file")) {
    return false;
  }

  if (!organizationId) {
    return true;
  }

  return hasPermission(session, "dataset.view_all") || session.organizationId === organizationId;
}

export function canUploadContentFile(
  session: InternalSession,
  contentType: ContentType,
  organizationId?: string,
): boolean {
  if (!canCreateContentType(session, contentType)) {
    return false;
  }

  if (!organizationId) {
    return true;
  }

  return canWriteContentForOrganization(session, contentType, organizationId);
}
