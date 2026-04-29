import { NextResponse } from "next/server";
import {
  getWorkflowItemBySlug,
  sortWorkflowAuditTimeline,
} from "@/lib/services/workflow-service";
import type { WorkflowAuditEntry } from "@/lib/types/workflow";
import { getInternalSessionFromCookieHeader } from "@/lib/utils/internal-auth-server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type ExportFormat = "json" | "csv";

function parseFormat(value: string | null): ExportFormat | null {
  if (!value || !value.trim()) {
    return "json";
  }

  const normalized = value.toLowerCase().trim();
  if (normalized === "json" || normalized === "csv") {
    return normalized;
  }

  return null;
}

function parseDateTs(value: string | null, boundary: "start" | "end"): number | null {
  if (!value || !value.trim()) {
    return null;
  }

  const suffix = boundary === "start" ? "T00:00:00.000" : "T23:59:59.999";
  const ts = new Date(`${value.trim()}${suffix}`).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function filterTimeline(
  timeline: WorkflowAuditEntry[],
  actor: string,
  status: string,
  dateFrom: string,
  dateTo: string,
): WorkflowAuditEntry[] {
  const actorFilter = actor.trim().toLowerCase();
  const statusFilter = status.trim().toLowerCase();
  const dateFromTs = parseDateTs(dateFrom, "start");
  const dateToTs = parseDateTs(dateTo, "end");

  return timeline.filter((entry) => {
    const actorPass = !actorFilter || entry.actor.toLowerCase() === actorFilter;
    const statusPass =
      !statusFilter ||
      entry.fromStatus.toLowerCase() === statusFilter ||
      entry.toStatus.toLowerCase() === statusFilter;

    const entryTs = new Date(entry.at).getTime();
    const fromPass = dateFromTs === null || (!Number.isNaN(entryTs) && entryTs >= dateFromTs);
    const toPass = dateToTs === null || (!Number.isNaN(entryTs) && entryTs <= dateToTs);

    return actorPass && statusPass && fromPass && toPass;
  });
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, "\"\"");
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildCsv(rows: WorkflowAuditEntry[]): string {
  const headers = ["slug", "actor", "at", "fromStatus", "toStatus", "persistedTo", "reviewNote"];
  const lines = rows.map((entry) =>
    [
      entry.slug,
      entry.actor,
      entry.at,
      entry.fromStatus,
      entry.toStatus,
      entry.persistedTo,
      entry.reviewNote ?? "",
    ]
      .map((value) => csvEscape(String(value)))
      .join(","),
  );

  return `${headers.join(",")}\n${lines.join("\n")}`.trimEnd() + "\n";
}

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext) {
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

  const { slug } = await params;
  const url = new URL(request.url);

  const format = parseFormat(url.searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      {
        success: false,
        error: "Query 'format' tidak valid. Gunakan json atau csv.",
      },
      { status: 400 },
    );
  }

  const actor = url.searchParams.get("actor") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const dateFrom = url.searchParams.get("dateFrom") ?? "";
  const dateTo = url.searchParams.get("dateTo") ?? "";

  const item = await getWorkflowItemBySlug(slug, session);
  if (!item) {
    return NextResponse.json(
      {
        success: false,
        error: "Dataset workflow tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const sorted = sortWorkflowAuditTimeline(item);
  const filtered = filterTimeline(sorted.auditTrail ?? [], actor, status, dateFrom, dateTo);
  const safeSlug = sanitizeFilename(item.slug || slug);

  if (format === "csv") {
    const filename = `audit-${safeSlug}.csv`;
    return new NextResponse(buildCsv(filtered), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const payload = {
    success: true,
    dataset: {
      slug: item.slug,
      title: item.title,
    },
    filters: {
      actor: actor || null,
      status: status || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    },
    count: filtered.length,
    exportedAt: new Date().toISOString(),
    entries: filtered,
  };

  const filename = `audit-${safeSlug}.json`;
  return new NextResponse(`${JSON.stringify(payload, null, 2)}\n`, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
