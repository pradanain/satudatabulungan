# 04 Changelog

## Iterasi 1 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. `00_README.txt` paket master.
2. `07_Lainnya/Keputusan_Teknologi_dan_Arsitektur_...docx`.
3. `01_PRD/PRD_Portal_Satu_Data_Bulungan.docx`.
4. `02_FSD/FSD_Portal_Satu_Data_Bulungan.docx`.
5. `03_SRS/SRS_Portal_Satu_Data_Bulungan.docx`.
6. `05_Style/Style_Guide_Satu_Data_Bulungan.docx`.
7. Mockup desktop dan mobile (homepage, katalog, detail).
8. Aset visual utama (logo, motif, ilustrasi, landmark).

### 2) Apa yang dibangun/diubah

1. Scaffold aplikasi Next.js TypeScript di `web/`.
2. Implementasi 3 halaman utama:
   - `/`
   - `/dataset`
   - `/dataset/[slug]`
3. Implementasi komponen reusable portal:
   - header/footer
   - hero
   - dataset card
   - chip/badge
   - search bar
   - filter panel
   - metadata section
   - resource list
   - preview panel
4. Implementasi layer data adapter:
   - mock adapter (default)
   - CKAN adapter (siap integrasi)
   - service selector + fallback mode
5. Integrasi aset Bulungan terukur (copy dari master package ke `web/public/assets/brand`).
6. Penambahan draft `services/ckan/docker-compose.yml` (opsional fase awal).
7. Penambahan README root + README frontend + env example.
8. Penambahan dokumentasi implementasi awal (`docs/00-03`).

### 3) File utama yang dibuat/diupdate

1. `web/src/app/page.tsx`
2. `web/src/app/dataset/page.tsx`
3. `web/src/app/dataset/[slug]/page.tsx`
4. `web/src/app/layout.tsx`
5. `web/src/app/globals.css`
6. `web/src/components/portal/*`
7. `web/src/lib/types/dataset.ts`
8. `web/src/lib/data/mock-datasets.ts`
9. `web/src/lib/adapters/*`
10. `web/src/lib/services/dataset-service.ts`
11. `web/.env.example`
12. `web/README.md`
13. `services/ckan/docker-compose.yml`
14. `services/ckan/README.md`
15. `README.md`
16. `docs/00_document_audit.md`
17. `docs/01_requirement_matrix.md`
18. `docs/02_assumptions_and_decisions.md`
19. `docs/03_iteration_plan.md`

### 4) Status run/build/test

Quality gate:

1. Cek project structure: **Pass**
2. Cek import rusak (lint): **Pass** (`npm run lint`)
3. Cek build/compile: **Pass** (`npm run build`)
4. Cek route utama:
   - `GET /` = **200**
   - `GET /dataset` = **200**
5. Cek styling utama:
   - Token dan layout desktop/mobile aktif
   - Komponen utama tampil tanpa pecah pada verifikasi awal
6. Cek route yang dibuat:
   - `/`, `/dataset`, `/dataset/[slug]` berjalan

### 5) Asumsi atau keputusan baru

1. Mode data default `mock` agar fase 1 langsung runnable.
2. Mode `ckan` tetap disediakan via env switch dan fallback ke mock jika gagal.
3. Preview data detail masih vertical slice UI (belum DataStore real).
4. Panel admin internal ditunda ke iterasi berikutnya.

### 6) Next step paling logis

1. Tambah paginasi dan state filter lanjutan di katalog.
2. Sinkronisasi langsung dengan CKAN lokal (uji adapter real).
3. Tambah halaman pendukung (`Topik`, `Organisasi`, `Metadata`, `API`) sesuai navigasi desain.
4. Mulai fondasi panel internal workflow dataset (draft-review-publish).

## Iterasi 2 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. `docs/04_changelog.md` iterasi sebelumnya.
2. Kode katalog dataset saat ini (`/dataset`) dan data adapter.
3. Navigasi aktif pada header yang belum mengarah ke halaman publik lanjutan.

### 2) Apa yang dibangun/diubah

1. Menambahkan paginasi katalog URL-based:
   - `page`
   - `pageSize`
2. Memperkaya state filter:
   - `status`
   - `year`
   - `tag`
3. Menambahkan chip filter aktif + remove per-filter.
4. Menambahkan halaman publik lanjutan:
   - `/topik`
   - `/organisasi`
   - `/metadata`
   - `/api`
5. Menyambungkan navigasi header/footer ke halaman publik baru.
6. Menambah script uji koneksi CKAN:
   - `scripts/test-ckan-connection.mjs`
7. Sinkronisasi adapter mock dan CKAN agar mendukung filter kaya yang sama.

### 3) File utama yang dibuat/diupdate

1. `web/src/app/dataset/page.tsx`
2. `web/src/components/portal/filter-panel.tsx`
3. `web/src/components/portal/pagination-controls.tsx` (baru)
4. `web/src/components/portal/active-filter-state.tsx` (baru)
5. `web/src/lib/types/dataset.ts`
6. `web/src/lib/adapters/mock-dataset-adapter.ts`
7. `web/src/lib/adapters/ckan-dataset-adapter.ts`
8. `web/src/lib/services/dataset-service.ts`
9. `web/src/lib/utils/query.ts`
10. `web/src/components/portal/portal-header.tsx`
11. `web/src/components/portal/portal-footer.tsx`
12. `web/src/app/topik/page.tsx` (baru)
13. `web/src/app/organisasi/page.tsx` (baru)
14. `web/src/app/metadata/page.tsx` (baru)
15. `web/src/app/api/page.tsx` (baru)
16. `web/src/app/globals.css`
17. `scripts/test-ckan-connection.mjs` (baru)

### 4) Status run/build/test

Quality gate:

1. Cek project structure: **Pass**
2. Cek import rusak (lint): **Pass** (`npm run lint`)
3. Cek build/compile: **Pass** (`npm run build`)
4. Cek route utama dan route baru:
   - `GET /topik` = **200**
   - `GET /organisasi` = **200**
   - `GET /metadata` = **200**
   - `GET /api` = **200**
   - `GET /dataset?page=2&pageSize=6` = **200**
5. Cek paginasi UI pada katalog: **Pass** (kontrol pagination muncul pada halaman katalog terpaginasikan)
6. Uji mode adapter CKAN:
   - Menjalankan frontend dengan `DATA_SOURCE_MODE=ckan` + `CKAN_BASE_URL=http://localhost:5000`
   - Respon `/dataset` dan `/api` tetap **200** lewat mekanisme fallback mock

Uji CKAN lokal nyata:

1. `docker compose up -d` di `services/ckan`: **Blocked**
2. Penyebab: Docker daemon/service lokal belum aktif (pipe `docker_engine` tidak tersedia dan service tidak bisa dinyalakan dari sesi ini).
3. `node scripts/test-ckan-connection.mjs http://localhost:5000`: **FAILED** (host CKAN tidak reachable).

### 5) Asumsi atau keputusan baru

1. Paginasi diproses di layer halaman katalog (slice hasil filter) untuk menjaga kompatibilitas adapter saat ini.
2. Filter `year` menggunakan kombinasi `lastUpdated` dan nilai tahun pada `metadata.period`.
3. Halaman `/api` tetap digunakan sebagai halaman publik, sedangkan endpoint backend eksternal CKAN tetap di `${CKAN_BASE_URL}/api/3/action/*`.

### 6) Next step paling logis

1. Saat Docker daemon siap, nyalakan `services/ckan` lalu jalankan ulang script konektivitas CKAN.
2. Tambahkan smoke test otomatis untuk mode `mock` vs `ckan`.
3. Mulai iterasi panel internal workflow dataset (draft-review-publish).

## Iterasi 3 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kondisi runtime CKAN terakhir yang gagal di `localhost:5000`.
2. Log container `bulungan-ckan-app` dan `bulungan-ckan-datastore`.
3. Konfigurasi `services/ckan/docker-compose.yml` dan flow startup image `ckan/ckan-dev:2.10`.

### 2) Apa yang dibangun/diubah

1. Menambahkan healthcheck untuk service `db` dan `datastore-db`.
2. Menambahkan service one-shot `datastore-init` untuk membuat role `datastore_ro` otomatis.
3. Memperbarui dependency startup CKAN agar menunggu DB sehat dan init role selesai.
4. Menambahkan command override pada service CKAN untuk membuat symlink `/usr/local/bin/ckan -> /usr/bin/ckan` sebelum start.
5. Menambahkan healthcheck CKAN berbasis endpoint `/api/3/action/status_show`.
6. Memperbarui dokumentasi `services/ckan/README.md` agar sesuai alur baru.
7. Menambahkan script bootstrap data CKAN idempotent:
   - `scripts/seed-ckan-sample.mjs`
8. Memperbarui `README.md` root dengan langkah seed data sample.

### 3) File utama yang dibuat/diupdate

1. `services/ckan/docker-compose.yml`
2. `services/ckan/README.md`
3. `scripts/seed-ckan-sample.mjs` (baru)
4. `README.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `docker compose up -d --force-recreate` (CKAN stack): **Pass**
3. `docker compose ps`: **Pass** (service `bulungan-ckan-app` status `healthy`)
4. `node scripts/test-ckan-connection.mjs http://localhost:5000`: **Pass**
   - `status_show.success: true`
   - `dataset_count: 2` (setelah seed sample)
5. Smoke frontend mode CKAN:
   - jalankan `npm run start` dengan `DATA_SOURCE_MODE=ckan` + `CKAN_BASE_URL=http://localhost:5000`
   - `GET /dataset` = **200**
   - `GET /dataset/jumlah-penduduk-per-kecamatan-2025` = **200**
   - `GET /dataset/produksi-pangan-dan-hortikultura` = **200**

### 5) Asumsi atau keputusan baru

1. Inisialisasi role `datastore_ro` ditangani langsung oleh compose agar tidak bergantung langkah manual operator.
2. Symlink `ckan` CLI dipaksa saat startup untuk menghindari loop restart dari path `/usr/local/bin/ckan` yang tidak tersedia pada image saat ini.
3. Mode `mock` tetap dipertahankan sebagai default agar developer tetap bisa kerja saat CKAN tidak aktif.
4. Bootstrap data sample disediakan sebagai script terpisah agar environment lokal bisa cepat menampilkan konten tanpa mengubah adapter frontend.

### 6) Next step paling logis

1. Menambahkan smoke test otomatis dual-mode (`mock` vs `ckan`) untuk route utama.
2. Menambahkan script utilitas untuk refresh token CKAN lokal agar seed/deploy lokal lebih cepat.
3. Melanjutkan fondasi panel internal workflow dataset (draft-review-publish).

## Iterasi 4 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan smoke test otomatis untuk mode `mock` dan `ckan`.
2. Kebutuhan fondasi panel internal workflow dataset.
3. Kebutuhan tooling token CKAN lokal agar flow seed/ops lebih praktis.

### 2) Apa yang dibangun/diubah

1. Menambahkan smoke test end-to-end dual-mode:
   - `scripts/smoke-dual-mode.mjs`
2. Menambahkan tooling token CKAN otomatis:
   - `scripts/ensure-ckan-token.mjs`
   - sumber token: `env` -> `cache` -> `create baru`
3. Memperbarui script seed CKAN agar auto-resolve token saat `CKAN_API_KEY` belum di-set.
4. Menambahkan fondasi panel internal workflow:
   - route: `/internal/workflow`
   - board status: Draft, Submitted, Need Revision, Approved, Published, Archived
   - aksi transisi status di level UI (fondasi UX)
   - route dibuat dynamic (`force-dynamic`) agar mengikuti mode data runtime (`mock`/`ckan`)
5. Memperbarui link `Login` agar menuju panel internal workflow.
6. Memperluas model status dataset dengan status `Approved`.
7. Memperbarui dokumentasi root/frontend/ckan README untuk script baru.

### 3) File utama yang dibuat/diupdate

1. `scripts/smoke-dual-mode.mjs` (baru)
2. `scripts/ensure-ckan-token.mjs` (baru)
3. `scripts/seed-ckan-sample.mjs`
4. `web/src/app/internal/workflow/page.tsx` (baru)
5. `web/src/components/portal/workflow-board.tsx` (baru)
6. `web/src/lib/services/workflow-service.ts` (baru)
7. `web/src/lib/types/workflow.ts` (baru)
8. `web/src/lib/types/dataset.ts`
9. `web/src/lib/adapters/ckan-dataset-adapter.ts`
10. `web/src/components/portal/portal-header.tsx`
11. `web/src/app/globals.css`
12. `README.md`
13. `web/README.md`
14. `services/ckan/README.md`
15. `docs/03_iteration_plan.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `node scripts/ensure-ckan-token.mjs --format json`: **Pass**
3. `node scripts/seed-ckan-sample.mjs http://localhost:5000`: **Pass**
4. `node scripts/smoke-dual-mode.mjs`: **Pass**
   - mode `mock`: halaman publik + `/internal/workflow` respons **200**
   - mode `ckan`: halaman dataset/API/internal workflow respons **200**
   - verifikasi konten `/internal/workflow` pada mode `ckan` menampilkan dataset CKAN aktual (bukan prerender mock)

### 5) Asumsi atau keputusan baru

1. Fondasi workflow pada iterasi ini fokus ke baseline UX dan transisi status di sisi UI; persistensi backend disiapkan di iterasi berikutnya.
2. Tool token CKAN diprioritaskan untuk kemudahan operasional lokal sehingga seed/smoke tidak lagi bergantung copy manual token.
3. Smoke test menjalankan `next start` pada port terpisah agar tidak mengganggu sesi dev yang sedang aktif.

### 6) Next step paling logis

1. Menambahkan API internal untuk persistensi transisi workflow (mock mutasi + CKAN patch extras status).
2. Menambahkan guard akses panel internal (auth basic tahap awal).
3. Menambahkan smoke test CI-style agar bisa dijalankan sebagai quality gate otomatis tiap iterasi.

## Iterasi 5 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan persistensi transisi workflow dari UI ke backend nyata.
2. Kebutuhan proteksi akses panel internal via Basic Auth.
3. Kebutuhan menjadikan smoke dual-mode sebagai gate otomatis pipeline.

### 2) Apa yang dibangun/diubah

1. Menambahkan API internal transisi workflow:
   - `POST /api/internal/workflow/transition`
2. Menambahkan persistence workflow:
   - mode `ckan`: update `extras.status` lewat `package_patch`
   - mode `mock`: simpan override ke `.local/mock-workflow-overrides.json`
3. Menambahkan proteksi Basic Auth untuk route internal dengan `proxy.ts`:
   - `/internal/workflow/*`
   - `/api/internal/workflow/*`
4. Mengubah board workflow agar submit transisi ke API internal (bukan state-only di browser).
5. Menambahkan dukungan env dan fallback token CKAN:
   - `CKAN_API_KEY` env
   - fallback cache token `.local/ckan-admin.token`
6. Menyesuaikan smoke script agar mengirim Basic Auth saat menguji `/internal/workflow`.
7. Menambahkan pipeline quality gate CI:
   - `.github/workflows/quality-gate.yml`
   - lint + CKAN up + seed + smoke dual-mode
8. Memperbarui dokumentasi runbook terkait auth/persistence/pipeline.

### 3) File utama yang dibuat/diupdate

1. `web/src/app/api/internal/workflow/transition/route.ts` (baru)
2. `web/src/lib/services/workflow-persistence.ts` (baru)
3. `web/src/proxy.ts` (baru)
4. `web/src/components/portal/workflow-board.tsx`
5. `web/src/lib/services/workflow-service.ts`
6. `web/src/lib/types/workflow.ts`
7. `web/src/app/globals.css`
8. `scripts/smoke-dual-mode.mjs`
9. `web/.env.example`
10. `.github/workflows/quality-gate.yml` (baru)
11. `README.md`
12. `web/README.md`
13. `docs/03_iteration_plan.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. `node scripts/smoke-dual-mode.mjs --skip-build`: **Pass**
4. Verifikasi auth route:
   - akses `/internal/workflow` tanpa auth -> **401**
5. Verifikasi persistensi transisi CKAN:
   - `POST /api/internal/workflow/transition` dengan Basic Auth -> **200**
   - cek `package_show` CKAN: `extras.status` berubah sesuai transisi -> **Pass**

### 5) Asumsi atau keputusan baru

1. Untuk pengembangan lokal, Basic Auth default di-set ke `admin / bulungan123` dan bisa dioverride via env.
2. Persistensi CKAN memerlukan token admin; bila env kosong, server mencoba token cache lokal agar flow dev tetap praktis.
3. Pipeline quality gate menggunakan stack CKAN Compose yang sama dengan lokal agar parity environment lebih tinggi.

### 6) Next step paling logis

1. Menambahkan form draft dataset internal (validasi metadata minimum + resource minimum).
2. Menambahkan audit trail ringkas transisi status (siapa, kapan, dari->ke).
3. Menambahkan skenario smoke API transisi ke pipeline (bukan hanya page smoke).

## Iterasi 6 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan form draft dataset internal dengan metadata/resource wajib.
2. Kebutuhan audit trail transisi status yang mencatat `who/when/from/to`.
3. Kebutuhan smoke API transisi sebagai bagian quality gate pipeline.

### 2) Apa yang dibangun/diubah

1. Menambahkan API draft internal:
   - `POST /api/internal/workflow/draft`
   - validasi field wajib metadata + minimal 1 resource.
2. Menambahkan layer persistence workflow yang diperluas:
   - persist transisi ke CKAN (`extras.status`) atau mock override file.
   - persist audit trail ke file lokal `.local/workflow-audit-trail.json`.
   - simpan audit trail ke CKAN extras (`workflow_audit_trail`) pada mode `ckan`.
3. Menambahkan form draft dataset pada UI `/internal/workflow`.
4. Menampilkan ringkasan audit trail terakhir pada card workflow.
5. Menambahkan util parsing user Basic Auth untuk identitas actor.
6. Menambahkan smoke script API workflow:
   - `scripts/smoke-workflow-api.mjs`
7. Memperbarui pipeline quality gate agar menjalankan:
   - `smoke-workflow-api`
   - reseed CKAN
   - `smoke-dual-mode`

### 3) File utama yang dibuat/diupdate

1. `web/src/app/api/internal/workflow/draft/route.ts` (baru)
2. `web/src/lib/services/workflow-persistence.ts` (rewrite)
3. `web/src/lib/utils/auth.ts` (baru)
4. `web/src/components/portal/workflow-board.tsx` (rewrite)
5. `web/src/lib/services/workflow-service.ts`
6. `web/src/lib/types/workflow.ts`
7. `web/src/app/globals.css`
8. `scripts/smoke-workflow-api.mjs` (baru)
9. `.github/workflows/quality-gate.yml`
10. `README.md`
11. `web/README.md`
12. `docs/03_iteration_plan.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. `node scripts/smoke-workflow-api.mjs`: **Pass**
4. `node scripts/smoke-dual-mode.mjs --skip-build`: **Pass**
5. Uji manual API draft internal (mode `ckan`): **Pass**
6. Uji manual audit trail transisi (`Submitted -> Approved`): **Pass**

### 5) Asumsi atau keputusan baru

1. Audit trail disimpan redundan (CKAN extras + local file) untuk menjaga jejak transisi di local dev.
2. Form draft pada iterasi ini difokuskan untuk satu resource awal agar tetap sederhana dan stabil.
3. Mock mode menyimpan draft tambahan ke file `.local/mock-workflow-drafts.json` agar tetap terlihat di workflow board.

### 6) Next step paling logis

1. Menambahkan halaman detail audit trail per dataset.
2. Menambahkan capability edit draft metadata dari panel internal.
3. Menambahkan filter audit trail berdasarkan actor/status/rentang waktu.

## Iterasi 7 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan halaman audit detail per dataset.
2. Kebutuhan filter timeline audit berdasarkan actor/status/date range.
3. Kebutuhan menjaga smoke test tetap relevan setelah penambahan route audit.

### 2) Apa yang dibangun/diubah

1. Menambahkan halaman audit detail dataset:
   - `GET /internal/workflow/[slug]/audit`
2. Menambahkan filter audit pada halaman detail:
   - `actor`
   - `status`
   - `dateFrom`
   - `dateTo`
3. Menambahkan helper service:
   - `getWorkflowItemBySlug`
   - `sortWorkflowAuditTimeline`
4. Menambahkan link `Lihat audit` pada card workflow board.
5. Menambahkan styling baru untuk:
   - panel filter audit
   - timeline audit
   - badge/status card audit
6. Memperluas smoke scripts:
   - `smoke-dual-mode`: uji route audit (401/200 + filter query)
   - `smoke-workflow-api`: uji audit page dengan filter setelah transisi berhasil

### 3) File utama yang dibuat/diupdate

1. `web/src/app/internal/workflow/[slug]/audit/page.tsx` (baru)
2. `web/src/lib/services/workflow-service.ts`
3. `web/src/components/portal/workflow-board.tsx`
4. `web/src/app/globals.css`
5. `scripts/smoke-dual-mode.mjs`
6. `scripts/smoke-workflow-api.mjs`
7. `web/README.md`
8. `README.md`
9. `docs/03_iteration_plan.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. `node scripts/smoke-workflow-api.mjs`: **Pass**
4. `node scripts/smoke-dual-mode.mjs --skip-build`: **Pass**
5. Uji manual halaman audit dengan filter query (`actor/status/dateFrom/dateTo`): **Pass**

### 5) Asumsi atau keputusan baru

1. Filter status audit dianggap match jika status muncul sebagai `fromStatus` atau `toStatus`.
2. Rentang tanggal difilter inklusif per hari (`dateFrom` awal hari, `dateTo` akhir hari).
3. Timeline audit ditampilkan descending (event terbaru di atas).

### 6) Next step paling logis

1. Menambahkan endpoint export audit (CSV/JSON) per dataset.
2. Menambahkan halaman detail audit dengan statistik ringkas (jumlah transisi per actor/status).
3. Menambahkan smoke test khusus endpoint export audit.

## Iterasi 8 - 22 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan ekspor audit trail per dataset untuk operasional admin.
2. Kebutuhan retention/rotation sederhana pada file audit lokal agar tidak terus membesar.
3. Kebutuhan memperluas smoke test untuk endpoint export audit.

### 2) Apa yang dibangun/diubah

1. Menambahkan endpoint export audit:
   - `GET /api/internal/workflow/[slug]/audit/export`
   - format didukung: `json` dan `csv` (`?format=json|csv`)
   - query filter didukung: `actor`, `status`, `dateFrom`, `dateTo`
2. Menambahkan aksi export pada halaman audit detail:
   - `Export JSON`
   - `Export CSV`
3. Menambahkan retention + rotation audit lokal di persistence layer:
   - retention by age dengan env `WORKFLOW_AUDIT_RETENTION_DAYS` (default `90`)
   - batas event aktif dengan env `WORKFLOW_AUDIT_MAX_ENTRIES` (default `500`)
   - event overflow dipindah ke arsip `.local/workflow-audit-archive-YYYY-MM.jsonl`
4. Memperluas smoke scripts untuk endpoint export audit:
   - `scripts/smoke-workflow-api.mjs`
   - `scripts/smoke-dual-mode.mjs`
5. Memperbarui dokumentasi penggunaan/env:
   - `README.md`
   - `web/README.md`
   - `web/.env.example`
   - `docs/03_iteration_plan.md`

### 3) File utama yang dibuat/diupdate

1. `web/src/app/api/internal/workflow/[slug]/audit/export/route.ts` (baru)
2. `web/src/lib/services/workflow-persistence.ts`
3. `web/src/app/internal/workflow/[slug]/audit/page.tsx`
4. `scripts/smoke-workflow-api.mjs`
5. `scripts/smoke-dual-mode.mjs`
6. `web/.env.example`
7. `README.md`
8. `web/README.md`
9. `docs/03_iteration_plan.md`
10. `docs/04_changelog.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. `node scripts/smoke-workflow-api.mjs`: **Pass**
4. `node scripts/smoke-dual-mode.mjs --skip-build`: **Pass**

### 5) Asumsi atau keputusan baru

1. Export audit difokuskan di API route internal agar bisa dipakai UI maupun operasi manual (curl/browser).
2. Retention/rotation diterapkan pada audit file lokal saat append event agar overhead ringan dan konsisten lintas mode (`mock`/`ckan`).
3. Arsip rotasi disimpan sebagai JSONL per bulan untuk memudahkan inspeksi ops sederhana tanpa tooling tambahan.

### 6) Next step paling logis

1. Menambahkan statistik ringkas audit (jumlah transisi per actor/status) pada halaman audit detail.
2. Menambahkan parameter sort opsional (`asc`/`desc`) pada endpoint export audit.
3. Menambahkan smoke skenario validasi header `Content-Disposition` untuk kompatibilitas download lintas browser.

## Iterasi 9 - 23 April 2026

### 1) Apa yang dibaca/dipahami

1. Prompt refactor UI/UX pada `c:\Users\ASUS\Downloads\refactor-ui-ux-prompt.txt`.
2. Struktur App Router Next.js di `web/src/app/*`.
3. Komponen portal yang sebelumnya masih dominan class CSS global.

### 2) Apa yang dibangun/diubah

1. Menambahkan fondasi Tailwind + shadcn/ui:
   - setup `@tailwindcss/postcss`
   - utility `cn()`
   - primitive `Button`, `Input`, `Badge`, `Card`, `Sheet`, `Tabs`
2. Merapikan `globals.css`:
   - tetap mempertahankan token visual existing
   - migrasi base style ke fondasi Tailwind
   - menyisakan class khusus workflow internal agar route internal tetap stabil
3. Menambahkan app shell reusable:
   - `PortalPageShell`
   - `SectionHeading`
4. Refactor shared layout:
   - `PortalHeader` menjadi sticky, tetap visible saat scroll, responsif mobile
   - `PortalFooter` ditata ulang dengan tipografi dan spacing konsisten
5. Refactor komponen portal utama ke Tailwind + shadcn:
   - `HeroSection`, `SearchBar`, `DatasetCard`, `TopicChipList`, `PortalStatsCards`
   - `FilterPanel` + `MobileFilterDrawer` berbasis `Sheet`
   - `PaginationControls`, `ActiveFilterState`, `MetadataSection`, `PreviewPanel`, `ResourceList`, `IntegrationBanner`
6. Refactor halaman prioritas:
   - homepage `/`
   - katalog dataset `/dataset`
   - detail dataset `/dataset/[slug]` dengan segmentasi konten via `Tabs` untuk mengurangi scroll panjang
7. Refactor halaman pendukung agar konsisten:
   - `/topik`, `/organisasi`, `/metadata`, `/api`, dan `_not-found`

### 3) File utama yang dibuat/diupdate

1. `web/postcss.config.mjs` (baru)
2. `web/src/app/globals.css`
3. `web/src/app/layout.tsx`
4. `web/src/app/page.tsx`
5. `web/src/app/dataset/page.tsx`
6. `web/src/app/dataset/[slug]/page.tsx`
7. `web/src/app/topik/page.tsx`
8. `web/src/app/organisasi/page.tsx`
9. `web/src/app/metadata/page.tsx`
10. `web/src/app/api/page.tsx`
11. `web/src/app/not-found.tsx`
12. `web/src/components/portal/portal-header.tsx`
13. `web/src/components/portal/portal-footer.tsx`
14. `web/src/components/portal/filter-panel.tsx`
15. `web/src/components/portal/dataset-card.tsx`
16. `web/src/components/portal/metadata-section.tsx`
17. `web/src/components/portal/preview-panel.tsx`
18. `web/src/components/portal/resource-list.tsx`
19. `web/src/components/portal/pagination-controls.tsx`
20. `web/src/components/portal/active-filter-state.tsx`
21. `web/src/components/portal/hero-section.tsx`
22. `web/src/components/portal/integration-banner.tsx`
23. `web/src/components/portal/topic-chip-list.tsx`
24. `web/src/components/portal/portal-stats.tsx`
25. `web/src/components/portal/search-bar.tsx`
26. `web/src/components/portal/portal-page-shell.tsx` (baru)
27. `web/src/components/portal/section-heading.tsx` (baru)
28. `web/src/components/ui/*` (baru)
29. `web/src/lib/utils/cn.ts` (baru)

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. Route prioritas (`/`, `/dataset`, `/dataset/[slug]`) terkompilasi dan terdaftar pada build output: **Pass**
4. Route pendukung (`/topik`, `/organisasi`, `/metadata`, `/api`) terkompilasi: **Pass**

### 5) Asumsi atau keputusan baru

1. Warna dan identitas visual utama tetap dipertahankan melalui token root agar hasil tetap sejalan dengan style existing.
2. Pengurangan scroll panjang pada detail dataset dilakukan dengan segmentasi `Tabs` (metadata/preview/resource/related) alih-alih memanjangkan satu halaman.
3. `globals.css` lama yang ad hoc dibersihkan untuk area portal publik, tetapi class internal workflow dipertahankan agar tidak memicu regresi pada panel admin.

### 6) Next step paling logis

1. Menambahkan visual regression snapshot untuk halaman publik prioritas.
2. Melanjutkan migrasi komponen internal workflow ke Tailwind + shadcn agar konsistensi penuh satu codebase.
3. Menambahkan uji aksesibilitas otomatis (focus order, color contrast, landmark semantics).

## Iterasi 10 - 23 April 2026

### 1) Apa yang dibaca/dipahami

1. Kebutuhan melanjutkan migrasi halaman internal workflow/audit ke Tailwind + shadcn.
2. Kebutuhan visual regression check untuk halaman publik prioritas.
3. Kebutuhan audit aksesibilitas dasar (focus, contrast, keyboard flow) yang bisa dijalankan otomatis.

### 2) Apa yang dibangun/diubah

1. Refactor internal workflow/audit ke Tailwind + shadcn:
   - `WorkflowBoard` dirombak ke komponen `Card`, `Button`, `Input`, `Badge`.
   - halaman `/internal/workflow` dan `/internal/workflow/[slug]/audit` dimigrasi ke `PortalPageShell` + layout Tailwind konsisten.
2. Menyederhanakan `globals.css`:
   - menghapus class workflow/audit lama yang tidak dipakai lagi.
   - mempertahankan token global dan util dasar (`shell`, `page-shell`, `sr-only`).
   - menambahkan `:focus-visible` global agar indikator fokus keyboard lebih jelas.
3. Menambahkan visual regression test berbasis Playwright:
   - config `web/playwright.config.ts`
   - test `web/tests/visual/public-pages.spec.ts`
   - baseline snapshot untuk:
     - `/`
     - `/dataset`
     - `/dataset/jumlah-penduduk-per-kecamatan-2025`
     - viewport desktop + mobile
4. Menambahkan audit aksesibilitas dasar:
   - test `web/tests/accessibility/public-a11y.spec.ts`
   - cek axe (tanpa violation `critical/serious`)
   - cek keyboard tab flow (focus bergerak dan visible)
5. Menambahkan script npm QA:
   - `test:visual`
   - `test:visual:update`
   - `test:a11y`
6. Menambahkan dependency QA:
   - `@playwright/test`
   - `@axe-core/playwright`
7. Memperbarui dokumentasi runbook:
   - root `README.md`
   - `web/README.md`

### 3) File utama yang dibuat/diupdate

1. `web/src/components/portal/workflow-board.tsx`
2. `web/src/app/internal/workflow/page.tsx`
3. `web/src/app/internal/workflow/[slug]/audit/page.tsx`
4. `web/src/app/globals.css`
5. `web/playwright.config.ts` (baru)
6. `web/tests/visual/public-pages.spec.ts` (baru)
7. `web/tests/visual/public-pages.spec.ts-snapshots/*` (baru)
8. `web/tests/accessibility/public-a11y.spec.ts` (baru)
9. `web/package.json`
10. `web/.gitignore`
11. `README.md`
12. `web/README.md`
13. `docs/04_changelog.md`

### 4) Status run/build/test

Quality gate:

1. `npm run lint` (frontend): **Pass**
2. `npm run build` (frontend): **Pass**
3. `npm run test:visual:update`: **Pass** (baseline visual dibuat/diupdate)
4. `npm run test:visual`: **Pass**
5. `npm run test:a11y`: **Pass**

### 5) Asumsi atau keputusan baru

1. Visual regression difokuskan dulu pada halaman publik prioritas sesuai scope utama refactor UI.
2. Snapshot disimpan platform-spesifik (`*-win32.png`) untuk menjaga determinisme di lingkungan pengembangan saat ini.
3. Audit aksesibilitas dasar menggabungkan validasi otomatis `axe` dan verifikasi keyboard flow sederhana.

### 6) Next step paling logis

1. Menambahkan visual regression untuk halaman publik sekunder (`/topik`, `/organisasi`, `/metadata`, `/api`).
2. Menambahkan pemeriksaan aksesibilitas lanjutan (heading hierarchy dan landmark assertions per halaman).
3. Integrasi suite Playwright (`test:visual`, `test:a11y`) ke pipeline quality gate CI.

## Iterasi 11 - 23 April 2026

### 1) Apa yang dibaca/dipahami

1. Kondisi terbaru halaman publik dan panel internal yang sudah berjalan.
2. Kebutuhan user untuk dokumen eksekusi detail per fase tanpa ambiguity.
3. Kebutuhan user untuk draft arsitektur menu internal role-based yang selaras dengan perbaikan publik.

### 2) Apa yang dibangun/diubah

1. Menyusun blueprint implementasi detail baru dengan fokus:
   - task list per fase
   - urutan eksekusi teknis
   - acceptance criteria
   - quality gate per fase
2. Menambahkan draft arsitektur internal role-based:
   - definisi role (`admin`, `walidata`, `operator_opd`)
   - matriks akses modul
   - rancangan struktur menu per role
   - rancangan route internal
   - task breakdown implementasi role + acceptance criteria
3. Menyusun rencana eksekusi gabungan publik + internal dalam horizon mingguan.

### 3) File utama yang dibuat/diupdate

1. `docs/05_public_internal_execution_blueprint.md` (baru)
2. `docs/04_changelog.md`

### 4) Status run/build/test

1. Tidak menjalankan `lint/build/test` karena perubahan pada iterasi ini bersifat dokumentasi perencanaan.

### 5) Asumsi atau keputusan baru

1. Eksekusi dibagi menjadi 3 fase publik agar risiko regresi UI/performa lebih terkendali.
2. Implementasi role-based dilakukan bertahap dari MVP berbasis Basic Auth mapping menuju model session/token.
3. Prioritas awal role-based menekankan pembatasan menu/route dan scope data, bukan redesign total halaman internal.

### 6) Next step paling logis

1. Mulai implementasi Fase 1 quick wins publik sesuai task ID `P1-*`.
2. Inisialisasi fondasi role dan nav config sesuai task ID `R1-01` dan `R1-02`.
3. Menambahkan checklist eksekusi harian di issue tracker berdasarkan dokumen blueprint baru.

## Iterasi 12 - 23 April 2026

### 1) Apa yang dibaca/dipahami

1. Prompt lanjutan implementasi internal pada `c:\Users\ASUS\Downloads\lanjutan-satudatabulungan-prompt.txt`.
2. Mockup internal di `references/04_Mockup/03_Internal`.
3. Blueprint role-based internal di `docs/05_public_internal_execution_blueprint.md`.
4. Fondasi workflow lama yang masih berpusat pada Basic Auth dan file mock terpisah.

### 2) Apa yang dibangun/diubah

1. Menambahkan shared source of truth lokal:
   - `.local/internal-portal-store.json`
   - service `internal-store` untuk seed users, organizations, topics, notifications, audit logs, settings, dan datasets.
2. Menyatukan data publik dan internal ke store yang sama:
   - adapter publik mock membaca dari shared store
   - workflow internal menulis ke shared store yang sama
3. Mengganti auth internal ke session role-based:
   - login/logout via API
   - cookie session server-side
   - guard route/API per role dengan `proxy.ts`
4. Menyelesaikan halaman internal utama sesuai mockup fase 1-2:
   - `/internal`
   - `/internal/dashboard`
   - `/internal/datasets`
   - `/internal/datasets/new`
   - `/internal/datasets/[slug]`
   - `/internal/workflow`
   - `/internal/monitoring`
   - `/internal/users`
   - `/internal/archive`
   - `/internal/organizations`
   - `/internal/topics`
   - `/internal/notifications`
   - `/internal/workflow-history`
   - `/internal/settings`
   - `/internal/profile`
   - `/internal/help`
   - `/internal/integrations`
   - `/internal/workflow/[slug]/audit`
5. Menambahkan komponen internal reusable:
   - shell/sidebar role-aware
   - login form
   - dataset form
   - review board
   - settings form
   - password form
6. Menambahkan API internal baru:
   - `POST /api/internal/auth/login`
   - `POST /api/internal/auth/logout`
   - `PATCH /api/internal/datasets/[slug]`
   - `POST /api/internal/profile/password`
   - `POST /api/internal/settings`
7. Membuat halaman publik utama dynamic agar pembaruan status dari internal cepat terlihat di request berikutnya.
8. Memperbaiki bug cookie sesi lokal:
   - atribut `Secure` kini mengikuti protokol request, sehingga `next start` lokal di `http://localhost` tetap bisa login dan menulis ke API internal.

### 3) File utama yang dibuat/diupdate

1. `web/src/lib/types/internal.ts` (baru)
2. `web/src/lib/utils/internal-auth.ts` (baru)
3. `web/src/lib/utils/internal-auth-server.ts` (baru)
4. `web/src/lib/services/internal-store.ts` (baru)
5. `web/src/lib/adapters/mock-dataset-adapter.ts`
6. `web/src/lib/services/workflow-service.ts`
7. `web/src/lib/services/workflow-persistence.ts`
8. `web/src/proxy.ts`
9. `web/src/app/api/internal/auth/login/route.ts` (baru)
10. `web/src/app/api/internal/auth/logout/route.ts` (baru)
11. `web/src/app/api/internal/datasets/[slug]/route.ts` (baru)
12. `web/src/app/api/internal/profile/password/route.ts` (baru)
13. `web/src/app/api/internal/settings/route.ts` (baru)
14. `web/src/app/internal/*`
15. `web/src/components/internal/*`
16. `web/src/app/page.tsx`
17. `web/src/app/dataset/page.tsx`
18. `web/src/app/dataset/[slug]/page.tsx`
19. `web/src/app/topik/page.tsx`
20. `web/src/app/organisasi/page.tsx`
21. `web/src/app/metadata/page.tsx`
22. `web/src/app/api/page.tsx`
23. `README.md`
24. `web/README.md`
25. `docs/03_iteration_plan.md`
26. `docs/04_changelog.md`

### 4) Status run/build/test

Quality gate:

1. `cd web && npm run lint`: **Pass**
2. `cd web && npm run build`: **Pass**
3. Smoke route publik utama: **Pass**
   - `GET /` = **200**
   - `GET /dataset` = **200**
   - `GET /dataset/indikator-kemantapan-jalan-2026` = **200**
4. Smoke route internal utama dengan login admin: **Pass**
   - `/internal/dashboard` = **200**
   - `/internal/datasets` = **200**
   - `/internal/datasets/new` = **200**
   - `/internal/workflow` = **200**
   - `/internal/monitoring` = **200**
   - `/internal/users` = **200**
   - `/internal/archive` = **200**
   - `/internal/organizations` = **200**
   - `/internal/topics` = **200**
   - `/internal/notifications` = **200**
   - `/internal/workflow-history` = **200**
   - `/internal/settings` = **200**
   - `/internal/profile` = **200**
   - `/internal/help` = **200**
   - `/internal/integrations` = **200**
5. Verifikasi role access:
   - `walidata` ke `/internal/users` -> **307 redirect** ke dashboard
   - `operator_opd` ke `/internal/settings` -> **307 redirect** ke dashboard
6. Verifikasi sinkronisasi internal -> publik: **Pass**
   - login admin sukses
   - `POST /api/internal/workflow/transition` untuk `indikator-kemantapan-jalan-2026` mengembalikan **200**
   - store bersama berubah ke status `Published`
   - route publik `/dataset/indikator-kemantapan-jalan-2026` = **200**

### 5) Asumsi atau keputusan baru

1. Selama backend final belum aktif penuh, shared store lokal dipilih sebagai sumber data tunggal agar publik dan internal selalu sinkron.
2. Sinkronisasi near-real-time dilakukan dengan server-rendered request ke store yang sama, bukan websocket/event bus, untuk menjaga kestabilan dev lokal.
3. Role final dibatasi tegas ke `admin`, `walidata`, dan `operator_opd`; tidak ada `super admin` atau `reviewer` terpisah.
4. Session cookie internal dibuat adaptif terhadap protokol request agar aman di deployment `https` namun tetap workable pada smoke test lokal `http`.

### 6) Next step paling logis

1. Menambahkan coverage visual/a11y untuk halaman internal prioritas.
2. Menormalisasi sisa data legacy pada bootstrap store agar field status lama tidak menyisakan inkonsistensi kecil.
3. Menyiapkan adapter transisi dari shared store ke backend final/CKAN untuk mutasi internal tanpa mengubah UI.
