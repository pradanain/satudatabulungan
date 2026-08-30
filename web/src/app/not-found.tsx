import { StatusPage } from "@/components/portal/status-page";

export default function NotFound() {
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
