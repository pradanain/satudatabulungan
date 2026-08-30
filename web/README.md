# Portal Satu Data Bulungan

Aplikasi Next.js untuk portal publik dan panel internal Portal Satu Data Bulungan.

Mode data yang tersedia:

- `mock` (default, langsung runnable lokal)
- `ckan` (adapter sudah disiapkan untuk transisi ke backend CKAN)

## 1) Persiapan

```bash
cd web
cp .env.example .env.local
npm install
```

## 2) Menjalankan Lokal

```bash
npm run dev
```

Portal dapat diakses di:

- `http://localhost:3000/` (homepage)
- `http://localhost:3000/dataset` (katalog dataset)
- `http://localhost:3000/dataset/jumlah-penduduk-per-kecamatan-2025` (detail dataset contoh)
- `http://localhost:3000/topik`
- `http://localhost:3000/organisasi`
- `http://localhost:3000/metadata`
- `http://localhost:3000/api`
- `http://localhost:3000/publikasi/infografis`
- `http://localhost:3000/internal` (login internal)
- `http://localhost:3000/internal/dashboard`
- `http://localhost:3000/internal/datasets`
- `http://localhost:3000/internal/workflow`

## 3) Quality Gate

```bash
npm run lint
npm run build
npm run test:visual
npm run test:a11y
```

## 4) Mode Integrasi CKAN

Atur `web/.env.local`:

```bash
DATA_SOURCE_MODE=ckan
CKAN_BASE_URL=http://localhost:5000
CKAN_API_KEY=<opsional-token-admin-ckan>
CKAN_INFOGRAFIS_PACKAGE_ID=<opsional-package-id-infografis>
CKAN_INFOGRAFIS_PACKAGE_NAME=<opsional-package-name-infografis>
INFOGRAFIS_CACHE_TTL_MS=21600000
INFOGRAFIS_HTML_MAX_PAGES=8
WORKFLOW_AUDIT_RETENTION_DAYS=90
WORKFLOW_AUDIT_MAX_ENTRIES=500
```

Jika CKAN belum aktif atau gagal diakses, service akan fallback ke mock data agar frontend tetap stabil.

Uji konektivitas CKAN:

```bash
cd ..
node scripts/test-ckan-connection.mjs http://localhost:5000
```

Ambil/buat token CKAN lokal otomatis:

```bash
node scripts/ensure-ckan-token.mjs --format powershell
```

Seed data sample CKAN (otomatis ambil token bila env belum ada):

```bash
node scripts/seed-ckan-sample.mjs http://localhost:5000
```

Sinkronisasi metadata infografis DKIP Bulungan ke CKAN (metadata-only, tanpa upload file gambar):

```bash
cd ..
node scripts/sync-infografis-to-ckan.mjs
```

Smoke test dual-mode (`mock` vs `ckan`):

```bash
node scripts/smoke-dual-mode.mjs
```

Smoke API workflow (auth + transisi backend):

```bash
node scripts/smoke-workflow-api.mjs
```

Visual regression baseline update (jalankan saat ada perubahan UI yang disetujui):

```bash
npm run test:visual:update
```

## 5) Panel Internal

Route internal utama:

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

API internal utama:

- `POST /api/internal/auth/login`
- `POST /api/internal/auth/logout`
- `POST /api/internal/workflow/draft`
- `POST /api/internal/workflow/transition`
- `GET /api/internal/workflow/[slug]/audit/export?format=json|csv`
- `PATCH /api/internal/datasets/[slug]`
- `POST /api/internal/profile/password`
- `POST /api/internal/settings`
- `GET /api/infografis?page=1&limit=12&source=auto|ckan|live`

Akun seed internal:

- `admin / bulungan123`
- `walidata / walidata123`
- `operator.disdukcapil / operator123`
- `operator.dinkes / operator123`
- `operator.pendidikan / operator123`

Role yang aktif hanya:

- `admin`
- `walidata`
- `operator_opd`

Store lokal bersama:

- `.local/internal-portal-store.json`

Store ini dipakai bersama oleh halaman publik dan internal. Ketika status dataset berubah di panel internal, halaman publik membaca status terbaru dari store yang sama pada request berikutnya sehingga publish/update terlihat hampir langsung tanpa dependency backend final.

Audit dan persistence lokal:

- audit trail mencatat `who/when/from/to`
- filter audit: `actor`, `status`, `dateFrom`, `dateTo`
- retention/rotation audit:
  - retain event <= `WORKFLOW_AUDIT_RETENTION_DAYS`
  - rotate ke `.local/workflow-audit-archive-YYYY-MM.jsonl` saat melebihi `WORKFLOW_AUDIT_MAX_ENTRIES`

Contoh payload:

```json
{
  "slug": "produksi-pangan-dan-hortikultura",
  "fromStatus": "Submitted",
  "toStatus": "Approved"
}
```

Contoh payload draft:

```json
{
  "title": "Draft Ketersediaan Air Bersih 2026",
  "slug": "draft-ketersediaan-air-bersih-2026",
  "summary": "Draft awal indikator ketersediaan air bersih.",
  "organization": "Dinas PUPR Bulungan",
  "topic": "Infrastruktur",
  "frequency": "Tahunan",
  "period": "2026",
  "walidata": "Diskominfo Bulungan",
  "resourceName": "air-bersih-2026.csv",
  "resourceFormat": "CSV",
  "resourceUrl": "https://example.com/air-bersih-2026.csv"
}
```

## 6) Shared Data dan Sinkronisasi

- adapter publik mock sekarang membaca dari `internal-store`
- service workflow internal menulis ke store yang sama
- halaman publik utama dibuat dynamic agar pembaruan publish dari internal cepat terlihat saat dev lokal
- seed awal juga mengimpor data legacy dari file mock workflow lama agar transisi iterasi tetap mulus

## 7) Fitur Katalog

- Paginasi URL-based (`page`, `pageSize`)
- Filter kaya: `topic`, `organization`, `format`, `frequency`, `status`, `year`, `tag`, `sort`
- Chip filter aktif dengan aksi remove per-filter

## 8) Struktur Penting

- `src/app/` halaman publik (`/`, `/dataset`, `/dataset/[slug]`)
- `src/app/internal/` halaman internal role-based
- `src/app/api/internal/` API internal
- `src/components/portal/` komponen reusable publik
- `src/components/internal/` komponen reusable internal
- `src/lib/adapters/` adapter sumber data (`mock` + `ckan`)
- `src/lib/services/dataset-service.ts` selector adapter + fallback
- `src/lib/services/infografis-service.ts` aggregator infografis (CKAN -> WordPress REST -> HTML scrape)
- `src/lib/services/internal-store.ts` shared store internal-publik
- `src/lib/services/workflow-persistence.ts` persist transisi workflow ke CKAN/mock-api/shared store
- `src/lib/utils/internal-auth*.ts` auth session + guard internal
- `public/assets/brand/` aset identitas visual Bulungan
- `public/assets/partners/` logo pendukung/mitra yang tampil di footer

## 9) Integrasi Infografis

- Sumber utama halaman `/publikasi/infografis` berasal dari endpoint internal `GET /api/infografis`.
- Urutan fallback sumber:
  - `CKAN` (jika tersedia package/resource/datastore infografis)
  - `WordPress REST API` (`/wp/wp-json/wp/v2/...`)
  - `HTML parsing` server-side dari `https://diskominfo.bulungan.go.id/wp/infografis/` dan halaman paginasi.
- Cache server-side default 6 jam (`INFOGRAFIS_CACHE_TTL_MS`) dengan stale fallback saat fetch terbaru gagal.
- Request ke sumber eksternal memakai timeout + retry exponential backoff agar endpoint portal tetap stabil.
- Jalur `admin-ajax.php` / nonce plugin tidak dipakai sebagai sumber utama karena lebih rapuh dan mudah berubah.

## 10) CKAN Full Integration (May 2026)

Per Mei 2026, data utama frontend sudah dapat diambil dari backend CKAN untuk:

- organisasi
- dataset + detail dataset
- infografis (`content_type=infografis`)
- buku/publikasi (`content_type=publikasi`)
- akun + role internal (`content_type=accounts`, package `portal-akun-role-kabupaten-bulungan`)
- dashboard internal role-based
- upload dataset/infografis/buku

### Environment wajib

```bash
DATA_SOURCE_MODE=ckan
NEXT_PUBLIC_CKAN_BASE_URL=http://localhost:5000
CKAN_API_KEY=<token-api-sysadmin-ckan>
NEXT_PUBLIC_APP_NAME="Portal Satu Data Kabupaten Bulungan"
NEXT_PUBLIC_APP_REGION="Kabupaten Bulungan"
```

### Menjalankan seed dummy data CKAN lengkap

Dari root project:

```bash
node scripts/ensure-ckan-token.mjs --format powershell
node scripts/seed-ckan-sample.mjs http://localhost:5000
```

Seed ini akan membuat:

- organisasi OPD Bulungan
- dataset sektoral realistis
- dataset berbasis kecamatan dengan 10 kecamatan Bulungan lengkap:
  - Tanjung Selor
  - Tanjung Palas
  - Tanjung Palas Barat
  - Tanjung Palas Utara
  - Tanjung Palas Timur
  - Tanjung Palas Tengah
  - Sekatak
  - Peso
  - Peso Hilir
  - Bunyu
- infografis (DKIP) sebagai dataset `content_type=infografis`
- buku/publikasi (Bappeda) sebagai dataset `content_type=publikasi`
- akun + role internal (Admin, Walidata, Operator Organisasi)

### Upload konten dari frontend

- Halaman internal upload: `/internal/uploads`
- API upload:
  - `POST /api/internal/uploads/dataset`
  - `POST /api/internal/uploads/infografis`
  - `POST /api/internal/uploads/publikasi`

Validasi role:

- `Admin`: akses penuh
- `Walidata`: validasi, kurasi, publikasi lintas organisasi
- `Operator Organisasi`: upload hanya untuk organisasinya sendiri

### Catatan desain teknis

CKAN standar tidak memiliki entitas native terpisah untuk infografis dan buku.
Implementasi memakai pendekatan sederhana dan stabil:

- `dataset` biasa + `extras.content_type`
- nilai `content_type`:
  - `dataset`
  - `infografis`
  - `publikasi`
  - `accounts`

