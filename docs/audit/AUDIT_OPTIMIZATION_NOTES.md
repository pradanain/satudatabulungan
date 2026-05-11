# AUDIT_OPTIMIZATION_NOTES

Tanggal: 2026-05-03

## Ringkasan
Temuan performa paling menonjol ada di homepage dan endpoint infografis (source auto/live) yang blocking cukup lama. Selain itu terdapat beberapa area kontrak API dan fallback yang menimbulkan retry/error cascade.

## PERF-001 Build & Type Pipeline
- Observasi:
  - `npm run lint` sukses.
  - `npx tsc --noEmit` gagal (`src/app/page.tsx:294`, `tests/accessibility/public-a11y.spec.ts:65`).
  - `npm run build` gagal karena type error yang sama.
- Dampak:
  - pipeline CI/CD terhenti sebelum deploy production.
- Rekomendasi:
  1. Perbaiki type mismatch `src/app/page.tsx:294` (`Image src` kemungkinan undefined).
  2. Perbaiki test typing di `tests/accessibility/public-a11y.spec.ts:65`.

## PERF-002 Homepage Latency
- Observasi:
  - GET `/` ~34 detik (`curl` timing).
- Dugaan penyebab:
  - server render homepage menunggu `getInfografisApiPayload({source:"live"})` yang upstream-bound.
- Risiko:
  - TTFB tinggi, UX buruk, berpotensi timeout di synthetic test.
- Rekomendasi:
  1. Terapkan timeout pendek (misal 2-5s) untuk upstream live.
  2. Jika timeout/error, fallback ke cached payload atau empty state non-blocking.
  3. Pertimbangkan background refresh + stale-while-revalidate.

## PERF-003 Infografis API Resilience
- Observasi:
  - `source=auto/live` timeout >25s (client side timeout).
  - `source=ckan` gagal cepat dengan payload error terstruktur (`500`).
- Dampak:
  - endpoint tidak predictable untuk konsumsi publik.
- Rekomendasi:
  1. Tambah circuit breaker / timeout per source.
  2. Saat source utama lambat, return fallback cepat dengan `success:false` + metadata error yang konsisten.
  3. Simpan snapshot cache hasil fetch terakhir yang valid.

## PERF-004 Playwright WebServer Stability
- Observasi:
  - `test:a11y` dan `test:visual` gagal start/timeout karena webServer startup conflict/port/state.
- Dampak:
  - regression test otomatis tidak reliabel.
- Rekomendasi:
  1. Gunakan port dedicated per run (`PLAYWRIGHT_PORT`) dan cleanup proses sebelum test.
  2. Tambah health endpoint ringan (misal `/healthz`) untuk readiness check, jangan `/` yang berat.
  3. Untuk CI, gunakan mode data mock sepenuhnya dan matikan call eksternal non-esensial.

## PERF-005 Error Contract Optimization
- Observasi:
  - endpoint internal unauthorized sering `307` redirect atau `500` meski kasus permission.
- Dampak:
  - klien API sulit melakukan retry/backoff tepat, observability jadi noisy.
- Rekomendasi:
  1. Standarkan error contract API internal: `401` unauthenticated, `403` unauthorized, `400` validation.
  2. Pisahkan middleware page redirect dan API JSON response.

## PERF-006 Data Source Consistency
- Observasi:
  - penulisan `.local` bergantung working directory, bisa ke `web/.local`.
- Dampak:
  - cache/store split, hasil test dan state operasional terfragmentasi.
- Rekomendasi:
  1. Tetapkan satu canonical base path untuk store lokal di root repo.
  2. Tambahkan log startup yang mencetak lokasi store aktif.

## Quick Wins Prioritas
1. Fix TypeScript blocker (`page.tsx:294`, `public-a11y.spec.ts:65`).
2. Tambahkan timeout + fallback non-blocking untuk fetch infografis homepage.
3. Tambahkan `/healthz` untuk readiness Playwright.
4. Normalisasi status code unauthorized (401/403) agar monitoring lebih bersih.
5. Standardisasi lokasi `.local` agar state tidak terpecah.
