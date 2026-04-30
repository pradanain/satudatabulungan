import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi",
  description:
    "Akses publikasi resmi Satu Data Bulungan meliputi berita, buku digital, infografis, regulasi, dan petunjuk teknis.",
  path: "/publikasi",
  keywords: ["publikasi data", "berita data", "infografis Bulungan", "regulasi data"],
});

export default function PublikasiPage() {
  redirect("/publikasi-berita");
}
