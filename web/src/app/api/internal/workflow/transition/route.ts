import { NextResponse } from "next/server";
import { persistWorkflowTransition } from "@/lib/services/workflow-persistence";
import { canTransition, isDatasetStatus } from "@/lib/types/workflow";
import { inferInternalApiErrorStatus } from "@/lib/utils/internal-api-response";
import { sanitizeStoredText } from "@/lib/utils/input-sanitizer";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

type TransitionPayload = {
  slug?: string;
  fromStatus?: string;
  toStatus?: string;
  reviewNote?: string;
};

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
    const payload = (await request.json()) as TransitionPayload;
    const slug = payload.slug?.trim();
    const fromStatus = payload.fromStatus?.trim();
    const toStatus = payload.toStatus?.trim();

    if (!slug || !fromStatus || !toStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload tidak valid. slug, fromStatus, toStatus wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!isDatasetStatus(fromStatus) || !isDatasetStatus(toStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Nilai status tidak dikenali.",
        },
        { status: 400 },
      );
    }

    if (!canTransition(fromStatus, toStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transisi ${fromStatus} -> ${toStatus} tidak diperbolehkan.`,
        },
        { status: 400 },
      );
    }

    const result = await persistWorkflowTransition({
      slug,
      fromStatus,
      toStatus,
      actor,
      session,
      reviewNote: sanitizeStoredText(payload.reviewNote?.trim() ?? "") || undefined,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses transisi workflow.";
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
