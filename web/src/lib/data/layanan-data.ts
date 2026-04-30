import opdDirectory from "@/lib/data/opd-directory.json";

type DirectoryEntry = {
  name: string;
  email: string;
};

export type WalidataTarget = {
  id: string;
  label: string;
  email: string;
};

export type LayananFaqItem = {
  id: string;
  question: string;
  answer: string;
  details?: string[];
};

export type LayananFaqSection = {
  id: string;
  title: string;
  description: string;
  items: LayananFaqItem[];
};

export type LayananReference = {
  title: string;
  url: string;
  note: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildWalidataTargets(): WalidataTarget[] {
  const entries = opdDirectory as DirectoryEntry[];
  const byEmail = new Map<string, WalidataTarget>();

  const defaultTarget: WalidataTarget = {
    id: "walidata-kabupaten-bulungan",
    label: "Walidata Kabupaten Bulungan (Bappedalitbang)",
    email: "walidata@bulungankab.go.id",
  };

  byEmail.set(defaultTarget.email.toLowerCase(), defaultTarget);

  for (const entry of entries) {
    const email = (entry.email ?? "").trim().toLowerCase();
    if (!email) {
      continue;
    }

    if (byEmail.has(email)) {
      continue;
    }

    byEmail.set(email, {
      id: slugify(`${entry.name}-${email}`),
      label: `${entry.name} (Walidata/OPD)`,
      email,
    });
  }

  return Array.from(byEmail.values()).sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
}

export const walidataTargets: WalidataTarget[] = buildWalidataTargets();

export const layananFaqSections: LayananFaqSection[] = [
  {
    id: "permintaan-data",
    title: "Permintaan Data",
    description: "Pertanyaan umum tentang proses pengajuan permintaan data.",
    items: [
      {
        id: "permintaan-1",
        question: "Kapan saya perlu mengajukan permintaan data?",
        answer:
          "Ajukan permintaan ketika data yang Anda butuhkan belum tersedia, belum lengkap, atau memerlukan klarifikasi metadata sebelum dipakai.",
        details: [
          "Cek katalog dataset lebih dulu agar tidak mengajukan data yang sudah tersedia.",
          "Tuliskan indikator, periode, wilayah, dan format data yang dibutuhkan.",
          "Sebutkan tujuan pemanfaatan agar tim walidata bisa memprioritaskan verifikasi.",
        ],
      },
      {
        id: "permintaan-2",
        question: "Informasi minimal apa yang harus diisi dalam formulir permintaan?",
        answer:
          "Formulir membutuhkan identitas pemohon, instansi, kontak aktif, tujuan pemanfaatan, cakupan periode, serta deskripsi data yang diminta.",
        details: [
          "Nama pemohon dan email aktif wajib diisi.",
          "Deskripsi kebutuhan data harus spesifik, bukan hanya nama topik umum.",
          "Pilih walidata tujuan agar permintaan masuk ke unit yang tepat.",
        ],
      },
      {
        id: "permintaan-3",
        question: "Apakah saya bisa meminta lebih dari satu dataset dalam satu formulir?",
        answer:
          "Bisa, selama daftar kebutuhan masih satu konteks tujuan pemanfaatan yang sama dan dapat diverifikasi dalam satu alur review.",
        details: [
          "Pisahkan setiap indikator utama dengan poin terstruktur.",
          "Jika kebutuhan berasal dari domain berbeda, sebaiknya buat pengajuan terpisah.",
        ],
      },
      {
        id: "permintaan-4",
        question: "Bagaimana jika saya belum tahu nama dataset resminya?",
        answer:
          "Anda tetap bisa mengajukan dengan menjelaskan indikator, unit ukuran, cakupan wilayah, dan periode data yang dibutuhkan.",
      },
      {
        id: "permintaan-5",
        question: "Apakah permintaan saya langsung dipenuhi otomatis?",
        answer:
          "Tidak. Semua permintaan melalui proses verifikasi oleh walidata untuk memastikan legalitas, kualitas, ketersediaan, dan kesesuaian tujuan.",
      },
    ],
  },
  {
    id: "lisensi-dan-pemanfaatan",
    title: "Lisensi dan Pemanfaatan",
    description: "Aturan penggunaan, atribusi, dan batas pemanfaatan data.",
    items: [
      {
        id: "lisensi-1",
        question: "Bolehkah data digunakan untuk riset, aplikasi, atau dashboard publik?",
        answer:
          "Boleh selama mengikuti ketentuan lisensi pada dataset, menjaga konteks data, dan mencantumkan sumber resmi Pemerintah Kabupaten Bulungan.",
      },
      {
        id: "lisensi-2",
        question: "Apakah atribusi sumber data wajib dicantumkan?",
        answer:
          "Ya. Praktik atribusi adalah bagian penting dari penggunaan data terbuka yang bertanggung jawab dan menjaga keterlacakan sumber.",
      },
      {
        id: "lisensi-3",
        question: "Apakah semua dataset bebas dipakai tanpa batasan?",
        answer:
          "Tidak selalu. Beberapa dataset dapat memiliki pembatasan lisensi, sensitivitas, atau syarat penggunaan tertentu pada bagian metadata Access and Use.",
      },
      {
        id: "lisensi-4",
        question: "Bolehkah saya memodifikasi dan menggabungkan data dengan sumber lain?",
        answer:
          "Boleh jika lisensi mengizinkan, hasil olahan tidak menyesatkan, dan referensi sumber asli tetap dicantumkan secara jelas.",
      },
    ],
  },
  {
    id: "metadata-dan-kualitas",
    title: "Metadata dan Kualitas Data",
    description: "Pertanyaan tentang kualitas, standar, dan interpretasi data.",
    items: [
      {
        id: "kualitas-1",
        question: "Bagaimana saya menilai kualitas data sebelum dianalisis?",
        answer:
          "Periksa metadata utama: definisi indikator, cakupan wilayah, periode, frekuensi pembaruan, dan tanggal pembaruan terakhir.",
      },
      {
        id: "kualitas-2",
        question: "Mengapa angka antar dataset bisa terlihat berbeda?",
        answer:
          "Perbedaan sering terjadi karena definisi variabel, sumber produsen data, waktu rilis, dan metode kompilasi yang tidak identik.",
      },
      {
        id: "kualitas-3",
        question: "Apa yang harus dilakukan jika menemukan dugaan ketidaksesuaian data?",
        answer:
          "Kirimkan laporan melalui formulir permintaan data dengan menyebut dataset, indikator, baris yang diduga bermasalah, dan bukti pendukung.",
      },
      {
        id: "kualitas-4",
        question: "Apakah data selalu mutakhir setiap saat?",
        answer:
          "Tidak selalu real-time. Ketepatan waktu mengikuti frekuensi pembaruan pada metadata masing-masing dataset.",
      },
      {
        id: "kualitas-5",
        question: "Bagaimana keterkaitan portal ini dengan kebijakan Satu Data Indonesia?",
        answer:
          "Portal mengadopsi prinsip SDI: data terstandar, memiliki metadata, interoperabel, dan mudah dibagi-pakaikan antar instansi.",
      },
    ],
  },
  {
    id: "api-publik",
    title: "API Publik",
    description: "Panduan teknis untuk integrasi API yang tersedia secara publik.",
    items: [
      {
        id: "api-1",
        question: "Endpoint publik apa yang tersedia langsung dari aplikasi ini?",
        answer:
          "Endpoint publik internal aplikasi saat ini adalah `GET /api/infografis` untuk daftar infografis terkurasi.",
      },
      {
        id: "api-2",
        question: "Apa parameter untuk endpoint /api/infografis?",
        answer: "Parameter yang didukung: `page`, `limit`, dan `source` (`auto`, `ckan`, `live`).",
        details: [
          "`page` dan `limit` harus bilangan positif.",
          "`limit` dibatasi untuk menghindari beban berlebihan.",
          "`source` invalid akan dikembalikan sebagai error validasi.",
        ],
      },
      {
        id: "api-3",
        question: "Bagaimana status keberhasilan API dibaca?",
        answer:
          "Periksa field `success` di body respons JSON. Untuk integrasi CKAN, status HTTP 200 belum selalu berarti request bisnis sukses.",
      },
      {
        id: "api-4",
        question: "Endpoint CKAN apa yang digunakan proyek ini?",
        answer:
          "Saat mode CKAN aktif, aplikasi memakai Action API CKAN seperti `package_search`, `package_show`, dan `datastore_search` untuk resource yang mendukung DataStore.",
      },
      {
        id: "api-5",
        question: "Apakah API internal admin ikut dipublikasikan?",
        answer:
          "Tidak. Endpoint dengan namespace `/api/internal/*` adalah area internal dan tidak didokumentasikan sebagai API publik.",
      },
    ],
  },
  {
    id: "keamanan-dan-privasi",
    title: "Keamanan dan Privasi",
    description: "Praktik aman saat memakai API dan mengajukan permintaan data.",
    items: [
      {
        id: "security-1",
        question: "Data pribadi apa yang diproses saat mengirim formulir permintaan data?",
        answer:
          "Hanya data identitas dan kontak yang Anda isi sendiri untuk kebutuhan tindak lanjut permintaan oleh walidata.",
      },
      {
        id: "security-2",
        question: "Bagaimana portal mengurangi risiko penyalahgunaan endpoint formulir?",
        answer:
          "Endpoint menerapkan validasi input ketat, pemeriksaan asal request, pembatasan laju, dan pembersihan teks sebelum disimpan.",
      },
      {
        id: "security-3",
        question: "Mengapa request saya bisa ditolak dengan status 429?",
        answer:
          "Status 429 menandakan terlalu banyak permintaan dalam waktu singkat. Tunggu beberapa saat sebelum mengirim ulang.",
      },
      {
        id: "security-4",
        question: "Apakah token atau kredensial API harus ditaruh di browser publik?",
        answer:
          "Tidak. Kredensial sensitif wajib disimpan di server atau environment variable, bukan di sisi klien.",
      },
      {
        id: "security-5",
        question: "Apakah saya boleh mengotomasi scraping terhadap endpoint publik?",
        answer:
          "Gunakan akses secara wajar, patuhi batas laju, dan hindari pola trafik yang mengganggu ketersediaan layanan publik.",
      },
    ],
  },
  {
    id: "integrasi-dan-troubleshooting",
    title: "Integrasi dan Troubleshooting",
    description: "Masalah umum implementasi dan cara penanganannya.",
    items: [
      {
        id: "troubleshoot-1",
        question: "Kenapa halaman klien menampilkan data kosong padahal API hidup?",
        answer:
          "Pastikan parameter query benar, cek field `success`, dan validasi bahwa data sumber memang tersedia pada halaman yang diminta.",
      },
      {
        id: "troubleshoot-2",
        question: "Apa praktik terbaik untuk pagination?",
        answer:
          "Gunakan `page` bertahap, batasi `limit` sesuai kebutuhan, dan simpan checkpoint halaman agar mudah retry bila jaringan terputus.",
      },
      {
        id: "troubleshoot-3",
        question: "Bagaimana jika saya menerima error validasi parameter?",
        answer:
          "Periksa tipe data query, rentang nilai, dan daftar nilai yang diizinkan pada dokumentasi endpoint terkait.",
      },
      {
        id: "troubleshoot-4",
        question: "Apa format terbaik untuk konsumsi lintas aplikasi?",
        answer:
          "JSON umumnya paling aman untuk integrasi aplikasi. Gunakan CSV/XLSX bila kebutuhan utama adalah analisis tabular manual.",
      },
      {
        id: "troubleshoot-5",
        question: "Bagaimana cara eskalasi jika kebutuhan data sangat mendesak?",
        answer:
          "Gunakan formulir permintaan data dengan informasi urgensi yang jelas dan cantumkan tenggat penggunaan agar tim walidata dapat melakukan triase prioritas.",
      },
    ],
  },
];

export const layananReferenceLinks: LayananReference[] = [
  {
    title: "CKAN API Guide (v2.11)",
    url: "https://docs.ckan.org/en/2.11/api/",
    note: "Rujukan Action API seperti package_search dan package_show.",
  },
  {
    title: "CKAN DataStore Extension (v2.11)",
    url: "https://docs.ckan.org/en/2.11/maintaining/datastore.html",
    note: "Rujukan parameter datastore_search, filters, limit, dan offset.",
  },
  {
    title: "Data.gov User Guide",
    url: "https://data.gov/user-guide/",
    note: "Rujukan praktik lisensi dan bagian Access and Use.",
  },
  {
    title: "Portal Satu Data Indonesia - Tentang",
    url: "https://data.go.id/about",
    note: "Rujukan konteks kebijakan SDI dan Perpres 39/2019.",
  },
  {
    title: "Open Definition",
    url: "https://opendefinition.org/",
    note: "Rujukan prinsip data terbuka dan keterpakaiannya.",
  },
  {
    title: "Creative Commons: Reusing CC-Licensed Content",
    url: "https://creativecommons.org/reusing-cc-licensed-content/",
    note: "Rujukan praktik atribusi konten/data berlisensi terbuka.",
  },
  {
    title: "OWASP API Security Top 10 (2023)",
    url: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/",
    note: "Rujukan risiko keamanan API, termasuk resource consumption.",
  },
];

export const requestPurposeOptions = [
  "Riset akademik",
  "Perencanaan program",
  "Monitoring dan evaluasi",
  "Layanan publik",
  "Pengembangan aplikasi",
  "Jurnalisme data",
  "Lainnya",
] as const;

export const dataFormatOptions = [
  "JSON",
  "CSV",
  "XLSX",
  "PDF",
  "API (endpoint)",
  "Belum ditentukan",
] as const;
