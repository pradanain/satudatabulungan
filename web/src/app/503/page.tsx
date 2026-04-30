import type { Metadata } from "next";
import { StatusPage } from "@/components/portal/status-page";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Error 503",
  description: "Layanan Satu Data Bulungan sedang dalam pemeliharaan atau beban tinggi.",
  path: "/503",
  keywords: ["error 503", "maintenance", "Satu Data Bulungan"],
});

export default function ServiceUnavailablePage() {
  return (
    <StatusPage
      code="503"
      title="Layanan Sementara Tidak Tersedia"
      description="Portal sedang dalam pemeliharaan atau beban layanan sedang tinggi."
      note="Silakan kembali beberapa saat lagi."
      primaryAction={{ href: "/", label: "Kembali ke Beranda" }}
      secondaryAction={{ href: "/error/503", label: "Buka Halaman Status" }}
    />
  );
}
