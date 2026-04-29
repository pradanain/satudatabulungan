import { NextResponse } from "next/server";
import {
  getInfografisApiPayload,
  normalizeInfografisSourceQuery,
} from "@/lib/services/infografis-service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

export const dynamic = "force-dynamic";
export const revalidate = 21_600;

function normalizePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const page = normalizePositiveInteger(url.searchParams.get("page"), DEFAULT_PAGE);
  const requestedLimit = normalizePositiveInteger(url.searchParams.get("limit"), DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  const rawSource = url.searchParams.get("source");
  const source = normalizeInfografisSourceQuery(rawSource);

  if (rawSource && !["auto", "ckan", "live"].includes(rawSource.trim().toLowerCase())) {
    return NextResponse.json(
      {
        success: false,
        error: "Query source tidak valid. Gunakan auto, ckan, atau live.",
      },
      { status: 400 },
    );
  }

  try {
    const payload = await getInfografisApiPayload({
      page,
      limit,
      source,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data infografis.";

    return NextResponse.json(
      {
        success: false,
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          hasNextPage: false,
          sourceUsed: source === "ckan" ? "ckan" : "html_scrape",
          externalSource: "https://diskominfo.bulungan.go.id/wp/infografis/",
        },
        error: message,
      },
      { status: 200 },
    );
  }
}
