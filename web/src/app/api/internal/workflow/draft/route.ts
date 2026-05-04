import { NextResponse } from "next/server";
import { createWorkflowDraft } from "@/lib/services/workflow-persistence";
import type { DatasetFormat, DatasetFrequency } from "@/lib/types/dataset";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { validateResourceUrl } from "@/lib/utils/resource-url";

type DraftPayload = {
  title?: string;
  slug?: string;
  summary?: string;
  description?: string;
  organization?: string;
  ownerOrgSlug?: string;
  topic?: string;
  frequency?: string;
  period?: string;
  walidata?: string;
  coverage?: string;
  resourceName?: string;
  resourceFormat?: string;
  resourceUrl?: string;
};

const allowedFrequencies: DatasetFrequency[] = [
  "Harian",
  "Bulanan",
  "Triwulanan",
  "Semesteran",
  "Tahunan",
];

const allowedFormats: DatasetFormat[] = ["CSV", "XLSX", "PDF", "API", "JSON"];

function getRequired(payload: DraftPayload, key: keyof DraftPayload): string {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Field '${key}' wajib diisi.`);
  }

  const cleaned = sanitizeStoredText(value);
  if (!cleaned) {
    throw new Error(`Field '${key}' tidak valid.`);
  }

  return cleaned;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getInternalSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi internal tidak ditemukan.",
        },
        { status: 401 },
      );
    }

    const actor = session.username;
    const payload = (await request.json()) as DraftPayload;

    const title = getRequired(payload, "title");
    const summary = getRequired(payload, "summary");
    const organization = getRequired(payload, "organization");
    const topic = getRequired(payload, "topic");
    const period = getRequired(payload, "period");
    const walidata = getRequired(payload, "walidata");
    const resourceName = getRequired(payload, "resourceName");
    const resourceUrl = getRequired(payload, "resourceUrl");
    const resourceUrlValidation = validateResourceUrl(resourceUrl);
    if (!resourceUrlValidation.valid) {
      throw new Error(resourceUrlValidation.error);
    }

    const frequencyRaw = getRequired(payload, "frequency");
    const resourceFormatRaw = getRequired(payload, "resourceFormat").toUpperCase();

    if (!allowedFrequencies.includes(frequencyRaw as DatasetFrequency)) {
      throw new Error("Field 'frequency' tidak valid.");
    }

    if (!allowedFormats.includes(resourceFormatRaw as DatasetFormat)) {
      throw new Error("Field 'resourceFormat' tidak valid.");
    }

    const result = await createWorkflowDraft(
      {
        title,
        slug: sanitizeStoredText(payload.slug?.trim() || title),
        summary,
        description: sanitizeStoredText(payload.description?.trim() || "") || undefined,
        organization,
        ownerOrgSlug: sanitizeStoredText(payload.ownerOrgSlug?.trim() || "") || undefined,
        topic,
        frequency: frequencyRaw as DatasetFrequency,
        period,
        walidata,
        coverage: sanitizeStoredText(payload.coverage?.trim() || "") || undefined,
        resourceName,
        resourceFormat: resourceFormatRaw as DatasetFormat,
        resourceUrl,
      },
      actor,
      session,
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat draft.";
    const status = inferInternalApiErrorStatus(message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
