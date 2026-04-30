import type { Metadata } from "next";
import { StatusPage } from "@/components/portal/status-page";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Error 500",
  description: "Terjadi gangguan sistem pada Portal Satu Data Bulungan.",
  path: "/500",
  keywords: ["error 500", "gangguan sistem", "Satu Data Bulungan"],
});

export default function InternalServerErrorPage() {
  return (
    <StatusPage
      code="500"
      title="Terjadi Gangguan Sistem"
      description="Terjadi kendala di sisi layanan ketika memproses permintaan Anda."
      note="Kami sedang melakukan pemulihan, silakan coba beberapa saat lagi."
      primaryAction={{ href: "/", label: "Kembali ke Beranda" }}
      secondaryAction={{ href: "/error/500", label: "Buka Halaman Status" }}
    />
  );
}
