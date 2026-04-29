# CKAN Local Stack (Opsional)

Folder ini menyiapkan draft `docker-compose.yml` untuk stack CKAN fase awal:

- CKAN
- PostgreSQL (core)
- PostgreSQL (DataStore)
- Solr
- Redis

## Menjalankan

```bash
cd services/ckan
docker compose up -d
```

CKAN akan tersedia di `http://localhost:5000` bila seluruh service sudah sehat.
Compose ini sudah menambahkan inisialisasi otomatis role `datastore_ro` melalui service `datastore-init` agar plugin DataStore bisa boot tanpa error.

Cek status:

```bash
docker compose ps
```

Uji koneksi dari root project:

```bash
node scripts/test-ckan-connection.mjs http://localhost:5000
```

Jika ingin langsung ada data contoh di CKAN:

```bash
node scripts/ensure-ckan-token.mjs --format powershell
node scripts/seed-ckan-sample.mjs http://localhost:5000
```

Prasyarat:

- Docker Desktop/daemon aktif.
- User shell memiliki akses ke Docker daemon.

## Catatan

- Frontend fase 1 tetap runnable tanpa stack ini karena mode default data adalah `mock`.
- Saat CKAN sudah aktif, ubah `web/.env.local`:

```bash
DATA_SOURCE_MODE=ckan
CKAN_BASE_URL=http://localhost:5000
```
