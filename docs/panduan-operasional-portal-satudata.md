# Panduan Operasional Portal Satu Data Bulungan

## 1. Gambaran cara aplikasi berjalan

Portal ini berjalan dalam dua mode sumber data:

- `mock`: data dibaca dari store lokal bersama (`.local/internal-portal-store.json`), cocok untuk pengembangan lokal.
- `ckan`: data dibaca/ditulis ke backend CKAN (termasuk upload konten internal).

Konfigurasi utama ada di environment (`web/.env.local`):

- `DATA_SOURCE_MODE=mock|ckan`
- `NEXT_PUBLIC_CKAN_BASE_URL` / `CKAN_BASE_URL`
- `CKAN_API_KEY` (wajib untuk aksi upload/ubah data di CKAN)

Alur sinkronisasi inti:

1. User internal login di `/internal`.
2. Aksi internal (buat draft, edit, transisi status, upload konten) diproses lewat endpoint `/api/internal/*`.
3. Dataset yang berstatus `Published` akan muncul di halaman publik (`/dataset`, `/dataset/[slug]`) pada request berikutnya.
4. Pengunjung publik mengakses data via UI publik atau endpoint API publik (`/api/infografis`, endpoint CKAN yang didokumentasikan di `/api`).

## 2. Peran dan hak akses

Role aktif:

- `admin`
- `walidata`
- `operator_opd`

Ringkasan hak akses:

- Admin:
  - Akses penuh modul internal.
  - Bisa transisi semua status workflow.
  - Bisa ubah pengaturan portal (`/internal/settings`).
- Walidata:
  - Fokus validasi/kurasi/publikasi lintas OPD.
  - Bisa: `Submitted -> Need Revision|Approved`, `Approved -> Published`, `Published -> Archived`.
- Operator OPD:
  - Fokus data organisasinya sendiri.
  - Bisa buat draft, edit dataset miliknya, submit/re-submit ke review.
  - Tidak bisa approve/publish/archive.

## 3. Alur kerja per persona

### A. Operator OPD

Tujuan: input dan ajukan dataset OPD ke walidata.

Alur kerja:

1. Login di `/internal`.
2. Buka `/internal/datasets/new` untuk membuat draft.
3. Isi metadata dataset + resource minimum.
4. Simpan draft (status awal: `Draft`).
5. Saat siap review, kirim ke `Submitted` dari board `/internal/workflow`.
6. Jika direvisi walidata (`Need Revision`), perbaiki isi, lalu ajukan ulang ke `Submitted`.

Checklist minimum sebelum submit:

- Judul, ringkasan, deskripsi jelas.
- Topik dan organisasi benar.
- Frekuensi dan periode valid.
- Resource utama tersedia (nama + format + URL atau konten upload, tergantung jalur).

### B. Walidata

Tujuan: verifikasi kualitas, konsistensi metadata, dan publikasi.

Alur kerja:

1. Login internal.
2. Buka `/internal/workflow` untuk melihat antrian `Submitted`.
3. Review metadata/resource:
   - Jika belum layak: `Submitted -> Need Revision` + catatan revisi.
   - Jika layak: `Submitted -> Approved`.
4. Publikasikan: `Approved -> Published`.
5. Jika dataset sudah tidak dipakai: `Published -> Archived`.

Monitoring:

- `/internal/monitoring` untuk ringkasan kualitas dan audit.
- `/internal/workflow-history` dan `/internal/workflow/[slug]/audit` untuk jejak status.

### C. Admin

Tujuan: pengendali global platform.

Alur kerja:

1. Memantau dashboard lintas konten (`dataset/infografis/publikasi`).
2. Mengelola workflow bila perlu override.
3. Cek users/roles (`/internal/users`), organisasi, topik, integrasi.
4. Mengubah pengaturan portal (`/internal/settings`) jika dibutuhkan.

Catatan:

- Hanya admin yang bisa `PATCH /api/internal/settings`.

### D. Pengunjung Publik

Tujuan: mencari, membaca, unduh, dan memanfaatkan data.

Alur publik:

1. Buka `/dataset`.
2. Gunakan search/filter (`topic`, `organization`, `year`) + sort + pagination.
3. Buka detail dataset di `/dataset/[slug]`.
4. Dari tab resource:
   - Unduh file (CSV/XLSX/PDF/JSON).
   - Salin link API resource (format `API`).
5. Akses publikasi:
   - Berita: `/publikasi-berita`
   - Infografis: `/publikasi/infografis`
   - Buku digital: `/publikasi-buku-digital`
6. Jika data belum tersedia, ajukan melalui `/layanan-data/permintaan-data`.

## 4. Alur dataset: status dan transisi resmi

Urutan status:

- `Draft -> Submitted -> Need Revision -> Submitted -> Approved -> Published -> Archived`

Aturan transisi sistem:

- `Draft` hanya boleh ke `Submitted`
- `Submitted` boleh ke `Need Revision` atau `Approved`
- `Need Revision` hanya boleh ke `Submitted`
- `Approved` hanya boleh ke `Published`
- `Published` hanya boleh ke `Archived`

Jika transisi tidak sesuai aturan di atas, API akan menolak.

## 5. Jalur input data (2 jalur utama)

## 5.1 Jalur A: Draft workflow internal (metadata + URL resource)

Dipakai untuk proses kurasi internal bertahap.

UI: `/internal/datasets/new`

API: `POST /api/internal/workflow/draft`

Field wajib:

- `title`
- `summary`
- `organization`
- `topic`
- `frequency` (`Harian|Bulanan|Triwulanan|Semesteran|Tahunan`)
- `period`
- `walidata`
- `resourceName`
- `resourceFormat` (`CSV|XLSX|PDF|API|JSON`)
- `resourceUrl`

Contoh payload:

```json
{
  "title": "Draft Ketersediaan Air Bersih 2026",
  "slug": "draft-ketersediaan-air-bersih-2026",
  "summary": "Draft awal indikator ketersediaan air bersih.",
  "description": "Data ketersediaan air bersih per kecamatan.",
  "organization": "Dinas PUPR Bulungan",
  "ownerOrgSlug": "dinas-pupr",
  "topic": "Infrastruktur",
  "frequency": "Tahunan",
  "period": "2026",
  "walidata": "Diskominfo Bulungan",
  "coverage": "Kabupaten Bulungan",
  "resourceName": "air-bersih-2026.csv",
  "resourceFormat": "CSV",
  "resourceUrl": "https://example.com/air-bersih-2026.csv"
}
```

## 5.2 Jalur B: Upload langsung ke CKAN (dataset/infografis/publikasi)

Dipakai untuk unggah konten langsung ke backend CKAN.

UI: `/internal/uploads`

API:

- `POST /api/internal/uploads/dataset`
- `POST /api/internal/uploads/infografis`
- `POST /api/internal/uploads/publikasi`

Field wajib utama:

- `title`
- `notes`
- `ownerOrgId`
- `resourceName`
- `resourceFormat`
- `resourceContent`
- `resourceFileName`

Field tambahan penting:

- `topic`, `tags[]`, `year`, `period`, `frequency`, `status`
- `resourceDescription`

Contoh payload upload dataset:

```json
{
  "title": "Jumlah Penduduk per Kecamatan 2025",
  "notes": "Dataset resmi kependudukan 10 kecamatan.",
  "ownerOrgId": "opd-disdukcapil",
  "topic": "Kependudukan",
  "tags": ["penduduk", "kecamatan", "bulungan"],
  "year": "2025",
  "period": "2025",
  "frequency": "Tahunan",
  "status": "Published",
  "resourceName": "penduduk-2025.csv",
  "resourceFormat": "CSV",
  "resourceDescription": "Resource unggahan dari dashboard internal.",
  "resourceContent": "kecamatan,tahun,nilai\nTanjung Selor,2025,123\nTanjung Palas,2025,98",
  "resourceFileName": "penduduk-2025.csv"
}
```

Catatan role di upload:

- Admin/Walidata: bisa upload lintas organisasi.
- Operator OPD: hanya boleh `ownerOrgId` miliknya sendiri.

## 6. Format data yang dianjurkan

## 6.1 Dataset tabular (CSV)

Struktur minimum contoh:

```csv
kecamatan,tahun,nilai
Tanjung Selor,2025,123
Tanjung Palas,2025,98
```

Praktik baik:

- Gunakan header konsisten.
- Pastikan kolom wilayah/periode jelas.
- Hindari campur format angka (misal titik/koma tidak konsisten).

## 6.2 Infografis

Jalur sistem saat ini:

- Publikasi infografis publik utama membaca dari endpoint `/api/infografis`.
- Endpoint bisa mengambil dari `source=auto|ckan|live`.
- Untuk halaman publikasi infografis saat ini, source dipaksa `live` (DKIP).

Jika upload ke CKAN, gunakan `content_type=infografis` (diset oleh backend upload internal).

## 6.3 Buku digital / publikasi

- Disimpan di CKAN sebagai dataset dengan `content_type=publikasi`.
- Umumnya resource format `PDF` atau `JSON`.
- Halaman publik: `/publikasi-buku-digital`.

## 6.4 Berita

Sumber berita saat ini bukan dari API upload internal, tetapi dari file lokal:

- Folder: `web/public/berita`
- Pola file:
  - `<slug>.txt` (baris 1 URL sumber, baris 2 judul, baris berikutnya isi ringkas)
  - `<slug>.jpg|jpeg|png|webp` (gambar berita)

Jika pasangan `.txt` atau gambar tidak lengkap, item berita bisa tidak tampil.

## 7. Verifikasi data dan audit

## 7.1 Verifikasi status workflow

Gunakan board `/internal/workflow` untuk:

- lihat dataset per status,
- jalankan transisi status sesuai role,
- tambah catatan review (khusus transisi tertentu).

## 7.2 Audit trail detail

Halaman audit per dataset: `/internal/workflow/[slug]/audit`

Fitur:

- filter by `actor`, `status`, `dateFrom`, `dateTo`
- export audit:
  - JSON: `GET /api/internal/workflow/[slug]/audit/export?format=json`
  - CSV: `GET /api/internal/workflow/[slug]/audit/export?format=csv`

## 7.3 Monitoring kualitas

Halaman `/internal/monitoring` menampilkan:

- dataset yang perlu perhatian (`Need Revision`/score rendah),
- ringkasan audit terbaru,
- indikator metadata/quality.

## 8. Cara user publik mengakses data, download, API

## 8.1 Akses katalog dan filter

- URL: `/dataset`
- Query yang dipakai UI: `q`, `topic`, `organization`, `year`, `sort`, `page`, `pageSize`

Contoh:

- `/dataset?q=penduduk&topic=Kependudukan&year=2025&sort=terbaru&page=1&pageSize=10`

## 8.2 Download resource

Di detail dataset (`/dataset/[slug]`):

- Resource format `CSV/XLSX/PDF/JSON` muncul tombol unduh.
- Resource format `API` muncul tombol salin link API.

## 8.3 API publik

Endpoint aplikasi:

- `GET /api/infografis?page=1&limit=12&source=auto|ckan|live`

Endpoint pengajuan data publik:

- `POST /api/data-requests`

Validasi request data publik mencakup:

- email valid,
- panjang minimal beberapa field,
- periode tanggal valid,
- rate limit,
- origin check,
- honeypot anti-bot.

## 8.4 Endpoint CKAN yang didokumentasikan untuk konsumsi

- `GET <CKAN_BASE_URL>/api/3/action/package_search`
- `GET <CKAN_BASE_URL>/api/3/action/package_show?id=<slug>`
- `GET <CKAN_BASE_URL>/api/3/action/datastore_search?resource_id=<id>`

## 9. Operasional harian yang disarankan

Untuk Operator OPD:

1. Buat/rapikan draft tiap hari.
2. Pastikan metadata minimum lengkap.
3. Submit hanya jika resource sudah valid.

Untuk Walidata:

1. Cek antrian `Submitted`.
2. Beri keputusan cepat (revise/approve) + catatan jelas.
3. Publish dataset yang lolos.

Untuk Admin:

1. Pantau monitoring + audit.
2. Jaga konsistensi users/roles.
3. Cek integrasi CKAN dan kualitas metadata lintas OPD.

Untuk Publik:

1. Cari di katalog dulu.
2. Gunakan resource/API yang tersedia.
3. Jika belum ada, kirim permintaan data dengan deskripsi yang spesifik.

## 10. Catatan implementasi saat ini

- Internal login mencoba akun CKAN terlebih dulu, lalu fallback ke store lokal internal bila perlu.
- Akun contoh di UI login bisa berbeda dengan akun seed lokal standar; sesuaikan dengan sumber akun aktif (CKAN atau local store).
- Halaman publik dataset hanya menampilkan data yang sudah `Published`.
- Endpoint `/api/internal/*` adalah area internal, bukan untuk publik umum.
