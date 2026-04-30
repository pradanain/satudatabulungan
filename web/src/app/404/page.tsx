import type { Metadata } from "next";
import { StatusPage } from "@/components/portal/status-page";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Error 404",
  description: "Halaman yang diminta tidak ditemukan di Portal Satu Data Bulungan.",
  path: "/404",
  keywords: ["error 404", "halaman tidak ditemukan", "Satu Data Bulungan"],
});

export default function NotFoundShowcasePage() {
  return (
    <StatusPage
      code="404"
      title="Halaman Tidak Ditemukan"
      description="Tautan yang Anda buka mungkin sudah dipindahkan, belum tersedia, atau alamat URL tidak valid."
      note="Silakan kembali ke beranda atau telusuri kembali katalog data."
      primaryAction={{ href: "/", label: "Kembali ke Beranda" }}
      secondaryAction={{ href: "/dataset", label: "Buka Katalog Dataset" }}
    />
  );
}
