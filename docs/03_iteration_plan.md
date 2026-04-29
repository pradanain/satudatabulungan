# 03 Iteration Plan

## Prinsip Iterasi

1. Iterasi selalu melanjutkan kondisi terakhir, tanpa reset dari nol.
2. Fitur yang sudah berjalan tidak dihapus kecuali diganti versi lebih baik dan tervalidasi.
3. Setiap iterasi menutup quality gate minimum: lint/build/route check.

## Roadmap

## Iterasi 1 - Fondasi Publik Runnable (Selesai)

Target:

1. Audit dokumen master package.
2. Membangun frontend publik fase 1.
3. Menyediakan adapter mock + CKAN.
4. Menyediakan dokumentasi implementasi awal.

Output:

1. Halaman `/`, `/dataset`, `/dataset/[slug]` aktif.
2. Komponen UI dasar lengkap.
3. Env config + README run lokal.
4. Lint/build sukses.

## Iterasi 2 - Penguatan Katalog dan UX Data (Selesai)

Target:

1. Paginasi katalog + state filter lebih kaya.
2. Search relevancy dan sorting lebih presisi.
3. Empty state dan loading state yang lebih kuat.
4. Peningkatan aksesibilitas (keyboard focus, aria labels tambahan, heading order audit).

Output aktual:

1. Paginasi URL-based dan page-size selector.
2. Filter kaya: status, tahun, tag.
3. Chip filter aktif + remove per-filter.
4. Halaman publik tambahan: `Topik`, `Organisasi`, `Metadata`, `API`.

## Iterasi 3 - Integrasi CKAN Nyata (Selesai)

Target:

1. Verifikasi endpoint CKAN lokal/staging.
2. Sinkronisasi mapping metadata (extras, groups, tags, resources).
3. Uji jalur fallback dan error handling runtime.
4. Sinkronisasi detail preview dari resource tabular (menuju DataStore).

Output aktual:

1. CKAN lokal berhasil `healthy` di `http://localhost:5000`.
2. Inisialisasi role `datastore_ro` dibuat otomatis via compose service `datastore-init`.
3. Koneksi API CKAN terverifikasi (`status_show` dan `package_search`).
4. Frontend mode `ckan` berjalan normal untuk katalog dan detail dataset.
5. Tersedia script bootstrap data CKAN: `scripts/seed-ckan-sample.mjs`.

## Iterasi 4 - Fondasi Panel Internal (Selesai Tahap Awal)

Target:

1. Login pengelola (basic).
2. Draft dataset form awal dengan validasi metadata wajib.
3. Skeleton workflow status (draft/submitted/revision/published).

Output aktual:

1. Route panel internal awal tersedia di `/internal/workflow`.
2. Board workflow status berjalan (Draft, Submitted, Need Revision, Approved, Published, Archived).
3. Aksi transisi status antar tahap tersedia di level UI sebagai fondasi UX workflow.
4. Link `Login` pada header sudah diarahkan ke panel internal workflow.
5. Dataset status model diperluas dengan status `Approved`.

## Iterasi 5 - Penyempurnaan Panel Internal (Selesai)

Target:

1. Persistensi transisi workflow ke backend.
2. Login pengelola dasar + pembatasan akses panel internal.
3. Form draft dataset awal dengan validasi metadata wajib.

Output aktual:

1. Transisi workflow dipersist lewat API internal ke backend aktif:
   - mode `ckan`: patch `extras.status` pada CKAN package.
   - mode `mock`: persist override status di `.local/mock-workflow-overrides.json`.
2. Proteksi Basic Auth aktif untuk:
   - `/internal/workflow`
   - `/api/internal/workflow/*`
3. Tooling token CKAN dipakai oleh persistence layer:
   - prioritas token: `CKAN_API_KEY` env -> cache `.local/ckan-admin.token`.
4. Smoke dual-mode dijadikan gate otomatis pipeline di:
   - `.github/workflows/quality-gate.yml`

## Iterasi 6 - Form Draft Internal (Selesai)

Target:

1. Form draft dataset awal (metadata minimum + resource minimum).
2. Simpan draft via API internal (mock/ckan mode).
3. Validasi field wajib sesuai requirement matrix.

Output aktual:

1. Form draft internal tersedia pada halaman `/internal/workflow`.
2. API draft internal aktif:
   - `POST /api/internal/workflow/draft`
3. Validasi metadata/resource wajib diterapkan di API draft.
4. Audit trail transisi `who/when/from/to` dipersist dan ditampilkan ringkas pada card workflow.
5. Smoke API workflow tersedia:
   - `scripts/smoke-workflow-api.mjs`
6. Pipeline quality gate menjalankan smoke API workflow + dual-mode smoke.

## Iterasi 7 - Audit Trail Lanjutan (Selesai)

Target:

1. Menambahkan timeline audit trail detail per dataset.
2. Menambahkan filter audit (aktor/status/rentang waktu).
3. Menambahkan ekspor log audit untuk kebutuhan administrasi.

Output aktual:

1. Halaman audit detail per dataset tersedia di:
   - `/internal/workflow/[slug]/audit`
2. Timeline audit lengkap ditampilkan dari data audit trail yang tersimpan.
3. Filter audit tersedia untuk:
   - `actor`
   - `status`
   - `dateFrom`
   - `dateTo`
4. Link audit per dataset ditambahkan di workflow board.
5. Smoke scripts diperluas untuk menguji route audit:
   - `smoke-dual-mode` memverifikasi 401 (tanpa auth) dan 200 (dengan auth) untuk audit page.
   - `smoke-workflow-api` memverifikasi audit page dengan query filter setelah transisi.

## Iterasi 8 - Audit Ops & Export (Selesai)

Target:

1. Menambahkan ekspor log audit (CSV/JSON) per dataset.
2. Menambahkan retention/rotation sederhana untuk audit file lokal.
3. Menambahkan smoke test untuk endpoint export audit.

Output aktual:

1. Endpoint export audit per dataset tersedia:
   - `GET /api/internal/workflow/[slug]/audit/export?format=json|csv`
2. Halaman audit detail menyediakan aksi cepat export:
   - `Export JSON`
   - `Export CSV`
3. Retention + rotation audit lokal diterapkan:
   - `WORKFLOW_AUDIT_RETENTION_DAYS`
   - `WORKFLOW_AUDIT_MAX_ENTRIES`
   - arsip rotasi `.local/workflow-audit-archive-YYYY-MM.jsonl`
4. Smoke script diperluas untuk endpoint export audit:
   - `scripts/smoke-workflow-api.mjs`
   - `scripts/smoke-dual-mode.mjs`

## Iterasi 12 - Internal Portal Role-Based dan Shared Store (Selesai)

Target:

1. Menyelesaikan halaman internal utama sesuai mockup internal fase 1-2.
2. Mengganti fondasi auth internal dari Basic Auth tunggal ke session role-based.
3. Menyatukan data publik dan internal ke shared source of truth lokal yang stabil.
4. Memastikan perubahan status dari internal tercermin ke halaman publik secara near-real-time.

Output aktual:

1. Halaman internal utama aktif:
   - login internal
   - dashboard
   - dataset list/detail/form
   - review & approval
   - monitoring & audit
   - users & roles
   - archive
   - organizations
   - topics
   - notifications
   - workflow history
   - settings
   - profile/password
   - help
   - integrations
2. Shared store lokal tersedia di `.local/internal-portal-store.json` dan dipakai bersama oleh publik + internal.
3. Session internal berbasis cookie server-side mendukung role:
   - `admin`
   - `walidata`
   - `operator_opd`
4. Proteksi route internal dan API internal mengikuti matriks akses role.
5. Publish dataset dari internal terbukti mengubah status store ke `Published` dan detail dataset publik ikut hidup.

## Definition of Done Per Iterasi

1. `docs/04_changelog.md` terbarui.
2. Build tidak error.
3. Route yang sudah ada tetap berjalan.
4. Catatan asumsi/keputusan baru terdokumentasi.
