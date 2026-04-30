import type {
  Dataset,
  DatasetFormat,
  DatasetFrequency,
  DatasetMetadata,
  DatasetStatus,
} from "@/lib/types/dataset";

interface MockSeedInput {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  topic: string;
  organization: string;
  formats: DatasetFormat[];
  frequency: DatasetFrequency;
  status: DatasetStatus;
  lastUpdated: string;
  period: string;
  tags: string[];
  popularityScore: number;
  viewCount: number;
  downloadCount: number;
  relatedSlugs: string[];
}

function buildMetadata(seed: MockSeedInput): DatasetMetadata {
  return {
    identifier: seed.id,
    opd: seed.organization,
    walidata: "DKIP / Bappedalitbang",
    coverage: "Kabupaten Bulungan",
    period: seed.period,
    license: "Data Terbuka Pemerintah",
    status: seed.status,
    frequency: seed.frequency,
    lastUpdated: seed.lastUpdated,
    tags: seed.tags,
  };
}

function buildSeed(seed: MockSeedInput): Dataset {
  const [firstFormat, secondFormat = firstFormat] = seed.formats;

  return {
    ...seed,
    metadata: buildMetadata(seed),
    resources: [
      {
        id: `${seed.id}-resource-1`,
        name: `${seed.slug}.${firstFormat.toLowerCase()}`,
        description: `Data utama ${seed.title}`,
        format: firstFormat,
        url: `/api/mock/resources/${seed.slug}/${firstFormat.toLowerCase()}`,
        sizeLabel: firstFormat === "API" ? "JSON" : "1.2 MB",
        lastUpdated: seed.lastUpdated,
      },
      {
        id: `${seed.id}-resource-2`,
        name: `package_show?id=${seed.id}`,
        description: "Endpoint metadata CKAN-style",
        format: "API",
        url: `/api/3/action/package_show?id=${seed.id}`,
        sizeLabel: "JSON",
        lastUpdated: seed.lastUpdated,
      },
      {
        id: `${seed.id}-resource-3`,
        name: `metadata_${seed.slug}.pdf`,
        description: "Dokumentasi metadata",
        format: secondFormat === "API" ? "PDF" : secondFormat,
        url: `/api/mock/resources/${seed.slug}/metadata`,
        sizeLabel: "420 KB",
      },
    ],
    preview: {
      points: [
        { label: "Jan", value: 12 },
        { label: "Feb", value: 16 },
        { label: "Mar", value: 19 },
        { label: "Apr", value: 18 },
        { label: "Mei", value: 23 },
        { label: "Jun", value: 26 },
        { label: "Jul", value: 31 },
        { label: "Agu", value: 28 },
      ],
      rows: [
        { area: "Tanjung Selor", male: 27420, female: 25970, total: 53390 },
        { area: "Tanjung Palas", male: 14120, female: 13505, total: 27625 },
        { area: "Peso", male: 8940, female: 8621, total: 17561 },
        { area: "Sekatak", male: 7532, female: 7438, total: 14970 },
      ],
      insights: [
        { label: "Nilai tertinggi", value: "53.390", description: "Tanjung Selor menjadi wilayah terbesar." },
        { label: "Nilai terendah", value: "14.970", description: "Sekatak tercatat sebagai nilai terendah." },
        { label: "API siap", value: "Aktif", description: "Endpoint data siap untuk integrasi aplikasi lain." },
      ],
    },
  };
}

export const mockDatasets: Dataset[] = [
  buildSeed({
    id: "BLG-KEP-001",
    slug: "jumlah-penduduk-per-kecamatan-2025",
    title: "Jumlah Penduduk per Kecamatan 2025",
    summary: "Distribusi jumlah penduduk Bulungan per kecamatan, jenis kelamin, dan kelompok umur.",
    description:
      "Dataset kependudukan resmi yang menampilkan jumlah penduduk per kecamatan di Kabupaten Bulungan tahun 2025.",
    topic: "Kependudukan",
    organization: "Dinas Kependudukan dan Pencatatan Sipil",
    formats: ["CSV", "API"],
    frequency: "Tahunan",
    status: "Published",
    lastUpdated: "2026-01-12",
    period: "2021-2025",
    tags: ["penduduk", "kecamatan", "demografi"],
    popularityScore: 98,
    viewCount: 7214,
    downloadCount: 2011,
    relatedSlugs: ["data-sekolah-dan-peserta-didik", "peta-sebaran-fasilitas-kesehatan"],
  }),
  buildSeed({
    id: "BLG-KES-003",
    slug: "peta-sebaran-fasilitas-kesehatan",
    title: "Fasilitas Kesehatan dan Puskesmas",
    summary: "Daftar fasilitas kesehatan, jenis layanan, dan distribusi tenaga medis per kecamatan.",
    description:
      "Dataset ini mencakup fasilitas kesehatan tingkat kabupaten hingga kecamatan, termasuk puskesmas, klinik, dan rumah sakit. Informasi dipakai untuk analisis akses layanan kesehatan dan pemerataan tenaga kesehatan.",
    topic: "Kesehatan",
    organization: "Dinas Kesehatan",
    formats: ["XLSX", "API"],
    frequency: "Bulanan",
    status: "Published",
    lastUpdated: "2026-01-10",
    period: "2024-2026",
    tags: ["kesehatan", "puskesmas", "tenaga-medis"],
    popularityScore: 95,
    viewCount: 6689,
    downloadCount: 1760,
    relatedSlugs: ["jumlah-penduduk-per-kecamatan-2025", "realisasi-umkm-dan-ekonomi-kreatif"],
  }),
  buildSeed({
    id: "BLG-EKO-006",
    slug: "realisasi-umkm-dan-ekonomi-kreatif",
    title: "Realisasi UMKM dan Ekonomi Kreatif",
    summary: "Data capaian pelaku UMKM, pembinaan, dan persebaran sektor ekonomi kreatif.",
    description:
      "Data realisasi program UMKM di Bulungan yang memuat jumlah pelaku, skema pembinaan, dan perkembangan sektor ekonomi kreatif. Dataset mendukung pemantauan program pemulihan ekonomi daerah.",
    topic: "Ekonomi",
    organization: "Dinas Perindustrian, Perdagangan, Koperasi dan UMKM",
    formats: ["CSV", "PDF"],
    frequency: "Triwulanan",
    status: "Published",
    lastUpdated: "2026-01-08",
    period: "2025-2026",
    tags: ["umkm", "ekonomi-kreatif", "koperasi"],
    popularityScore: 90,
    viewCount: 6090,
    downloadCount: 1499,
    relatedSlugs: ["peta-sebaran-fasilitas-kesehatan", "indeks-kualitas-lingkungan-hidup"],
  }),
  buildSeed({
    id: "BLG-PDK-004",
    slug: "data-sekolah-dan-peserta-didik",
    title: "Data Sekolah dan Peserta Didik",
    summary: "Informasi satuan pendidikan, jumlah siswa, rombongan belajar, dan rasio guru.",
    description:
      "Dataset pendidikan memuat daftar sekolah tingkat dasar hingga menengah, jumlah peserta didik, serta rasio guru. Data dipakai untuk pemetaan layanan pendidikan dan intervensi sarana prasarana.",
    topic: "Pendidikan",
    organization: "Dinas Pendidikan dan Kebudayaan",
    formats: ["CSV", "XLSX"],
    frequency: "Semesteran",
    status: "Published",
    lastUpdated: "2026-01-07",
    period: "2024-2026",
    tags: ["pendidikan", "sekolah", "peserta-didik"],
    popularityScore: 88,
    viewCount: 5843,
    downloadCount: 1427,
    relatedSlugs: ["jumlah-penduduk-per-kecamatan-2025", "realisasi-umkm-dan-ekonomi-kreatif"],
  }),
  buildSeed({
    id: "BLG-INF-007",
    slug: "kondisi-jalan-dan-jembatan-kabupaten",
    title: "Kondisi Jalan dan Jembatan Kabupaten",
    summary: "Panjang jalan, kondisi mantap, serta inventaris jembatan strategis kabupaten.",
    description:
      "Dataset infrastruktur jalan dan jembatan berisi panjang ruas, status kemantapan, dan lokasi prioritas pemeliharaan. Data digunakan untuk perencanaan pembangunan infrastruktur transportasi.",
    topic: "Infrastruktur",
    organization: "Dinas Perumahan Rakyat dan kawasan permukiman",
    formats: ["XLSX", "API"],
    frequency: "Tahunan",
    status: "Published",
    lastUpdated: "2026-01-05",
    period: "2022-2026",
    tags: ["jalan", "jembatan", "infrastruktur"],
    popularityScore: 82,
    viewCount: 5032,
    downloadCount: 1276,
    relatedSlugs: ["indeks-kualitas-lingkungan-hidup", "realisasi-umkm-dan-ekonomi-kreatif"],
  }),
  buildSeed({
    id: "BLG-LHK-010",
    slug: "indeks-kualitas-lingkungan-hidup",
    title: "Indeks Kualitas Lingkungan Hidup",
    summary: "Indeks kualitas udara, air, dan tutupan lahan per kecamatan prioritas.",
    description:
      "Dataset lingkungan hidup memuat indikator kualitas udara, kualitas air, dan tutupan lahan. Data digunakan untuk monitoring lingkungan, pelaporan indikator SDGs, dan kebijakan pembangunan hijau.",
    topic: "Lingkungan",
    organization: "Dinas Lingkungan Hidup",
    formats: ["CSV", "API"],
    frequency: "Tahunan",
    status: "Published",
    lastUpdated: "2026-01-03",
    period: "2021-2025",
    tags: ["lingkungan", "iklh", "sdgs"],
    popularityScore: 79,
    viewCount: 4707,
    downloadCount: 1180,
    relatedSlugs: ["kondisi-jalan-dan-jembatan-kabupaten", "realisasi-umkm-dan-ekonomi-kreatif"],
  }),
  buildSeed({
    id: "BLG-SOS-009",
    slug: "penerima-bantuan-sosial-daerah",
    title: "Penerima Bantuan Sosial Daerah",
    summary: "Rekap keluarga penerima manfaat berdasarkan kecamatan dan jenis bantuan.",
    description:
      "Dataset bantuan sosial daerah yang merangkum jumlah keluarga penerima manfaat, jenis bantuan, dan cakupan wilayah. Data dipakai untuk evaluasi ketepatan sasaran program perlindungan sosial.",
    topic: "Kependudukan",
    organization: "Dinas Sosial",
    formats: ["CSV", "PDF"],
    frequency: "Bulanan",
    status: "Published",
    lastUpdated: "2026-01-02",
    period: "2025-2026",
    tags: ["bansos", "kemiskinan", "perlindungan-sosial"],
    popularityScore: 77,
    viewCount: 4368,
    downloadCount: 1044,
    relatedSlugs: ["jumlah-penduduk-per-kecamatan-2025", "peta-sebaran-fasilitas-kesehatan"],
  }),
  buildSeed({
    id: "BLG-PGN-012",
    slug: "produksi-pangan-dan-hortikultura",
    title: "Produksi Pangan dan Hortikultura",
    summary: "Produksi komoditas unggulan pertanian dan hortikultura tingkat kecamatan.",
    description:
      "Data produksi pangan utama dan hortikultura yang diperbarui berkala. Dataset bermanfaat untuk analisis ketahanan pangan, rantai distribusi, dan dukungan kebijakan pertanian berkelanjutan.",
    topic: "Ekonomi",
    organization: "Dinas Pertanian",
    formats: ["XLSX", "API"],
    frequency: "Triwulanan",
    status: "Published",
    lastUpdated: "2025-12-30",
    period: "2024-2026",
    tags: ["pangan", "hortikultura", "pertanian"],
    popularityScore: 75,
    viewCount: 3982,
    downloadCount: 998,
    relatedSlugs: ["realisasi-umkm-dan-ekonomi-kreatif", "indeks-kualitas-lingkungan-hidup"],
  }),
];
