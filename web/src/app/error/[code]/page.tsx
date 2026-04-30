import type { Metadata } from "next";
import { StatusPage } from "@/components/portal/status-page";
import { buildPageMetadata } from "@/lib/utils/metadata";

interface ErrorCodePageProps {
  params: Promise<{
    code: string;
  }>;
}

type ErrorPreset = {
  title: string;
  description: string;
  note: string;
};

const ERROR_PRESETS: Record<string, ErrorPreset> = {
  "400": {
    title: "Permintaan Tidak Valid",
    description: "Permintaan tidak dapat diproses karena format data yang dikirim belum sesuai.",
    note: "Periksa kembali parameter atau isi formulir sebelum mencoba lagi.",
  },
  "401": {
    title: "Akses Memerlukan Autentikasi",
    description: "Halaman ini membutuhkan autentikasi sebelum bisa diakses.",
    note: "Silakan login atau kembali ke halaman publik.",
  },
  "403": {
    title: "Akses Ditolak",
    description: "Anda tidak memiliki izin untuk membuka halaman atau sumber data ini.",
    note: "Hubungi admin portal bila Anda merasa ini seharusnya dapat diakses.",
  },
  "404": {
    title: "Halaman Tidak Ditemukan",
    description: "Tautan yang Anda buka mungkin sudah dipindahkan, belum tersedia, atau alamat URL tidak valid.",
    note: "Silakan kembali ke beranda atau telusuri kembali katalog data.",
  },
  "429": {
    title: "Terlalu Banyak Permintaan",
    description: "Sistem menerima permintaan dalam jumlah tinggi dari sesi ini.",
    note: "Tunggu beberapa saat lalu coba kembali.",
  },
  "500": {
    title: "Terjadi Gangguan Sistem",
    description: "Terjadi kendala di sisi layanan ketika memproses permintaan Anda.",
    note: "Kami sedang melakukan pemulihan, silakan coba beberapa saat lagi.",
  },
  "502": {
    title: "Layanan Perantara Bermasalah",
    description: "Ada gangguan saat menghubungkan layanan portal dengan sumber data.",
    note: "Muat ulang halaman setelah beberapa saat.",
  },
  "503": {
    title: "Layanan Sementara Tidak Tersedia",
    description: "Portal sedang dalam pemeliharaan atau beban layanan sedang tinggi.",
    note: "Silakan kembali beberapa saat lagi.",
  },
  "504": {
    title: "Batas Waktu Permintaan Habis",
    description: "Permintaan membutuhkan waktu lebih lama dari batas yang diizinkan.",
    note: "Coba ulangi permintaan Anda dalam beberapa saat.",
  },
};

function getErrorPreset(code: string): ErrorPreset {
  return (
    ERROR_PRESETS[code] ?? {
      title: "Terjadi Kendala Layanan",
      description: "Portal belum dapat memproses permintaan ini untuk saat ini.",
      note: `Kode status ${code}. Silakan coba kembali dalam beberapa saat.`,
    }
  );
}

export async function generateMetadata({ params }: ErrorCodePageProps): Promise<Metadata> {
  const { code } = await params;
  const preset = getErrorPreset(code);

  return buildPageMetadata({
    title: `Error ${code}`,
    description: `${preset.title}. ${preset.description}`,
    path: `/error/${code}`,
    keywords: ["error page", `status ${code}`, "Satu Data Bulungan"],
  });
}

export default async function ErrorCodePage({ params }: ErrorCodePageProps) {
  const { code } = await params;
  const preset = getErrorPreset(code);

  return (
    <StatusPage
      code={code}
      title={preset.title}
      description={preset.description}
      note={preset.note}
      primaryAction={{ href: "/", label: "Kembali ke Beranda" }}
      secondaryAction={{ href: "/dataset", label: "Buka Katalog Dataset" }}
    />
  );
}
