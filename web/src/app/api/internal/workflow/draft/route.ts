import { NextResponse } from "next/server";
import { createWorkflowDraft } from "@/lib/services/workflow-persistence";
import type { DatasetFormat, DatasetFrequency } from "@/lib/types/dataset";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

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
  return value.trim();
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = getInternalSessionFromCookieHeader(request.headers.get("cookie"));
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
        slug: payload.slug?.trim() || title,
        summary,
        description: payload.description?.trim() || undefined,
        organization,
        ownerOrgSlug: payload.ownerOrgSlug?.trim() || undefined,
        topic,
        frequency: frequencyRaw as DatasetFrequency,
        period,
        walidata,
        coverage: payload.coverage?.trim() || undefined,
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
    const status = message.includes("wajib") || message.includes("tidak valid") ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
