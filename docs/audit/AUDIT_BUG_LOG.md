# AUDIT_BUG_LOG

Tanggal: 2026-05-03

## BUG-001
- Judul: Login internal gagal saat CKAN down, fallback local tidak dieksekusi
- Severity: Critical
- Repro steps:
  1. Pastikan CKAN tidak reachable (`localhost:5000` down).
  2. POST `/api/internal/auth/login` dengan payload valid admin lokal.
- Expected: fallback local store -> login sukses.
- Actual: `500 {"error":"fetch failed"}`.
- Affected route/API: `POST /api/internal/auth/login`
- Affected role: admin/walidata/operator
- Evidence: response valid-admin login
- Dugaan root cause: exception dari `login()` CKAN memutus flow sebelum `authenticateInternalUser()`.
- Rekomendasi fix: wrap CKAN login call dengan try/catch lalu fallback.

## BUG-002
- Judul: Session internal dapat dipalsukan (tanpa signature)
- Severity: Critical
- Repro steps:
  1. Buat cookie base64 JSON berisi role admin.
  2. Panggil `PATCH /api/internal/settings`.
- Expected: request ditolak.
- Actual: `200 success`.
- Affected route/API: seluruh `/internal/*` dan `/api/internal/*`
- Affected role: semua
- Evidence: forged cookie admin berhasil update settings.
- Dugaan root cause: `decodeInternalSession()` hanya decode JSON plain.
- Rekomendasi fix: signed/encrypted token atau server-side session.

## BUG-003
- Judul: Operator dapat membuat draft untuk OPD lain
- Severity: High
- Repro steps:
  1. Forge/login operator OPD A.
  2. POST draft dengan `ownerOrgSlug`/`organization` OPD B.
- Expected: 403.
- Actual: `200` draft dibuat.
- Affected route/API: `POST /api/internal/workflow/draft`
- Affected role: operator_opd
- Evidence: `draft-audit-cross-org-2026` tersimpan org Dinkes oleh operator Disdukcapil.
- Dugaan root cause: tidak ada ownership enforcement saat create draft.
- Rekomendasi fix: force org owner = session organization (untuk operator).

## BUG-004
- Judul: Operator dapat transisi dataset OPD lain (Need Revision -> Submitted)
- Severity: High
- Repro steps:
  1. Gunakan operator OPD A.
  2. POST transition dataset OPD B dari Need Revision ke Submitted.
- Expected: 403.
- Actual: `200`.
- Affected route/API: `POST /api/internal/workflow/transition`
- Affected role: operator_opd
- Evidence: transition sukses pada slug `rekap-partisipasi-sekolah-menengah-2026`.
- Dugaan root cause: fungsi transition tidak cek ownership dataset.
- Rekomendasi fix: cek dataset.organizationId vs session.organizationId sebelum apply transition.

## BUG-005
- Judul: Unauthorized action mengembalikan 500, bukan 403
- Severity: High
- Repro steps:
  1. Walidata/operator patch dataset tanpa izin.
  2. Operator lakukan transition yang tidak diizinkan role.
- Expected: 403 forbidden.
- Actual: 500 internal error.
- Affected route/API:
  - `PATCH /api/internal/datasets/[slug]`
  - `POST /api/internal/workflow/transition`
- Affected role: walidata/operator
- Evidence: response berisi pesan akses tetapi status 500.
- Dugaan root cause: mapping status error tidak memetakan error authorization.
- Rekomendasi fix: map error akses/izin menjadi 403.

## BUG-006
- Judul: Validasi `resourceUrl` lemah (menerima scheme `javascript:`)
- Severity: High
- Repro steps: create draft dengan `resourceUrl=javascript:alert(1)`.
- Expected: 400 invalid URL.
- Actual: 200 dan data tersimpan.
- Affected route/API: `POST /api/internal/workflow/draft`
- Affected role: operator_opd
- Evidence: slug `draft-url-non-http-2026` tersimpan.
- Dugaan root cause: validasi hanya required, tanpa whitelist.
- Rekomendasi fix: enforce URL `http/https`.

## BUG-007
- Judul: Payload XSS disimpan mentah pada draft
- Severity: Medium
- Repro steps: kirim title `<script>alert(1)</script>` dan summary payload XSS.
- Expected: reject/sanitize.
- Actual: 200, payload tersimpan.
- Affected route/API: `POST /api/internal/workflow/draft`
- Affected role: operator_opd
- Evidence: slug `draft-xss-title-2026` di store lokal.
- Dugaan root cause: sanitasi input server-side belum ada.
- Rekomendasi fix: sanitasi field teks sebelum persist.

## BUG-008
- Judul: API internal tanpa auth redirect 307 ke `/internal` (bukan JSON 401/403)
- Severity: Medium
- Repro steps: akses endpoint `/api/internal/*` tanpa cookie.
- Expected: 401/403 JSON.
- Actual: 307 redirect.
- Affected route/API: mayoritas `/api/internal/*`
- Affected role: public/no-session
- Evidence: no-auth ke settings/draft/transition/upload/datasets/audit-export -> 307.
- Dugaan root cause: proxy memaksa redirect untuk API path.
- Rekomendasi fix: untuk path API kembalikan JSON auth error.

## BUG-009
- Judul: Homepage response sangat lambat
- Severity: High
- Repro steps: GET `/` pada server lokal.
- Expected: respons cepat.
- Actual: ~34 detik.
- Affected route/API: `/`
- Affected role: public
- Evidence: curl timing `/ => 200 34.051243`.
- Dugaan root cause: fetch infografis live blocking server render.
- Rekomendasi fix: timeout agresif + fallback cache/asinkron.

## BUG-010
- Judul: Endpoint infografis `source=auto/live` timeout lama
- Severity: Medium
- Repro steps: GET `/api/infografis?source=auto` atau `source=live`.
- Expected: respons dalam waktu wajar, graceful fallback.
- Actual: timeout (curl `--max-time 25` -> `HTTP_STATUS:000`).
- Affected route/API: `/api/infografis`
- Affected role: public
- Evidence: timeout pada source auto/live; source ckan return 500 cepat.
- Dugaan root cause: dependensi upstream live tanpa timeout/circuit breaker efektif.
- Rekomendasi fix: network timeout per upstream + cache + fallback deterministic.

## BUG-011
- Judul: Inkonstensi lokasi store lokal (`.local`) bergantung `cwd`
- Severity: Medium
- Repro steps:
  1. Jalankan app dari folder `web`.
  2. Buat draft / data-request.
- Expected: store konsisten di satu lokasi proyek.
- Actual: data tersimpan di `web/.local/*` (bukan root `.local/*`).
- Affected route/API: internal store & data-requests
- Affected role: semua internal operator
- Evidence: `web/.local/internal-portal-store.json` dan `web/.local/public-data-requests.jsonl` berisi hasil uji.
- Dugaan root cause: `getProjectRoot()` hanya meng-handle basename `app`, tidak `web`.
- Rekomendasi fix: standardisasi base path `.local` di root repo.

## BUG-012
- Judul: Potensi kebocoran status non-published di katalog publik
- Severity: Medium
- Repro steps: buka `/dataset`, cek option filter status pada HTML.
- Expected: publik hanya `Published`.
- Actual: ditemukan status `Submitted` di options.
- Affected route/API: `/dataset`, `dataset-service`
- Affected role: public
- Evidence: payload RSC/HTML memuat statuses `Published`, `Submitted`.
- Dugaan root cause: route publik memakai service umum (`getDatasets`) bukan public-only filter hard.
- Rekomendasi fix: enforce filter `Published` di layer service publik.
