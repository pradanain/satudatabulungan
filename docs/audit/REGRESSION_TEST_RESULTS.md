# REGRESSION_TEST_RESULTS

Tanggal: 2026-05-03
Project: `C:\Projects\satudatabulungan\web`

## Command Execution

### 1) Lint
- Command: `npm run lint`
- Result: PASS

### 2) Typecheck
- Command: `npx tsc --noEmit`
- Result: PASS

### 3) Production Build
- Command: `npm run build`
- Result: PASS

### 4) Security/Authorization Regression
- Command: `npm run test:security`
- Result: PASS (`7 passed`)
- Cakupan utama:
  - signed session acceptance/rejection
  - forged/tampered cookie rejection
  - login fallback CKAN->local
  - cross-org draft/transition enforcement
  - API `401/403` contract
  - resourceUrl unsafe scheme rejection
  - stored XSS sanitization
  - public dataset published-only invariant
  - local store root path consistency

## Manual/API Smoke (Latency & Fallback)
Dijalankan terhadap `next start` lokal pada port `3012`.

- `GET /`
  - Result: `home_status:200 total:5.112211`
- `GET /api/infografis?source=auto&page=1&limit=6`
  - Result: `auto_status:503 total:5.127822`
- `GET /api/infografis?source=live&page=1&limit=6`
  - Result: `live_status:503 total:5.022923`

Interpretasi:
- Homepage tidak lagi blocking ~34 detik saat upstream bermasalah.
- Endpoint infografis kini fail-fast dengan fallback/error terstruktur dalam ~5 detik.

## Ringkasan Risiko Residual
- Upstream CKAN/live yang down masih menghasilkan log warning yang cukup banyak (fungsi tetap berjalan via fallback).
- Data lama yang sempat terlanjur di `web/.local` tidak otomatis dimigrasi; path aktif baru sudah konsisten ke root `.local`.

