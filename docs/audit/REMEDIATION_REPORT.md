# REMEDIATION_REPORT

Tanggal: 2026-05-03
Target: Portal Satu Data Bulungan (`web`)

## Ringkasan
Remediasi dilakukan mengikuti urutan prioritas pada `docs/audit-fixation-batch-first.txt`, dimulai dari build blocker, lalu security/authz critical-high, lalu kontrak API, validasi/sanitasi, published-only public dataset, timeout/fallback infografis-homepage, dan konsistensi path `.local`.

## Detail Per Issue

### Issue ID: PRIORITY-0-TS-BUILD
- File changed:
  - `web/src/app/page.tsx`
  - `web/tests/accessibility/public-a11y.spec.ts`
- Root cause:
  - `Image src` menerima nilai `string | undefined`.
  - Deteksi focus state menghasilkan union `string | boolean`.
- Fix summary:
  - Tambah fallback eksplisit `DEFAULT_PUBLICATION_IMAGE_SRC`.
  - Perbaiki ekspresi focus menjadi boolean murni.
- Tests added/updated:
  - Update existing `public-a11y.spec.ts` typing path.
- Commands run:
  - `npx tsc --noEmit`
  - `npm run build`
- Result:
  - PASS. Type blocker hilang, build kembali sukses.
- Remaining risk/blocker:
  - Tidak ada blocker untuk item ini.

### Issue ID: SEC-001 / BUG-002 (Forged Session)
- File changed:
  - `web/src/lib/utils/internal-auth.ts`
  - `web/src/lib/utils/internal-auth-server.ts`
  - `web/src/proxy.ts`
  - `web/src/app/api/internal/auth/login/route.ts`
- Root cause:
  - Cookie session internal sebelumnya hanya base64 JSON tanpa integrity check.
- Fix summary:
  - Migrasi ke token signed HMAC (`v1.payload.signature`) dengan secret server-side (`INTERNAL_SESSION_SECRET`, fallback dev-only untuk non-production).
  - Verifikasi signature di semua guard cookie parser.
  - Session lama/plain-base64 otomatis ditolak.
  - Proxy internal API kini mengembalikan JSON `401/403` (bukan redirect HTML).
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts`:
    - valid session accepted
    - tampered session rejected
    - forged plain-base64 admin rejected
    - logout clear cookie
- Commands run:
  - `npm run test:security`
- Result:
  - PASS. Forged/tampered cookie ditolak (`401`).
- Remaining risk/blocker:
  - Production wajib set `INTERNAL_SESSION_SECRET` kuat.

### Issue ID: SEC-002 / BUG-001 (Login CKAN fallback)
- File changed:
  - `web/src/app/api/internal/auth/login/route.ts`
- Root cause:
  - Exception CKAN memutus flow sebelum fallback local auth.
- Fix summary:
  - Bungkus login CKAN dalam `try/catch`, lanjutkan fallback local.
  - Tambah `errorCode` untuk membedakan invalid credential vs upstream unavailable.
  - Hindari bocor pesan mentah ke client.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` scenario login valid/invalid saat CKAN down.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS. CKAN down + local valid tetap login sukses.
- Remaining risk/blocker:
  - Dependensi CKAN tetap external risk, tapi tidak lagi memblokir local fallback.

### Issue ID: SEC-003 / BUG-003 (Draft Cross-Org)
- File changed:
  - `web/src/lib/services/internal-store.ts`
  - `web/src/app/api/internal/workflow/draft/route.ts`
- Root cause:
  - Tidak ada enforcement owner org untuk role `operator_opd`.
- Fix summary:
  - Operator dipaksa menggunakan `session.organizationId`.
  - Override ke organisasi lain ditolak (`403`).
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` cross-org draft rejected.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Tidak ada blocker.

### Issue ID: SEC-004 / BUG-004 (Transition Cross-Org)
- File changed:
  - `web/src/lib/services/internal-store.ts`
  - `web/src/app/api/internal/workflow/transition/route.ts`
- Root cause:
  - Tidak ada cek ownership dataset untuk operator sebelum transisi.
- Fix summary:
  - Tambah cek `dataset.organizationId === session.organizationId` khusus operator sebelum workflow transition.
  - Hak admin/walidata tetap sesuai aturan existing.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts`:
    - operator cross-org transition -> `403`
    - operator own-org Need Revision -> Submitted -> sukses
    - operator Submitted -> Approved -> `403`
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Tidak ada blocker.

### Issue ID: SEC-007 / SEC-008 / BUG-005 / BUG-008 (API Error Contract)
- File changed:
  - `web/src/proxy.ts`
  - `web/src/lib/utils/internal-api-response.ts`
  - `web/src/app/api/internal/workflow/draft/route.ts`
  - `web/src/app/api/internal/workflow/transition/route.ts`
  - `web/src/app/api/internal/datasets/[slug]/route.ts`
  - `web/src/app/api/internal/uploads/[contentType]/route.ts`
- Root cause:
  - API internal no-auth redirect 307, dan unauthorized action sebagian jatuh ke 500.
- Fix summary:
  - Pisah behavior page internal vs API internal.
  - `/api/internal/*` tanpa sesi => JSON `401`.
  - Role tidak berhak => JSON `403`.
  - Mapper status error ditambahkan agar validation/forbidden tidak lagi jadi 500.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` API contract tests.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Untuk endpoint internal lain di luar scope ini, pola mapper tetap perlu dipertahankan konsisten.

### Issue ID: SEC-005 / BUG-006 (resourceUrl validation)
- File changed:
  - `web/src/lib/utils/resource-url.ts`
  - `web/src/app/api/internal/workflow/draft/route.ts`
  - `web/src/app/api/internal/datasets/[slug]/route.ts`
- Root cause:
  - `resourceUrl` belum di-whitelist protokol aman.
- Fix summary:
  - Tambah validator ketat URL: hanya `http://` dan `https://`.
  - `javascript:`, `data:`, malformed URL ditolak (`400`).
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` invalid URL rejected.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Tidak ada blocker.

### Issue ID: SEC-006 / BUG-007 (Stored XSS risk)
- File changed:
  - `web/src/lib/utils/input-sanitizer.ts`
  - `web/src/app/api/internal/workflow/draft/route.ts`
  - `web/src/app/api/internal/datasets/[slug]/route.ts`
  - `web/src/app/api/internal/workflow/transition/route.ts`
  - `web/src/app/api/internal/uploads/[contentType]/route.ts`
  - `web/src/lib/services/internal-store.ts`
- Root cause:
  - Field teks sensitif disimpan tanpa sanitasi server-side.
- Fix summary:
  - Terapkan sanitasi server-side (strip dangerous block tags + html tags) untuk field teks draft/update/review note/upload notes.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` verifikasi payload XSS tidak tersimpan mentah di store.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Rendering tetap harus escape di UI (sudah default React untuk text node).

### Issue ID: SEC-009 / BUG-012 (Published-only public dataset)
- File changed:
  - `web/src/lib/services/dataset-service.ts`
  - `web/src/app/dataset/page.tsx`
  - `web/src/app/dataset/[slug]/page.tsx`
- Root cause:
  - Route publik memakai service umum tanpa hard-enforce published-only.
- Fix summary:
  - Tambah public-only service:
    - `getPublicDatasets`
    - `getPublicDatasetBySlug`
    - `getPublicDatasetFilterOptions`
  - Katalog dan detail publik pindah ke service public-only.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts`:
    - status non-published tidak muncul di katalog
    - slug non-published -> `404`
- Commands run:
  - `npm run test:security`
- Result:
  - PASS.
- Remaining risk/blocker:
  - Halaman publik lain yang memakai `getDatasets` umum perlu disiplin serupa bila ditambahkan fitur baru.

### Issue ID: BUG-009 / BUG-010 / PERF-002 / PERF-003 (Homepage & Infografis timeout)
- File changed:
  - `web/src/lib/utils/async-timeout.ts`
  - `web/src/app/page.tsx`
  - `web/src/app/api/infografis/route.ts`
  - `web/src/lib/services/infografis-service.ts`
- Root cause:
  - Fetch upstream live dapat blocking lama.
- Fix summary:
  - Tambah timeout eksplisit:
    - homepage infografis call: 4 detik + fallback empty
    - API infografis: 5 detik + structured fallback/error (`errorCode`)
  - Tuning service infografis: timeout/retry/page-scan lebih pendek.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` (route tetap responsif saat sumber bermasalah).
  - Smoke runtime dengan `curl` menunjukkan respon endpoint kembali dalam ~5 detik.
- Commands run:
  - `curl` smoke ke `/`, `/api/infografis?source=auto`, `/api/infografis?source=live`
- Result:
  - PASS: tidak lagi blocking ~34 detik; fallback terstruktur aktif.
- Remaining risk/blocker:
  - Saat CKAN/live upstream down, log warning masih banyak (fungsional aman, observability perlu rate-limit logging jika ingin lebih bersih).

### Issue ID: BUG-011 / PERF-006 (Local store path consistency)
- File changed:
  - `web/src/lib/utils/local-store-path.ts`
  - `web/src/lib/services/internal-store.ts`
  - `web/src/app/api/data-requests/route.ts`
- Root cause:
  - Resolver root path bergantung `cwd` terbatas (`app` saja), menyebabkan split store.
- Fix summary:
  - Canonical project root resolver kini menangani `web` dan root repo.
  - Store path resolve terpusat + log lokasi store aktif.
- Tests added/updated:
  - `web/tests/security/internal-remediation.spec.ts` validasi root path resolver.
- Commands run:
  - `npm run test:security`
- Result:
  - PASS: store aktif menunjuk root `.local`.
- Remaining risk/blocker:
  - Data lama yang terlanjur ada di `web/.local` mungkin masih perlu migrasi manual jika ingin dibersihkan.

