# 02 Assumptions and Decisions

## Asumsi Implementasi Fase 1

1. Fase awal memprioritaskan keterlihatan hasil publik (frontend) dibanding integrasi backend penuh.
2. Dokumen `.docx` digunakan sebagai sumber teks utama karena konten `.pdf` pada paket berpasangan dan setara.
3. Mock data disusun menyerupai paket CKAN (dataset + metadata + resources + tags) agar migrasi minimal.
4. Halaman `Topik`, `Organisasi`, `Metadata`, `API`, `Publikasi` pada navbar belum diimplementasi penuh; tetap ditampilkan sebagai arah navigasi produk.
5. Preview data detail adalah vertical slice UI (simulasi) sebelum DataStore CKAN aktif.

## Keputusan Arsitektur

1. Struktur frontend ditempatkan di `web/` menggunakan Next.js App Router + TypeScript.
2. Data layer dibagi ke:
   - `src/lib/types/` (kontrak domain),
   - `src/lib/adapters/` (sumber data),
   - `src/lib/services/` (selector + fallback).
3. Mode sumber data:
   - `mock` sebagai default agar aplikasi langsung jalan lokal,
   - `ckan` untuk koneksi nyata melalui API CKAN.
4. Jika mode `ckan` gagal mengakses endpoint, service fallback otomatis ke mock untuk menjaga stabilitas.
5. Draft stack CKAN disiapkan di `services/ckan/docker-compose.yml` sebagai jalur transisi.

## Keputusan UI/UX

1. Token visual mengikuti style guide:
   - primary merah `#B71F1F`,
   - aksen biru `#1F5FCB`,
   - aksen emas `#F2E500`,
   - aksen oranye `#F28C1B`,
   - background netral terang.
2. Aset budaya dipakai secara terbatas:
   - motif sebagai strip header dan watermark ringan,
   - ilustrasi tokoh pada hero,
   - landmark pada banner/detail card.
3. Komponen wajib fase 1 dipisah reusable (`header`, `footer`, `hero`, `dataset card`, `chip`, `search`, `filter panel`, `metadata`, `resource list`).
4. Layout mobile mengikuti prinsip mobile-first mockup: komponen dipadatkan dan panel filter ditumpuk secara vertikal.

## Keputusan Scope

1. Fase 1 mencakup 3 halaman inti publik dan belum memasukkan panel administrasi internal.
2. Integrasi Superset/object storage tidak dikerjakan karena tidak wajib fase awal.
3. Iterasi lanjutan menambahkan halaman publik `Topik`, `Organisasi`, `Metadata`, dan `API` agar selaras navigasi mockup.
4. Katalog memakai paginasi URL-based (`page`, `pageSize`) agar state mudah dibagikan via link.

## Risiko dan Mitigasi

1. Risiko: endpoint CKAN berbeda struktur metadata antar instans.
   - Mitigasi: mapper CKAN dibuat toleran (`extras` multi-key + fallback nilai default).
2. Risiko: aset resolusi besar memperberat halaman.
   - Mitigasi: aset hanya dipakai pada titik tertentu, tidak sebagai full background.
3. Risiko: perbedaan final mockup detail vs implementasi komponen web nyata.
   - Mitigasi: menjaga hierarki visual utama tetap sama, detail kosmetik bisa disempurnakan di iterasi berikutnya.
4. Risiko: pengujian CKAN lokal gagal bila Docker daemon tidak aktif/terkunci permission.
   - Mitigasi: fallback mock tetap aktif, plus script `scripts/test-ckan-connection.mjs` untuk verifikasi cepat saat daemon siap.

## Tambahan Keputusan Iterasi 8

1. Endpoint export audit ditempatkan di route internal API agar reuse untuk UI dan kebutuhan operasi manual.
2. Format export dipilih `json` dan `csv` untuk kebutuhan analisis cepat dan interoperabilitas spreadsheet.
3. Retention/rotation audit lokal dijalankan saat append event agar tidak butuh scheduler terpisah pada environment dev sederhana.
