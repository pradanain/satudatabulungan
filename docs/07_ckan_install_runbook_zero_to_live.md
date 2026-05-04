# Runbook Install CKAN dari Nol (Server Kosong)

Dokumen ini menjawab skenario: server baru, belum ada apa-apa, dan ingin menyiapkan CKAN untuk Portal Satu Data Bulungan.

Tanggal dokumen: 1 Mei 2026.

## Ringkasan Pilihan

1. Jalur A - Docker Compose
- Paling cepat untuk dev/staging.
- Mudah bootstrap CKAN + PostgreSQL + Solr + Redis sekaligus.
- Cocok jika tim ingin delivery cepat dan deployment reproducible.

2. Jalur B - Native/Package Install (Non-Docker)
- Cocok untuk production single-instance yang konservatif.
- Lebih dekat ke pola operasi Linux tradisional (systemd, package manager, backup OS-native).
- Butuh langkah setup lebih panjang.

## Rekomendasi Praktis

1. Dev lokal: Jalur A (Docker).
2. Staging: Jalur A (Docker) atau Jalur B (native), tergantung gaya tim ops.
3. Production awal (1 instance): Jalur B (native Ubuntu 22.04) biasanya paling aman jika tim belum mature di container ops.
4. Production containerized: Jalur A bisa dipakai, tapi wajib hardening tambahan (monitoring, backup volume, patch cadence image, secret management, recovery plan).

---

## Jalur A - Docker Compose (Cepat)

Asumsi OS: Ubuntu 22.04 LTS.

### 1) Install Docker Engine + Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo docker run --rm hello-world
```

### 2) Deploy stack CKAN

```bash
sudo mkdir -p /srv/satudata
sudo chown -R $USER:$USER /srv/satudata
cd /srv/satudata
git clone <URL_REPO_ANDA> app
cd app/services/ckan
docker compose up -d
```

### 3) Verifikasi CKAN

```bash
docker compose ps
curl http://localhost:5000/api/3/action/status_show
```

### 4) Seed data dummy portal

Dari root repo:

```bash
cd /srv/satudata/app
node scripts/ensure-ckan-token.mjs --format bash
node scripts/seed-ckan-sample.mjs http://localhost:5000
```

### 5) Integrasi frontend Next.js

`web/.env.local` (atau env production):

```env
DATA_SOURCE_MODE=ckan
NEXT_PUBLIC_CKAN_BASE_URL=http://localhost:5000
CKAN_BASE_URL=http://localhost:5000
CKAN_API_KEY=<token-admin-ckan>
NEXT_PUBLIC_APP_NAME="Portal Satu Data Kabupaten Bulungan"
NEXT_PUBLIC_APP_REGION="Kabupaten Bulungan"
```

### 6) Jalankan frontend

```bash
cd /srv/satudata/app/web
npm ci
npm run build
npm run start
```

---

## Jalur B - Native/Package Install (Non-Docker)

Asumsi OS: Ubuntu 22.04 LTS.

Catatan: detail production non-docker sudah ada di `docs/06_deployment_single_server_non_docker.md`. Bagian ini fokus runbook cepat dari nol.

### 1) Install dependensi dasar

```bash
sudo apt update
sudo apt install -y curl git nginx postgresql redis-server supervisor libpq5
```

### 2) Install CKAN package

```bash
cd /tmp
wget https://packaging.ckan.org/python-ckan_2.11-jammy_amd64.deb
sudo dpkg -i python-ckan_2.11-jammy_amd64.deb
```

### 3) Install Solr 9 + core CKAN

```bash
sudo apt install -y openjdk-11-jdk
cd /tmp
wget https://downloads.apache.org/solr/solr/9.7.0/solr-9.7.0.tgz
tar xzf solr-9.7.0.tgz solr-9.7.0/bin/install_solr_service.sh --strip-components=2
sudo bash ./install_solr_service.sh solr-9.7.0.tgz
sudo -u solr /opt/solr/bin/solr create -c ckan
sudo -u solr wget -O /var/solr/data/ckan/conf/managed-schema https://raw.githubusercontent.com/ckan/ckan/ckan-2.11.5/ckan/config/solr/schema.xml
sudo systemctl restart solr
```

### 4) Buat database CKAN + DataStore

```bash
sudo -u postgres createuser -S -D -R -P ckan_default
sudo -u postgres createdb -O ckan_default ckan_default -E utf-8

sudo -u postgres createuser -S -D -R -P datastore_default
sudo -u postgres createdb -O ckan_default datastore_default -E utf-8
```

### 5) Konfigurasi CKAN

Edit file:

```bash
sudo nano /etc/ckan/default/ckan.ini
```

Minimal isi:

```ini
ckan.site_url = https://data.domainanda.go.id
sqlalchemy.url = postgresql://ckan_default:<PASSWORD_CKAN_DB>@localhost/ckan_default
ckan.datastore.write_url = postgresql://ckan_default:<PASSWORD_CKAN_DB>@localhost/datastore_default
ckan.datastore.read_url = postgresql://datastore_default:<PASSWORD_DATASTORE_RO>@localhost/datastore_default
ckan.storage_path = /var/lib/ckan/default
solr_url = http://127.0.0.1:8983/solr/ckan
redis.url = redis://127.0.0.1:6379/1
ckan.plugins = datastore
```

### 6) Inisialisasi CKAN

```bash
sudo ckan db init
sudo ckan datastore set-permissions | sudo -u postgres psql --set ON_ERROR_STOP=1
sudo supervisorctl reload
sudo supervisorctl status
```

### 7) Verifikasi endpoint CKAN

```bash
curl http://127.0.0.1:5000/api/3/action/status_show || curl http://127.0.0.1:8080/api/3/action/status_show
```

Jika aktif di `:8080`, reverse proxy Nginx ke `data.domainanda.go.id`.

### 8) Seed data dummy portal

```bash
cd /srv/satudata/app
node scripts/ensure-ckan-token.mjs --format bash
node scripts/seed-ckan-sample.mjs https://data.domainanda.go.id
```

---

## Checklist Selesai Instalasi

1. CKAN `status_show` merespons `success: true`.
2. Seed sukses tanpa error `fetch failed`.
3. Frontend build sukses dengan mode `DATA_SOURCE_MODE=ckan`.
4. Halaman berikut mengambil data backend:
- organisasi
- dataset
- detail dataset
- infografis
- buku/publikasi
- dashboard admin/walidata/operator
- upload dataset/infografis/buku

## Troubleshooting Singkat

1. Error `fetch failed` saat seed:
- URL CKAN tidak hidup / port salah / service down.
- Cek dengan `curl <base_url>/api/3/action/status_show`.

2. Error `dockerDesktopLinuxEngine` (Windows):
- Docker Desktop belum running.

3. Login internal gagal:
- Pastikan package akun-role (`portal-akun-role-kabupaten-bulungan`) sudah terseed.

4. Upload gagal `CKAN_API_KEY wajib diisi`:
- Isi `CKAN_API_KEY` di env server Next.js.

## Referensi

- CKAN install overview: https://docs.ckan.org/en/2.10/maintaining/installing/index.html
- CKAN source install: https://docs.ckan.org/en/2.11/maintaining/installing/install-from-source.html
- CKAN Docker Compose: https://docs.ckan.org/en/latest/maintaining/installing/install-from-docker-compose.html
- ckan-docker repo: https://github.com/ckan/ckan-docker
