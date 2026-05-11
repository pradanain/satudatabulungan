import { NextRequest, NextResponse } from "next/server";
import { getPublicDatasets } from "@/lib/services/dataset-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.toLowerCase() || "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const allDatasets = await getPublicDatasets();
    const suggestions = allDatasets
      .filter(ds => 
        ds.title.toLowerCase().includes(q) || 
        ds.organization.toLowerCase().includes(q) ||
        ds.topic.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(ds => ({
        id: ds.id,
        title: ds.title,
        slug: ds.slug,
        organization: ds.organization,
        topic: ds.topic
      }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[Autocomplete API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
