# Satu Data Bulungan

Repository implementasi bertahap Portal Satu Data Bulungan. Folder `references/` tetap menjadi acuan utama dan tidak diubah, sedangkan aplikasi aktif berjalan di `web/`.

## Struktur

- `references/` dokumen acuan dan mockup
- `docs/` audit, keputusan, blueprint, plan, changelog iterasi
- `web/` aplikasi Next.js untuk portal publik dan internal
- `services/ckan/` stack CKAN lokal opsional
- `.local/` persistence lokal untuk mock/shared data saat development

## Menjalankan Lokal

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Portal tersedia di `http://localhost:3000`.

## Halaman Utama

Publik:

- `/`
- `/dataset`
- `/dataset/[slug]`
- `/topik`
- `/organisasi`
- `/metadata`
- `/api`

Internal:

- `/internal` (login internal + role landing)
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

## Akun Seed Internal

Session internal sekarang menggunakan cookie server-side, bukan lagi Basic Auth.

- `admin / bulungan123`
- `walidata / walidata123`
- `operator.disdukcapil / operator123`
- `operator.dinkes / operator123`
- `operator.pendidikan / operator123`

Role final yang dipakai:

- `Admin`
- `Walidata`
- `Operator OPD`

## Shared Data Layer

Sumber data lokal bersama untuk publik dan internal ada di:

- `.local/internal-portal-store.json`

Store ini menjadi source of truth tunggal saat backend final belum dipakai. Isinya mencakup:

- dataset + metadata + resources
- organisasi/OPD
- user dan role
- workflow history
- notifications
- audit logs
- portal settings

Perubahan dari panel internal disimpan ke store yang sama, lalu halaman publik membaca ulang data dari store tersebut pada request berikutnya. Pendekatan ini sengaja dipilih agar sinkronisasi near-real-time tetap stabil di lokal tanpa realtime kompleks.

Uji CKAN connection:

```bash
node scripts/test-ckan-connection.mjs http://localhost:5000
```

Seed data sample CKAN (opsional):

```bash
# script otomatis ambil token dari env/cache atau buat token baru
node scripts/ensure-ckan-token.mjs --format powershell

# bootstrap organisasi + dataset contoh
node scripts/seed-ckan-sample.mjs http://localhost:5000
```

Smoke test dual-mode (mock vs ckan):

```bash
node scripts/smoke-dual-mode.mjs
```

Smoke test API workflow (auth + transisi + verifikasi CKAN):

```bash
node scripts/smoke-workflow-api.mjs
```

Quality gate frontend:

```bash
cd web
npm run lint
npm run build
npm run test:visual
npm run test:a11y
```

Visual regression + aksesibilitas dasar halaman publik prioritas:

```bash
cd web
npm run test:visual
npm run test:a11y
```

Update baseline snapshot visual (hanya saat perubahan UI sengaja diterima):

```bash
cd web
npm run test:visual:update
```

Sinkronisasi direktori OPD dari Excel ke JSON frontend:

```powershell
.\scripts\sync-opd-excel.ps1
```

Opsional jika file/sheet berbeda:

```powershell
.\scripts\sync-opd-excel.ps1 -InputPath "C:\path\opd.xlsx" -SheetName "Data Lengkap"
```

CI quality gate otomatis:

- `.github/workflows/quality-gate.yml` menjalankan lint + CKAN stack + seed + smoke workflow API + smoke dual-mode.

Deployment satu server non-Docker (Next.js + CKAN native install):

- `docs/06_deployment_single_server_non_docker.md`

Runbook install CKAN dari nol (pilihan Docker vs Non-Docker):

- `docs/07_ckan_install_runbook_zero_to_live.md`
