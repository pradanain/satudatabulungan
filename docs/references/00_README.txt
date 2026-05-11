MASTER PACKAGE SATU DATA BULUNGAN

Paket dokumen utama untuk perencanaan, kebutuhan, desain, dan referensi implementasi Portal Satu Data Bulungan.

Nama folder utama:
references

TUJUAN
Folder ini digunakan sebagai sumber utama dokumen proyek agar seluruh kebutuhan bisnis, fungsional, teknis, desain, dan aset referensi tersimpan dalam satu struktur yang rapi, konsisten, dan mudah ditelusuri.

STRUKTUR FOLDER

references/
├── 01_prd/
├── 02_fsd/
├── 03_srs/
├── 04_mockup/
│   ├── 01_desktop/
│   └── 02_mobile/
├── 05_style/
├── 06_assets/
└── 07_lainnya/

KETERANGAN FOLDER

01_prd
Berisi Product Requirements Document.
Dokumen ini menjelaskan tujuan produk, ruang lingkup, kebutuhan bisnis, persona, fitur utama, prioritas, risiko, dan target implementasi.

02_fsd
Berisi Functional Specification Document.
Dokumen ini menjelaskan detail fungsi sistem, modul, alur proses, aturan bisnis, peran pengguna, dan acceptance criteria.

03_srs
Berisi Software Requirements Specification.
Dokumen ini menjelaskan kebutuhan sistem secara teknis, mencakup kebutuhan fungsional, nonfungsional, integrasi, arsitektur logis, dan batasan implementasi.

04_mockup
Berisi mockup antarmuka portal.

04_mockup/01_desktop
Berisi mockup versi desktop, seperti:
- homepage
- katalog dataset
- detail dataset
- halaman tambahan lain jika tersedia

04_mockup/02_mobile
Berisi mockup versi mobile untuk halaman utama dan tampilan responsif.

05_style
Berisi UI system dan style guide, termasuk:
- color palette
- typography
- spacing
- radius
- shadow
- button
- form
- card
- aturan penggunaan aset visual Bulungan

06_assets
Berisi aset visual dan grafis referensi, seperti:
- logo
- lambang
- motif
- ikon budaya
- ilustrasi
- elemen visual pendukung

07_lainnya
Berisi dokumen tambahan yang belum masuk kategori utama, seperti:
- notulen
- TOR/KAK
- checklist handoff vendor
- revisi minor
- dokumen presentasi
- referensi tambahan

VERSI DOKUMEN
Setiap dokumen wajib menggunakan versi file agar perubahan dapat ditelusuri.

Format versi:
- v1.0 untuk versi awal final
- v1.1 untuk revisi minor
- v2.0 untuk revisi besar

ATURAN PENAMAAN FILE
Gunakan format nama file yang konsisten sebagai berikut:

[JenisDokumen]_[SubjekAtauHalaman]_[ProjectName]_v[Versi].[ext]

Contoh:
- PRD_Portal_Satu_Data_Bulungan_v1.0.docx
- FSD_Portal_Satu_Data_Bulungan_v1.0.docx
- SRS_Portal_Satu_Data_Bulungan_v1.0.docx
- Mockup_Desktop_Homepage_Satu_Data_Bulungan_v1.0.png
- Mockup_Mobile_Katalog_Dataset_Satu_Data_Bulungan_v1.0.png
- UI_System_Style_Guide_Satu_Data_Bulungan_v1.0.pdf

ATURAN UMUM
- Gunakan nama folder dengan huruf kecil dan underscore
- Gunakan nama file yang konsisten
- Hindari spasi pada nama file dan folder
- Hindari nama file generik seperti:
  final
  final_fix
  final_final
  revisi_terbaru
  baru
- Setiap revisi harus menaikkan versi file
- File lama tidak dihapus jika masih dibutuhkan sebagai arsip revisi

STATUS PAKET
Status saat ini:
- PRD: tersedia
- FSD: tersedia
- SRS: tersedia
- Mockup Desktop: tersedia
- Mockup Mobile: tersedia
- UI System / Style Guide: tersedia
- Assets Referensi: tersedia

CATATAN
Master package ini disusun untuk mendukung proses review internal, koordinasi tim, pengadaan, handoff ke vendor, dan implementasi teknis Portal Satu Data Bulungan.