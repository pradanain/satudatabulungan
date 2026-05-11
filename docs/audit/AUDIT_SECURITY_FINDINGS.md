# AUDIT_SECURITY_FINDINGS

Tanggal: 2026-05-03  
Target: Portal Satu Data Bulungan (`web`)

## SEC-001 - Forged Session Cookie Enables Admin Privilege Escalation
- Severity: Critical
- Jenis risiko: Broken Authentication / Session Integrity
- Endpoint/route terdampak:
  - `/internal/*`
  - `/api/internal/*`
- Role terdampak: semua role, termasuk unauthenticated attacker
- Repro (aman):
  1. Buat JSON session palsu dengan `role: "admin"`.
  2. Encode base64.
  3. Kirim sebagai cookie `satudata_internal_session`.
  4. Panggil `PATCH /api/internal/settings`.
- Dampak: attacker dapat eskalasi hak ke admin tanpa login valid.
- Bukti: forged cookie admin berhasil `HTTP 200` pada settings update.
- Dugaan root cause kode:
  - `web/src/lib/utils/internal-auth.ts` -> `decodeInternalSession()` hanya base64 decode JSON tanpa signature.
  - `web/src/lib/utils/internal-auth-server.ts` -> seluruh guard mempercayai payload cookie.
- Rekomendasi:
  - Ganti cookie plain-base64 menjadi signed/encrypted token.
  - Verifikasi integritas token pada setiap request.
  - Pertimbangkan server-side session store + session ID acak.

## SEC-002 - Login Fallback Failure Causes Auth Denial When CKAN Unavailable
- Severity: High
- Jenis risiko: Authentication Availability / Fail-open-failover bug
- Endpoint: `POST /api/internal/auth/login`
- Dampak: login valid local seed gagal total (`500`) saat CKAN down.
- Bukti: valid & invalid credential sama-sama `{"error":"fetch failed"}`.
- Dugaan root cause:
  - `web/src/app/api/internal/auth/login/route.ts` memakai `(await login()) ?? (await authenticateInternalUser())`
  - fungsi `login()` melempar exception saat CKAN unreachable, sehingga fallback tidak dieksekusi.
- Rekomendasi:
  - Bungkus call `login()` CKAN dalam try/catch, lalu fallback ke local store jika network/error eksternal.

## SEC-003 - Operator Can Create Draft for Other Organization
- Severity: High
- Jenis risiko: Broken Access Control
- Endpoint: `POST /api/internal/workflow/draft`
- Dampak: operator OPD A bisa membuat draft milik OPD B.
- Bukti: slug `draft-audit-cross-org-2026` tersimpan `organizationId=opd-dinkes` dengan owner `user-operator-disdukcapil`.
- Dugaan root cause:
  - `web/src/lib/services/internal-store.ts#createInternalDatasetDraft`
  - tidak ada guard yang memaksa operator menggunakan `session.organizationId`.
- Rekomendasi:
  - Pada role `operator_opd`, force `organizationId = session.organizationId` dan tolak override owner org.

## SEC-004 - Operator Can Transition Other Organization Dataset
- Severity: High
- Jenis risiko: Broken Access Control
- Endpoint: `POST /api/internal/workflow/transition`
- Dampak: operator bisa mengubah status dataset OPD lain untuk transisi yang diizinkan role.
- Bukti: operator Disdukcapil berhasil transisi dataset Dikbud (`Need Revision -> Submitted`) `HTTP 200`.
- Dugaan root cause:
  - `web/src/lib/services/internal-store.ts#transitionInternalDataset`
  - cek ownership dataset tidak dilakukan sebelum `ensureTransitionAccess`.
- Rekomendasi:
  - Tambah ownership check by dataset.organizationId vs session.organizationId (khusus operator).

## SEC-005 - Unsafe Resource URL Accepted (`javascript:`)
- Severity: High
- Jenis risiko: Stored Injection / Unsafe URL
- Endpoint: `POST /api/internal/workflow/draft`
- Dampak: URL berbahaya tersimpan dan berpotensi dieksekusi jika dirender sebagai link tanpa sanitasi lanjutan.
- Bukti: draft `draft-url-non-http-2026` berhasil disimpan dengan `resourceUrl=javascript:alert(1)`.
- Dugaan root cause:
  - Validasi hanya `required`, tanpa whitelist scheme.
- Rekomendasi:
  - Validasi URL harus `http://` atau `https://` saja.

## SEC-006 - XSS Payload Persisted in Draft Fields
- Severity: Medium
- Jenis risiko: Stored XSS potential
- Endpoint: `POST /api/internal/workflow/draft`
- Dampak: payload script tersimpan di data; risiko jika ada rendering non-escaped (sekarang React umumnya escape, tapi tetap data berbahaya tersimpan).
- Bukti: draft `draft-xss-title-2026` tersimpan dengan title `<script>alert(1)</script>`.
- Rekomendasi:
  - Sanitasi input server-side untuk field teks tertentu.
  - Tambahkan output encoding audit di export/reporting path.

## SEC-007 - Internal APIs Redirect (307) Instead of 401/403
- Severity: Medium
- Jenis risiko: API auth contract inconsistency
- Endpoint: mayoritas `/api/internal/*` saat unauth
- Dampak: klien API mendapat redirect HTML-style, bukan error auth eksplisit.
- Bukti: no-auth ke `/api/internal/settings` dan endpoint internal lain -> `307 /internal`.
- Dugaan root cause:
  - `web/src/proxy.ts` menerapkan redirect login untuk path API internal.
- Rekomendasi:
  - Bedakan behavior page vs API: API harus return JSON 401/403, bukan redirect.

## SEC-008 - Unauthorized Actions Return 500 (Should Be 403)
- Severity: Medium
- Jenis risiko: Error handling / authorization semantics
- Endpoint terdampak:
  - `PATCH /api/internal/datasets/[slug]`
  - `POST /api/internal/workflow/transition`
- Dampak: salah status code mempersulit monitoring/security alert dan dapat menyamarkan authorization bug.
- Bukti: walidata/operator unauthorized edit -> `500` dengan pesan akses ditolak.
- Rekomendasi:
  - Map pesan `akses/izin` menjadi HTTP 403 konsisten.

## SEC-009 - Potential Public Exposure Path in Dataset Service
- Severity: Medium
- Jenis risiko: Data exposure policy drift
- Route: `/dataset` dan `/dataset/[slug]`
- Dampak: service publik memakai `getDatasets/getDatasetBySlug` tanpa hard filter `Published`, berisiko bocor jika source memuat status internal.
- Bukti: options status pada HTML katalog memuat `Submitted`.
- Dugaan root cause:
  - `web/src/app/dataset/page.tsx` dan `web/src/app/dataset/[slug]/page.tsx` memakai `dataset-service` general, bukan fungsi public-only snapshot.
- Rekomendasi:
  - Gunakan service public-only yang enforce `status === Published` di server.
