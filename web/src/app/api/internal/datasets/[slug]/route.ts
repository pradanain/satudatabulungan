import { NextResponse } from "next/server";
import type { DatasetFormat, DatasetFrequency } from "@/lib/types/dataset";
import { updateInternalDataset } from "@/lib/services/internal-store";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";
import { validateResourceUrl } from "@/lib/utils/resource-url";

type DatasetUpdatePayload = {
  title?: string;
  summary?: string;
  description?: string;
  topic?: string;
  frequency?: string;
  period?: string;
  walidata?: string;
  coverage?: string;
  organizationId?: string;
  resourceName?: string;
  resourceFormat?: string;
  resourceUrl?: string;
  tags?: string[];
  reviewSummary?: string;
  preview?: any;
  resources?: any;
};

const allowedFrequencies: DatasetFrequency[] = [
  "Harian",
  "Bulanan",
  "Triwulanan",
  "Semesteran",
  "Tahunan",
  "Series",
  "Multi-tahunan",
  "Lainnya",
];

const allowedFormats: DatasetFormat[] = ["CSV", "XLSX", "PDF", "API", "JSON"];

function getRequired(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Field '${field}' wajib diisi.`);
  }

  const cleaned = sanitizeStoredText(value);
  if (!cleaned) {
    throw new Error(`Field '${field}' tidak valid.`);
  }

  return cleaned;
}

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
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

    const { slug } = await context.params;
    const payload = (await request.json()) as DatasetUpdatePayload;
    const frequency = getRequired(payload.frequency, "frequency");
    const resourceFormat = getRequired(payload.resourceFormat, "resourceFormat").toUpperCase();

    if (!allowedFrequencies.includes(frequency as DatasetFrequency)) {
      throw new Error("Field 'frequency' tidak valid.");
    }

    if (!allowedFormats.includes(resourceFormat as DatasetFormat)) {
      throw new Error("Field 'resourceFormat' tidak valid.");
    }

    const resourceUrl = getRequired(payload.resourceUrl, "resourceUrl");
    const resourceUrlValidation = validateResourceUrl(resourceUrl);
    if (!resourceUrlValidation.valid) {
      throw new Error(resourceUrlValidation.error);
    }

    const result = await updateInternalDataset(
      slug,
      {
        title: getRequired(payload.title, "title"),
        summary: sanitizeStoredText(payload.summary?.trim() || (payload.title || "")),
        description: sanitizeStoredText(payload.description?.trim() || ""),
        topic: getRequired(payload.topic, "topic"),
        frequency: frequency as DatasetFrequency,
        period: getRequired(payload.period, "period"),
        walidata: getRequired(payload.walidata, "walidata"),
        coverage: getRequired(payload.coverage, "coverage"),
        organizationId: getRequired(payload.organizationId, "organizationId"),
        resourceName: getRequired(payload.resourceName, "resourceName"),
        resourceFormat: resourceFormat as DatasetFormat,
        resourceUrl,
        tags:
          payload.tags
            ?.map((item) => sanitizeStoredText(item))
            .filter((item): item is string => Boolean(item && item.trim().length > 0)) ?? [],
        reviewSummary: sanitizeStoredText(payload.reviewSummary?.trim() ?? "") || undefined,
        preview: payload.preview,
        resources: payload.resources,
      },
      session,
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui dataset internal.";
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
