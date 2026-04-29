# 05 Public Hardening and Internal Role Architecture Blueprint

## Tujuan Dokumen

1. Menyediakan rencana implementasi detail per fase untuk peningkatan halaman publik.
2. Menyediakan draft arsitektur menu internal role-based (`admin`, `walidata`, `operator OPD`) yang selaras dengan peningkatan publik.
3. Menghilangkan ambiguity eksekusi dengan task ID, urutan, acceptance criteria, dan quality gate.

## Ringkasan Masalah Saat Ini (Baseline)

1. Masih ada tautan placeholder `#` di area publik.
2. CTA pada detail dataset berpotensi mengarah ke tautan kosong jika resource tidak lengkap.
3. Copy publik masih bercampur dengan teks teknis implementasi internal.
4. Halaman API publik masih menampilkan detail teknis yang sebaiknya dipindahkan ke internal.
5. Katalog masih menarik data besar ke memori (`rows=100`) lalu dipaginasi di aplikasi.
6. SEO halaman publik masih global, belum spesifik per halaman dan detail dataset.
7. Direktori OPD belum punya pencarian/filter untuk skala data lebih besar.
8. Jalur login internal belum memandu pengguna berdasarkan role.

## Prinsip Eksekusi

1. Tidak merusak route yang sudah aktif.
2. Setiap fase harus lolos quality gate dan punya rollback sederhana.
3. Perubahan UX harus berdampak terukur (minim broken link, lebih cepat, lebih jelas).
4. Rancangan internal role-based dimulai dari kontrol akses dan menu, lalu pendalaman modul.

## Fase 1 - Quick Wins Publik (1-2 hari)

### Daftar Task

| ID | Task | Owner Utama | Dependensi |
|---|---|---|---|
| P1-01 | Bersihkan semua `href="#"` pada header/footer/banner/detail dataset | FE | - |
| P1-02 | Hardening CTA detail dataset (`Unduh Data`, `Gunakan API`) berbasis tipe resource | FE | P1-01 |
| P1-03 | Revisi copy publik agar fokus manfaat pengguna | FE + PM | - |
| P1-04 | Buat halaman penghubung login internal berbasis role intent (tanpa ubah auth inti dulu) | FE | P1-01 |

### Urutan Eksekusi Teknis

1. `P1-01`: inventaris placeholder link lalu ganti ke route nyata atau komponen disabled-state.
2. `P1-02`: ubah pemilihan resource dari index array ke selector berbasis format.
3. `P1-03`: revisi copy di homepage, dataset, API, metadata agar user-facing.
4. `P1-04`: tambahkan halaman `Masuk Internal` yang menjelaskan peran dan tujuan.

### Kandidat File Sentuh

1. `web/src/components/portal/portal-header.tsx`
2. `web/src/components/portal/portal-footer.tsx`
3. `web/src/components/portal/integration-banner.tsx`
4. `web/src/app/dataset/[slug]/page.tsx`
5. `web/src/app/page.tsx`
6. `web/src/app/dataset/page.tsx`
7. `web/src/app/api/page.tsx`
8. `web/src/app/internal/*` (halaman penghubung login role intent)

### Acceptance Criteria

1. Tidak ada lagi `href="#"` pada UI publik.
2. Tombol `Unduh Data` dan `Gunakan API` tidak pernah mengarah ke URL kosong.
3. Copy utama tidak mengandung narasi teknis internal seperti `vertical slice` atau `fallback mock`.
4. Tombol `Login` mengarah ke halaman penghubung internal yang menjelaskan 3 peran.
5. Lint dan build sukses.

### Quality Gate Fase 1

1. `cd web && npm run lint`
2. `cd web && npm run build`
3. `cd web && npm run test:visual`
4. `cd web && npm run test:a11y`
5. Cek manual route: `/`, `/dataset`, `/dataset/[slug]`, `/api`, `/internal/workflow`

## Fase 2 - Public Information Architecture and Trust (3-5 hari)

### Daftar Task

| ID | Task | Owner Utama | Dependensi |
|---|---|---|---|
| P2-01 | Pisahkan konten API publik vs status integrasi internal | FE + BE | P1 selesai |
| P2-02 | Tambah SEO metadata per halaman + detail dataset | FE | P1 selesai |
| P2-03 | Tambah `sitemap.xml` dan `robots.txt` | FE | P2-02 |
| P2-04 | Tambah search/filter pada halaman Organisasi OPD | FE | P1 selesai |
| P2-05 | Normalisasi teks/encoding agar karakter separator konsisten | FE | P1 selesai |

### Urutan Eksekusi Teknis

1. `P2-01`: refactor `/api` jadi dokumentasi publik; status mode data dipindah ke internal.
2. `P2-02`: implement metadata dinamis untuk halaman publik utama dan detail dataset.
3. `P2-03`: publish sitemap/robots untuk indexing.
4. `P2-04`: implement search + filter badge di `/organisasi`.
5. `P2-05`: bersihkan karakter mojibake dan samakan separator tampilan.

### Kandidat File Sentuh

1. `web/src/app/api/page.tsx`
2. `web/src/app/layout.tsx`
3. `web/src/app/dataset/[slug]/page.tsx`
4. `web/src/app/organisasi/page.tsx`
5. `web/src/lib/utils/*` (jika perlu util metadata)
6. `web/src/app/robots.ts` (baru)
7. `web/src/app/sitemap.ts` (baru)

### Acceptance Criteria

1. Halaman `/api` hanya memuat dokumentasi konsumsi publik.
2. Detail status mode/konfigurasi integrasi tidak tampil di halaman publik.
3. Metadata title/description tiap halaman publik spesifik, bukan generik global.
4. Sitemap dan robots dapat diakses sukses.
5. Halaman OPD memiliki pencarian dan minimal 1 filter fungsional.
6. Tidak ada karakter teks rusak di UI.

### Quality Gate Fase 2

1. `cd web && npm run lint`
2. `cd web && npm run build`
3. `cd web && npm run test:visual`
4. `cd web && npm run test:a11y`
5. Cek manual route: `/api`, `/organisasi`, `/robots.txt`, `/sitemap.xml`

## Fase 3 - Scale and Data Delivery Hardening (4-7 hari)

### Daftar Task

| ID | Task | Owner Utama | Dependensi |
|---|---|---|---|
| P3-01 | Refactor adapter CKAN ke server-side pagination (`rows/start`) | BE + FE | P1-P2 selesai |
| P3-02 | Refactor service katalog agar tidak fetch massal untuk filter dan statistik | BE + FE | P3-01 |
| P3-03 | Tambah cache/TTL yang jelas untuk query katalog, filter options, dan stats | BE | P3-02 |
| P3-04 | Uji ketahanan dengan dataset >100 item dan validasi akurasi pagination | QA + BE | P3-01 |

### Urutan Eksekusi Teknis

1. `P3-01`: ubah kontrak list dataset agar menerima `page` dan `pageSize` ke adapter.
2. `P3-02`: sesuaikan halaman katalog dan service agar memanfaatkan data paginated.
3. `P3-03`: terapkan cache di level fetch/service sesuai pola Next.js.
4. `P3-04`: jalankan seed dataset besar lalu verifikasi jumlah, urutan, dan filter.

### Kandidat File Sentuh

1. `web/src/lib/adapters/dataset-adapter.ts`
2. `web/src/lib/adapters/ckan-dataset-adapter.ts`
3. `web/src/lib/adapters/mock-dataset-adapter.ts`
4. `web/src/lib/services/dataset-service.ts`
5. `web/src/app/dataset/page.tsx`
6. `scripts/seed-ckan-sample.mjs` (opsional enhancement)
7. `scripts/smoke-dual-mode.mjs`

### Acceptance Criteria

1. Katalog tetap benar saat total dataset >100.
2. Pagination server-side bekerja dan konsisten dengan filter/sort.
3. Waktu respons katalog turun atau tetap stabil pada data besar.
4. Tidak ada regresi route publik dan detail dataset.
5. Smoke test mock/ckan tetap pass.

### Quality Gate Fase 3

1. `cd web && npm run lint`
2. `cd web && npm run build`
3. `node scripts/smoke-dual-mode.mjs`
4. `node scripts/smoke-workflow-api.mjs`
5. Uji manual query: `/dataset?page=1&pageSize=9`, `/dataset?page=5&pageSize=9`

## Draft Arsitektur Menu Internal Role-Based

## Tujuan

1. Menyediakan menu internal yang berbeda per role tanpa duplikasi logika bisnis.
2. Menjaga satu pipeline workflow dataset bersama: `Draft -> Submitted -> Need Revision -> Approved -> Published -> Archived`.
3. Menyiapkan transisi bertahap dari Basic Auth tunggal ke multi-user role-aware.

## Definisi Role

1. `admin`: pengendali konfigurasi, pengguna, kebijakan, dan monitoring global.
2. `walidata`: validator kualitas data lintas OPD, pengambil keputusan verifikasi/publikasi.
3. `operator_opd`: penginput dan pemilik dataset OPD (draft, submit, revisi).

## Matriks Akses Ringkas

| Modul | Admin | Walidata | Operator OPD |
|---|---|---|---|
| Dashboard internal | Full | Full | Ringkas (hanya dataset sendiri) |
| Draft dataset | Full | View | Full (scope OPD sendiri) |
| Submit/revisi | Full | Full | Full (scope OPD sendiri) |
| Approve/Publish/Archive | Full | Full | Tidak |
| Audit trail global | Full | Full | View (scope OPD sendiri) |
| Manajemen user-role | Full | Tidak | Tidak |
| Pengaturan integrasi/konfigurasi | Full | View terbatas | Tidak |
| Master data referensi (topik, tag, OPD) | Full | Usul/edit terbatas | View |

## Rancangan Struktur Menu

### Menu Admin

1. Dashboard
2. Workflow Dataset
3. Audit dan Riwayat
4. Master Data
5. Pengguna dan Role
6. Integrasi Sistem
7. Pengaturan Publikasi

### Menu Walidata

1. Dashboard
2. Antrian Verifikasi
3. Workflow Dataset
4. Audit dan Riwayat
5. Kualitas Metadata
6. Laporan Publikasi

### Menu Operator OPD

1. Dashboard
2. Dataset Saya
3. Buat Draft
4. Revisi dan Catatan
5. Riwayat Pengajuan
6. Panduan Metadata

## Rancangan Route Internal (MVP)

1. `/internal` -> landing + role resolver
2. `/internal/dashboard`
3. `/internal/workflow`
4. `/internal/workflow/[slug]`
5. `/internal/workflow/[slug]/audit`
6. `/internal/master-data` (admin)
7. `/internal/users` (admin)
8. `/internal/integrations` (admin)
9. `/internal/quality` (walidata)
10. `/internal/my-datasets` (operator)

## Rancangan Teknis Implementasi Role (MVP -> Lanjutan)

### Tahap MVP (cepat, kompatibel dengan kondisi sekarang)

1. Tambah `role` pada konteks auth internal berbasis username Basic Auth mapping.
2. Tambah `nav config by role` dalam satu source of truth.
3. Proteksi route per role melalui middleware/proxy.
4. Terapkan filtering data berdasar role scope pada service workflow.

### Tahap Lanjutan

1. Migrasi dari Basic Auth ke session/token internal.
2. Persist user-role ke storage/DB.
3. Tambah audit event khusus akses role dan perubahan permission.

## Task Breakdown Arsitektur Role-Based

| ID | Task | Owner Utama | Dependensi |
|---|---|---|---|
| R1-01 | Definisikan enum role + permission di type system | BE + FE | - |
| R1-02 | Implement `nav config by role` | FE | R1-01 |
| R1-03 | Tambah middleware guard per route internal | BE | R1-01 |
| R1-04 | Sesuaikan workflow service untuk scope OPD per role | BE | R1-03 |
| R1-05 | Buat halaman `/internal` sebagai role landing | FE | R1-02 |
| R1-06 | Tambah test akses role (allow/deny) | QA | R1-03 |

## Acceptance Criteria Arsitektur Role-Based

1. Menu yang tampil berbeda sesuai role login.
2. Route sensitif admin tidak dapat diakses role lain (status 403/redirect).
3. Operator OPD hanya melihat dataset miliknya.
4. Walidata dapat mengakses verifikasi lintas OPD, namun tidak mengelola user-role.
5. Semua transisi workflow tetap tercatat audit trail.
6. Smoke test role access pass untuk skenario allow/deny utama.

## Rencana Eksekusi Gabungan (Publik + Internal)

1. Minggu 1: Fase 1 + `R1-01` dan `R1-02`.
2. Minggu 2: Fase 2 + `R1-03` dan `R1-05`.
3. Minggu 3: Fase 3 + `R1-04` dan `R1-06`.

## Definition of Done Dokumen Ini

1. Setiap task memiliki ID, owner, dependensi, dan acceptance criteria.
2. Urutan eksekusi jelas dari quick wins ke scale hardening.
3. Arsitektur internal role-based tersusun dan dapat diturunkan jadi backlog sprint.
