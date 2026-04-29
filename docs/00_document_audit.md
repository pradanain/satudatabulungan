# 00 Document Audit

## Ruang Lingkup Audit

Audit dilakukan terhadap seluruh isi folder:

- `references/` (read-only)

Pendekatan:

1. Ekstraksi isi dokumen teks dari file `.docx` (PRD, FSD, SRS, Style Guide, Keputusan Arsitektur).
2. Review visual terhadap mockup desktop/mobile.
3. Review aset visual utama (logo, motif, ilustrasi, landmark).
4. Pemetaan requirement ke implementasi fase 1.

## Daftar File Master Package

- `00_README.txt`
- `01_PRD/PRD_Portal_Satu_Data_Bulungan.docx`
- `01_PRD/PRD_Portal_Satu_Data_Bulungan.pdf`
- `02_FSD/FSD_Portal_Satu_Data_Bulungan.docx`
- `02_FSD/FSD_Portal_Satu_Data_Bulungan.pdf`
- `03_SRS/SRS_Portal_Satu_Data_Bulungan.docx`
- `03_SRS/SRS_Portal_Satu_Data_Bulungan.pdf`
- `04_Mockup/01_Desktop/Mockup_Homepage_Satu_Data_Bulungan.png`
- `04_Mockup/01_Desktop/Mockup_Katalog_Dataset_Satu_Data_Bulungan.png`
- `04_Mockup/01_Desktop/Mockup_Detail_Dataset_Satu_Data_Bulungan.png`
- `04_Mockup/01_Desktop/Mockup_Satu_Data_Bulungan_3_Halaman.pdf`
- `04_Mockup/02_Mobile/Mockup_Mobile_Homepage_Satu_Data_Bulungan.png`
- `04_Mockup/02_Mobile/Mockup_Mobile_Katalog_Dataset_Satu_Data_Bulungan.png`
- `04_Mockup/02_Mobile/Mockup_Mobile_Detail_Dataset_Satu_Data_Bulungan.png`
- `04_Mockup/02_Mobile/Mockup_Mobile_Satu_Data_Bulungan_All.png`
- `05_Style/Style_Guide_Satu_Data_Bulungan.docx`
- `05_Style/Style_Guide_Satu_Data_Bulungan.pdf`
- `06_Assets/*` (logo, lambang, motif, ilustrasi karakter, landmark)
- `07_Lainnya/Keputusan_Teknologi_dan_Arsitektur_Portal_Satu_Data_Bulungan_v1.0.docx`
- `07_Lainnya/Keputusan_Teknologi_dan_Arsitektur_Portal_Satu_Data_Bulungan_v1.0.pdf`

## Ringkasan Per Folder

### `00_README.txt`

- Menetapkan folder package sebagai referensi utama proyek.
- Menjelaskan cakupan tiap folder dan status kelengkapan dokumen.

### `07_Lainnya` (prioritas arsitektur)

File penting:

- `Keputusan_Teknologi_dan_Arsitektur_Portal_Satu_Data_Bulungan_v1.0.docx`

Temuan:

- Arsitektur final: Next.js (frontend publik) + CKAN (backend katalog).
- Service pendukung wajib CKAN: PostgreSQL, Solr, Redis.
- CKAN DataStore direkomendasikan tetap disiapkan.
- Superset dan object storage ditunda ke fase berikutnya.
- Portal harus tampil sebagai satu website publik satu domain meski service terpisah internal.

### `01_PRD`

File penting:

- `PRD_Portal_Satu_Data_Bulungan.docx`

Temuan:

- Tujuan: gerbang tunggal data sektoral Kabupaten Bulungan.
- Fitur prioritas fase awal: homepage, katalog, detail dataset, metadata, panel dasar.
- Persona utama: publik, operator OPD, walidata, pimpinan, pengembang.
- Fokus kualitas: data mudah dicari, mudah diunduh, metadata standar, dapat diintegrasikan.

### `02_FSD`

File penting:

- `FSD_Portal_Satu_Data_Bulungan.docx`

Temuan:

- Modul utama M01-M08; fase 1 frontend publik dominan pada M01-M03.
- Alur status dataset: Draft → Submitted → Need Revision → Approved → Published → Archived.
- Aturan bisnis inti:
  - Judul unik per organisasi.
  - Dataset publik wajib metadata minimum + minimal 1 resource/API.
  - Validasi resource sebelum publish.
- Katalog harus punya search, filter, sort, pagination.

### `03_SRS`

File penting:

- `SRS_Portal_Satu_Data_Bulungan.docx`

Temuan:

- FR-001, FR-002, FR-003 adalah baseline fase 1 (homepage, katalog, detail).
- NFR utama fase awal:
  - performa halaman publik target < 3 detik (cacheable)
  - aksesibilitas mengikuti WCAG 2.2 AA sejauh realistis
  - arsitektur memungkinkan pemisahan frontend dan backend katalog
- Navigasi publik acuan: Beranda, Dataset, Topik, Organisasi, Metadata, API, Publikasi, Tentang.

### `05_Style`

File penting:

- `Style_Guide_Satu_Data_Bulungan.docx`

Temuan:

- Arah visual: government modern + cultural accent Bulungan.
- Distribusi warna disarankan: 70% netral terang, 20% charcoal/text, 10% aksen.
- Token utama:
  - `--color-primary: #B71F1F`
  - `--color-accent-blue: #1F5FCB`
  - `--color-accent-gold: #F2E500`
  - `--color-accent-orange: #F28C1B`
  - radius 12/16/24, shadow lembut.
- Aset budaya harus ringan: motif sebagai strip/divider/watermark, bukan full background teks.

### `04_Mockup/01_Desktop`

File penting:

- `Mockup_Homepage_Satu_Data_Bulungan.png`
- `Mockup_Katalog_Dataset_Satu_Data_Bulungan.png`
- `Mockup_Detail_Dataset_Satu_Data_Bulungan.png`

Temuan:

- Homepage: hero besar, search dominan, KPI card, topik chip, dataset unggulan, banner integrasi.
- Katalog: search bar atas, panel filter kiri, list card dataset kanan.
- Detail: metadata grid, panel ringkasan kanan, preview chart/table, resource list.

### `04_Mockup/02_Mobile`

File penting:

- `Mockup_Mobile_Homepage_Satu_Data_Bulungan.png`
- `Mockup_Mobile_Katalog_Dataset_Satu_Data_Bulungan.png`
- `Mockup_Mobile_Detail_Dataset_Satu_Data_Bulungan.png`

Temuan:

- Visual konsisten dengan desktop namun layout lebih padat.
- Filter katalog diarahkan ke chip/bottom-sheet style.
- Detail memprioritaskan metadata inti dan aksi cepat.

### `06_Assets`

File penting yang dipakai fase 1:

- `Bulungan Bisa Logo New Color v3.png`
- `Lambang_Kabupaten_Bulungan.png`
- `Motif 3 suku.png`
- `Motif 3 Suku 02.jpg`
- `BULUNGAN_PEREMPUAN.png`
- `BULUNGAN_LAKI-LAKI.png`
- `PERAHU NAGA FESTIVAL SUNGAI KAYAN.png`
- `TUGU LEMLAI SURI SILUET.png`

Temuan:

- Aset ilustrasi besar resolusinya tinggi, cocok sebagai elemen dekoratif non-dominan.
- Motif tersedia dalam variasi warna yang dapat dipakai sebagai strip/watermark.

## Requirement Inti yang Diekstrak untuk Fase 1

1. Aplikasi publik harus runnable lokal dan bisa dilihat langsung.
2. Minimal 3 halaman: homepage, katalog dataset, detail dataset.
3. UI dasar wajib: header, footer, hero, dataset card, badge/chip, search, filter panel, metadata, resource list, responsive behavior.
4. Struktur data awal harus mewakili dataset, OPD, kategori/topik, metadata, resource.
5. Arsitektur kode harus siap transisi dari mock ke CKAN API.
6. Visual harus mengikuti style guide dan mockup Bulungan dengan penggunaan aset yang terukur.
7. Dokumentasi implementasi dan changelog iterasi wajib tersedia.

## Konflik atau Ambiguitas yang Ditemukan

- Tidak ada konflik mayor antara PRD, FSD, SRS, style, dan keputusan arsitektur.
- Mockup menampilkan modul tambahan (misal footer links, banner aksen) yang tidak seluruhnya dijelaskan eksplisit di PRD; diperlakukan sebagai guideline visual, bukan requirement backend.

## Dampak ke Implementasi

- Fase 1 difokuskan pada frontend publik dan adapter data.
- Integrasi CKAN dibuat sebagai adapter siap pakai tanpa memblokir keterlihatan hasil lokal.
- Panel internal/walidata tidak dieksekusi penuh di fase ini, namun struktur domain data sudah mengarah ke workflow CKAN/FSD.
