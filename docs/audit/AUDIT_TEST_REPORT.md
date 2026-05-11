# AUDIT TEST REPORT

Tanggal audit: 2026-05-03  
Repo: `C:\Projects\satudatabulungan`  
Scope: publik + internal + API berdasarkan kode aktual repo

## A. Executive Summary
- Status umum: **PARTIAL PASS dengan temuan kritikal keamanan dan otorisasi**.
- Total test case dieksekusi: **46**
- PASS: **24**
- FAIL: **15**
- BLOCKED: **5**
- NOT IMPLEMENTED / NOT FOUND: **2**
- Risiko terbesar:
  1. Session cookie internal dapat dipalsukan (privilege escalation ke admin).
  2. Login internal gagal total saat CKAN down (fallback local store tidak berjalan).
  3. Operator bisa membuat draft lintas organisasi dan melakukan transisi lintas organisasi pada kondisi tertentu.
- Prioritas perbaikan: security/authentication -> authorization server-side -> workflow integrity -> performance.

## B. Test Environment
- OS/runtime: Windows PowerShell
- Node: `v22.20.0`
- npm: `10.9.3`
- Branch/commit: `main` / `4174e6551c99653a79dccf43b52d7652d95d1ad0`
- Mode data (env): `DATA_SOURCE_MODE=ckan`
- Env ditemukan:
  - `NEXT_PUBLIC_CKAN_BASE_URL=http://localhost:5000`
  - `CKAN_BASE_URL=http://localhost:5000`
  - `CKAN_API_KEY` tidak diset di `.env`
- Command utama:
  - `npm run lint` -> PASS
  - `npx tsc --noEmit` -> FAIL (type error di `src/app/page.tsx:294` dan `tests/accessibility/public-a11y.spec.ts:65`)
  - `npm run build` -> FAIL (type error `src/app/page.tsx:294`)
  - `npm run test:a11y` -> FAIL/BLOCKED (webServer timeout)
  - `npm run test:visual` -> FAIL/BLOCKED (webServer tidak start karena konflik server dev)

## C. Route & Feature Coverage Matrix
| Fitur | Lokasi kode | Route/API | Role | Status | Bukti ringkas | Catatan |
|---|---|---|---|---|---|---|
| Login internal | `web/src/app/api/internal/auth/login/route.ts` | `POST /api/internal/auth/login` | all | FAIL | valid kredensial -> `500 {"error":"fetch failed"}` | fallback CKAN->local tidak berjalan saat CKAN down |
| Logout internal | `web/src/app/api/internal/auth/logout/route.ts` | `POST /api/internal/auth/logout` | all | PASS | `200` + clear cookie | Set-Cookie HttpOnly + SameSite=Lax |
| Proteksi API internal tanpa auth | `web/src/proxy.ts` | `/api/internal/*` | public | FAIL | no cookie -> `307 /internal` | API redirect, bukan 401/403 |
| RBAC page admin | `internal-shell.tsx` + `internal-auth.ts` | `/internal/*` | admin | PASS | seluruh menu internal utama `200` | sesuai matrix nav access |
| RBAC page walidata | sama | `/internal/users`, `/internal/settings` | walidata | PASS | redirect `307 /internal/dashboard` | guard via proxy/nav key |
| RBAC page operator | sama | `/internal/monitoring`, `/internal/settings`, dll | operator | PASS | redirect `307 /internal/dashboard` | guard via proxy/nav key |
| Settings API admin | `api/internal/settings/route.ts` | `PATCH /api/internal/settings` | admin | PASS | dengan cookie admin -> `200` | update berhasil |
| Settings API non-admin | sama | `PATCH /api/internal/settings` | walidata/operator | PASS (guard) | `307 /internal/dashboard` | guard di proxy, bukan 403 JSON |
| Draft create valid | `api/internal/workflow/draft/route.ts` | `POST /api/internal/workflow/draft` | operator | PASS | `200` slug draft baru | draft tersimpan di `web/.local/internal-portal-store.json` |
| Draft create bad frequency | sama | same | operator | PASS | `400 Field 'frequency' tidak valid` | validasi enum jalan |
| Draft create URL javascript | sama | same | operator | FAIL | `200` untuk `resourceUrl=javascript:alert(1)` | validasi URL tidak ketat |
| Draft cross-organization | `internal-store.ts#createInternalDatasetDraft` | same | operator | FAIL | operator Disdukcapil buat draft org Dinkes -> `200` | tidak ada cek ownership org |
| Workflow transition valid operator | `api/internal/workflow/transition` | Draft->Submitted | operator | PASS | `200` | transisi valid jalan |
| Workflow transition invalid role | sama | Submitted->Approved | operator | FAIL | `500` + pesan izin | status code harusnya 403 |
| Workflow transition invalid edge | sama | Draft->Approved | admin | PASS | `400` | validator transition jalan |
| Workflow cross-org transition | `internal-store.ts#transitionInternalDataset` | Need Revision->Submitted | operator | FAIL | operator OPD A transisi dataset OPD B -> `200` | tidak ada cek ownership dataset |
| Audit export JSON/CSV | `api/internal/workflow/[slug]/audit/export` | GET format json/csv | walidata | PASS | `200` JSON/CSV valid | filter status juga jalan |
| Audit export invalid format | sama | `format=xml` | walidata | PASS | `400` | validasi format jalan |
| API audit non-export | N/A | `/api/internal/workflow/[slug]/audit` | admin | NOT IMPLEMENTED | `404` page not-found | endpoint ini tidak ada (hanya export) |
| Internal uploads no auth | `api/internal/uploads/[contentType]` | POST uploads | public | PASS | `307 /internal` | auth guard via proxy |
| Internal uploads invalid type | sama | `/api/internal/uploads/unknown` | operator | PASS | `400` | validasi contentType jalan |
| Upload CKAN path | sama + `ckan-portal-api.ts` | `/api/internal/uploads/dataset` | operator | BLOCKED | `400 organisasi pemilik tidak ditemukan` (CKAN down) | uji upload end-to-end CKAN tidak bisa |
| Public data requests valid | `api/data-requests/route.ts` | `POST /api/data-requests` | public | PASS | `201` ticket dibuat | tersimpan di `web/.local/public-data-requests.jsonl` |
| Data requests invalid email | sama | same | public | PASS | `400` | validasi email jalan |
| Data requests honeypot | sama | same | public | PASS | `400` | honeypot jalan |
| Data requests invalid period | sama | same | public | PASS | `400` | validasi periode jalan |
| Data requests origin mismatch | sama | same | public | PASS | `403` | origin check jalan |
| Data requests rate limit | sama | same | public | PASS | hit berulang -> `429` | rate limit aktif |
| Public infografis invalid source | `api/infografis/route.ts` | `source=abc` | public | PASS | `400` | validasi source jalan |
| Public infografis source=ckan | sama | `source=ckan` | public | PASS (graceful fail) | `500` dengan payload error terstruktur | error tidak crash |
| Public infografis source=auto/live | sama + `infografis-service.ts` | auto/live | public | FAIL | timeout >25s (HTTP 000 dari curl max-time) | latency tinggi |
| Public routes accessibility | multiple pages | `/dataset`, `/publikasi-*`, `/api`, dll | public | PASS | route utama publik `200` | homepage sangat lambat |
| Homepage performance | `src/app/page.tsx` | `/` | public | FAIL | TTFB ~34s | blocking fetch ke sumber eksternal infografis |
| Dataset detail non-published internal slug | `dataset/[slug]/page.tsx` | `/dataset/<slug internal-store>` | public | PASS | `404` untuk slug non-public internal store | slug tidak ada di adapter publik saat ini |
| Dataset catalog publication-only invariant | `dataset/page.tsx` + `dataset-service.ts` | `/dataset` | public | FAIL (risk) | filter options HTML memuat status `Submitted` | katalog publik tidak memaksa `Published only` |

## D. Test Case Detail (ringkasan)
### TC-AUTH-001
- Area: Auth Internal
- Role: admin
- Precondition: CKAN tidak tersedia (`localhost:5000` refused)
- Steps: POST `/api/internal/auth/login` dengan kredensial valid local seed
- Expected: fallback ke local store, login sukses
- Actual: `500 {"error":"fetch failed"}`
- Status: FAIL
- Evidence: response login valid-admin
- Severity: Critical
- Recommendation: tangkap exception `login()` CKAN, lalu fallback local secara eksplisit.

### TC-SEC-001
- Area: Session Security
- Role: attacker/public
- Precondition: tahu format cookie base64 JSON
- Steps: forge cookie `satudata_internal_session` role=admin -> PATCH `/api/internal/settings`
- Expected: request ditolak (signature invalid)
- Actual: `200 success`
- Status: FAIL
- Evidence: response patch settings admin forged cookie
- Severity: Critical
- Recommendation: gunakan signed/encrypted session token (JWT HS/RS atau session server-side), verifikasi integritas token.

### TC-RBAC-001
- Area: Workflow Draft Authorization
- Role: operator_opd
- Steps: buat draft dengan `ownerOrgSlug` organisasi lain
- Expected: ditolak 403
- Actual: `200`, draft dibuat untuk OPD lain
- Status: FAIL
- Evidence: slug `draft-audit-cross-org-2026` tersimpan orgId `opd-dinkes`, owner operator Disdukcapil
- Severity: High
- Recommendation: enforce `session.organizationId` untuk operator pada create draft.

### TC-RBAC-002
- Area: Workflow Transition Authorization
- Role: operator_opd
- Steps: transisi dataset OPD lain `Need Revision -> Submitted`
- Expected: ditolak 403
- Actual: `200`
- Status: FAIL
- Evidence: `rekap-partisipasi-sekolah-menengah-2026` berhasil ditransisikan oleh operator OPD lain
- Severity: High
- Recommendation: validasi ownership dataset sebelum `ensureTransitionAccess`.

### TC-VAL-001
- Area: Input Validation
- Role: operator_opd
- Steps: create draft dengan `resourceUrl=javascript:alert(1)`
- Expected: ditolak 400
- Actual: `200` tersimpan
- Status: FAIL
- Evidence: `draft-url-non-http-2026` resource URL tersimpan `javascript:alert(1)`
- Severity: High
- Recommendation: whitelist scheme `https?` untuk URL resource.

### TC-PERF-001
- Area: Performance
- Role: public
- Steps: akses `/`
- Expected: respons cepat
- Actual: ~34 detik
- Status: FAIL
- Evidence: curl timing `/ => 200 34.051243`
- Severity: High
- Recommendation: jangan blok render homepage pada fetch infografis live; gunakan timeout pendek + fallback cached.

## E. Bug & Error Log
Lihat file terpisah: `AUDIT_BUG_LOG.md`.

## F. Security Findings
Lihat file terpisah: `AUDIT_SECURITY_FINDINGS.md`.

## G. Performance & Optimization Findings
Lihat file terpisah: `AUDIT_OPTIMIZATION_NOTES.md`.

## H. Final Recommendation (Prioritas)
1. **Critical security/data integrity**: perbaiki session cookie integrity (signed token) dan cegah privilege escalation.
2. **Authorization/role bypass**: enforce ownership check pada create draft & transition; ubah unauthorized response jadi 403.
3. **Workflow/status bug**: selaraskan status code API (`500` -> `403/401` sesuai kasus).
4. **Public data exposure**: harden katalog publik agar hanya `Published` di level service/backend.
5. **Validation**: validasi ketat `resourceUrl`, payload XSS/script pada field teks sensitif.
6. **UX/data consistency**: perbaiki fallback login CKAN->local agar internal tetap usable saat CKAN down.
7. **Optimization**: kurangi blocking fetch homepage dan endpoint infografis auto/live.
