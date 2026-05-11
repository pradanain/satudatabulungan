# Audit UI/UX Beranda Portal Satu Data Bulungan (Tahap 1)

## 1. Ringkasan kondisi Beranda saat ini
Beranda sudah memiliki struktur konten utama yang cukup lengkap: header, hero, search, statistik, topik, berita, infografis, CTA interoperabilitas, dan footer. Secara visual, identitas brand lokal sudah kuat dan penggunaan komponen cukup konsisten.

Temuan paling penting dari audit ini:
- Kualitas visual dan konten sudah baik, tetapi masih ada gap aksesibilitas pada carousel topik (slide non-aktif masih fokusable).
- Integrasi data Beranda cukup resilien karena ada fallback CKAN ke mock untuk dataset dan fallback sumber infografis, namun belum ada route-level loading/error state khusus Beranda.
- Ada peluang optimasi performa SSR dengan mengurangi fetch yang duplikatif pada data statistik.

Quick wins aman untuk Beranda sudah diimplementasikan pada iterasi ini (lihat bagian 11).

## 2. Struktur komponen Beranda
Alur komponen utama Beranda (`/`):

1. `PortalPageShell`
2. `PortalHeader`
3. `HeroSection`
4. `SearchBar`
5. `PortalStatsCards`
6. `TopicCarousel`
7. Section `Berita Satu Data`
8. Section `Infografis Satu Data`
9. `IntegrationBanner`
10. `PortalFooter`

Sumber data yang dipakai Beranda:
- Dataset & statistik: `getDatasets()` + transform lokal (mode CKAN/mock lewat `dataset-service`)
- Berita: `loadKabarDataItems()` (sumber file `public/berita/*.txt`)
- Infografis: `getInfografisApiPayload({ source: "auto" })` (prioritas CKAN lalu live source fallback)

## 3. Alur UX pengguna di Beranda
1. Pengguna tiba di Beranda dan membaca value proposition di hero.
2. Pengguna bisa langsung melakukan pencarian dataset dari search bar.
3. Pengguna melihat statistik ringkas (dataset, topik, organisasi, infografis, pengunjung).
4. Pengguna menelusuri topik via carousel dan klik ke katalog dataset terfilter.
5. Pengguna mengecek berita dan infografis terbaru.
6. Pengguna melakukan aksi lanjutan (jelajahi dataset, akses API, regulasi, permohonan data).

Alur ini sudah jelas, namun discoverability carousel untuk keyboard/screen reader sebelumnya bermasalah (sudah diperbaiki di quick win).

## 4. Temuan UI Beranda
- Brand direction kuat dan konsisten di banyak section.
- Hierarki visual heading umumnya baik (hero `h1`, section `h2`, card `h3`).
- Masih ada campuran token CSS vs hex hardcoded di beberapa komponen Beranda (meningkatkan beban maintainability visual).
- Spacing antar section secara umum konsisten, tetapi terdapat beberapa penggunaan offset negatif (`-mt-*`) yang meningkatkan risiko tuning responsif jangka panjang.

## 5. Temuan UX Beranda
- Search entry point tampil jelas dan cepat ditemukan.
- CTA utama (`Jelajahi Dataset`) dan CTA sekunder (`Akses API`) sudah tepat.
- Empty state berita sebelumnya belum eksplisit jika sumber kosong (sekarang sudah ditambahkan).
- Label CTA `Permohonan Data` pada banner sebelumnya menuju `/internal` (berpotensi membingungkan pengguna publik); sudah diarahkan ke flow layanan publik.

## 6. Temuan aksesibilitas Beranda
- **Sebelum quick win**: `aria-hidden-focus` pada `TopicCarousel` (hasil Playwright + axe untuk halaman home) karena slide non-aktif tetap berisi link fokusable.
- Fokus keyboard umum pada homepage sudah berjalan, tetapi carousel adalah titik paling berisiko.
- Landmark section sudah lebih jelas setelah penambahan `aria-label` pada section berita, infografis, dan interoperabilitas.

## 7. Temuan performa Beranda
- Ada fetch duplikatif data dataset/statistik pada SSR homepage (sebelumnya `getPortalStats()` + `getDatasets()` masing-masing menarik dataset).
- Aset gambar non-kritis di footer menggunakan `loading="eager"`, berpotensi menambah beban awal render.
- Berita cards belum punya `sizes` image sebelumnya, berpotensi image over-fetch di viewport tertentu.

## 8. Temuan integrasi CKAN di Beranda
- Integrasi dataset melalui `dataset-service` cukup aman karena mode `ckan` punya fallback ke `mock` saat gagal.
- Untuk infografis, mode `auto` mencoba CKAN lalu fallback ke live source (HTML scrape/WordPress REST), cukup robust.
- Risiko utama: Beranda belum memiliki route-level error boundary khusus; jika jalur data gagal total (termasuk fallback), pengalaman gagal akan mengikuti error global framework.

## 9. Temuan responsivitas mobile/tablet/desktop
- Hero, stats, dan berita memiliki adaptasi grid yang baik lintas breakpoint.
- `TopicCarousel` sudah responsif dengan logika `cardsPerPage` berbasis viewport.
- Section infografis mobile memakai horizontal snap yang baik untuk konsumsi konten cepat.
- Risiko tersisa: penggunaan banyak ukuran custom + efek visual berlapis menambah kompleksitas tuning untuk edge viewport tertentu.

## 10. Temuan konsistensi Tailwind dan shadcn/ui
- Komponen shadcn-style (`Button`, `Card`, `Input`, `Sheet`) sudah dipakai luas dan konsisten.
- Tailwind utility sudah cukup rapi, namun ada campuran notasi variabel (`font-[family-name:...]` dan `font-(family-name:...)`) serta hex langsung di komponen Beranda.
- Pemakaian token warna global sudah baik sebagai fondasi, tetapi belum sepenuhnya disiplin di semua elemen homepage.

## 11. Quick wins khusus Beranda
Quick wins aman yang **sudah diimplementasikan**:

1. Optimasi fetch SSR homepage:
- Hilangkan fetch statistik yang duplikatif; statistik dasar dihitung dari dataset yang sudah diambil.
- Panggilan infografis dijalankan paralel dalam `Promise.all`.

2. Perbaikan empty state Beranda:
- Tambah empty state eksplisit untuk section berita saat data tidak tersedia.

3. Perbaikan aksesibilitas homepage:
- Perbaiki isu `aria-hidden-focus` pada `TopicCarousel` dengan membuat slide non-aktif inert/non-interaktif.
- Tambah `aria-label` pada section Berita, Infografis, dan Interoperabilitas.

4. Perbaikan UX microcopy/CTA:
- Perbaiki typo pada teks banner interoperabilitas (`dimanfaatkan`).
- CTA `Permohonan Data` diarahkan ke `/layanan-data#permintaan-data`.

5. Perbaikan performa gambar:
- Tambahkan `sizes` untuk gambar berita.
- Hapus `loading="eager"` pada logo footer non-kritis.

## 12. Rekomendasi prioritas P0/P1/P2/P3 khusus Beranda
| Area | Temuan | Dampak | Prioritas | Rekomendasi | File/Komponen Terkait |
|---|---|---|---|---|---|
| Aksesibilitas carousel topik | Slide non-aktif `aria-hidden` masih berisi elemen fokusable (sudah diperbaiki) | Pelanggaran WCAG 4.1.2, pengguna keyboard/screen reader terdampak | P0 | Pertahankan pola inert/non-interaktif untuk slide non-aktif + jaga test a11y home tetap hijau | `web/src/components/portal/topic-carousel.tsx` |
| Resiliensi error Beranda | Belum ada route-level loading/error state khusus homepage | Saat kegagalan data total, UX bisa jatuh ke error global tanpa konteks | P1 | Tambahkan `loading.tsx`/`error.tsx` khusus scope homepage (tanpa ubah flow bisnis) | `web/src/app/page.tsx` (+ route-level boundary terkait) |
| Performa SSR | Fetch dataset/statistik duplikatif (sudah diperbaiki) | Latensi awal dan beban CKAN meningkat | P1 | Pertahankan single-source fetch pattern + monitor TTFB | `web/src/app/page.tsx`, `web/src/lib/services/dataset-service.ts` |
| Empty state berita | Sebelumnya tidak ada empty state eksplisit (sudah diperbaiki) | Section terlihat kosong tanpa konteks | P1 | Pertahankan empty state yang informatif dan actionable | `web/src/app/page.tsx` |
| Konsistensi visual token | Masih ada warna hardcoded di beberapa komponen homepage | Konsistensi tema dan maintainability menurun | P2 | Bertahap migrasi ke design token (`--color-*`) untuk elemen Beranda prioritas | `web/src/components/portal/*`, `web/src/app/page.tsx` |
| Responsive maintainability | Penggunaan offset negatif (`-mt-*`) dan custom sizing cukup banyak | Tuning breakpoint lebih rentan regressi | P2 | Kurangi offset negatif bila memungkinkan, gunakan spacing token yang lebih eksplisit | `web/src/app/page.tsx` |
| CTA publik banner | CTA `Permohonan Data` dulu ke `/internal` (sudah diperbaiki) | Potensi kebingungan jalur pengguna publik | P2 | Pertahankan rute publik terarah ke `layanan-data` | `web/src/components/portal/integration-banner.tsx` |
| Optimasi image below the fold | Footer memakai eager loading (sudah diperbaiki) | Beban render awal meningkat | P3 | Pertahankan lazy default pada aset non-kritis | `web/src/components/portal/portal-footer.tsx` |

## 13. Roadmap perbaikan Beranda
Sprint 1 (stabilisasi):
1. Pertahankan semua quick wins yang sudah masuk.
2. Tambahkan boundary loading/error khusus homepage.
3. Tambahkan assertion a11y spesifik carousel untuk mencegah regresi.

Sprint 2 (konsistensi UI system):
1. Normalisasi hardcoded color/typography Beranda ke token global.
2. Rapikan spacing offset negatif yang paling berisiko.

Sprint 3 (quality hardening):
1. Tambah checklist visual regression khusus section Beranda (hero, topik, berita, infografis, footer).
2. Monitoring metrik performa home (TTFB/LCP) pada mode CKAN aktif.

## 14. File dan komponen terkait Beranda
- `web/src/app/page.tsx`
- `web/src/components/portal/portal-page-shell.tsx`
- `web/src/components/portal/portal-header.tsx`
- `web/src/components/portal/hero-section.tsx`
- `web/src/components/portal/search-bar.tsx`
- `web/src/components/portal/portal-stats.tsx`
- `web/src/components/portal/topic-carousel.tsx`
- `web/src/components/portal/section-heading.tsx`
- `web/src/components/portal/integration-banner.tsx`
- `web/src/components/portal/portal-footer.tsx`
- `web/src/lib/services/dataset-service.ts`
- `web/src/lib/adapters/ckan-dataset-adapter.ts`
- `web/src/lib/services/infografis-service.ts`
- `web/src/lib/services/news-service.ts`

## 15. Risiko jika tidak diperbaiki
- Regresi aksesibilitas di carousel dapat kembali muncul dan menurunkan kepatuhan WCAG.
- Saat data upstream gagal total, pengguna Beranda tidak mendapatkan konteks error yang ramah.
- Inkonsistensi token visual memperbesar biaya maintenance UI ke depan.
- Optimasi performa yang tidak dipertahankan dapat menambah latensi homepage, terutama saat mode CKAN aktif.

## 16. Acceptance criteria untuk perbaikan Beranda
1. Homepage `/` lolos `test:a11y` untuk kategori critical/serious (axe).
2. Komponen carousel tidak menyisakan fokusable element pada slide non-aktif.
3. Section berita dan infografis memiliki empty/fallback state yang jelas.
4. CTA publik pada integration banner mengarah ke jalur layanan publik yang benar.
5. Tidak ada fetch dataset/statistik yang duplikatif di SSR Beranda.
6. Lint aplikasi frontend lulus tanpa error.
7. Perubahan hanya menyentuh Beranda atau shared component yang langsung dipakai Beranda.

---

## Bukti verifikasi iterasi ini
- `npm run lint` PASS
- `npx playwright test tests/accessibility/public-a11y.spec.ts -g "home"` PASS
