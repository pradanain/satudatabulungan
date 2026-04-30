import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Layanan Data",
  description:
    "Layanan publik untuk permintaan data, akses API, dan FAQ seputar pemanfaatan data Kabupaten Bulungan.",
  path: "/layanan-data",
  keywords: ["layanan data", "permintaan data Bulungan", "FAQ data", "API data Bulungan"],
});

export default function LayananDataPage() {
  redirect("/layanan-data/permintaan-data");
}
