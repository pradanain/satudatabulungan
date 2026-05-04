# Deployment Satu Server (Non-Docker): Next.js + CKAN

Dokumen ini untuk skenario:

- Satu server (VM/bare metal) tanpa Docker.
- Frontend portal dari `web/` (Next.js).
- Backend data memakai CKAN native install.

Arsitektur yang dipakai:

- `portal.domainanda.go.id` -> Next.js (`127.0.0.1:3000`)
- `data.domainanda.go.id` -> CKAN (`127.0.0.1:8080`, via Nginx CKAN package)
- Satu Nginx publik di server yang sama (TLS/HTTPS)

## 1. Prasyarat

- OS direkomendasikan: Ubuntu 22.04/24.04 64-bit.
- DNS A record:
  - `portal.domainanda.go.id` -> IP server
  - `data.domainanda.go.id` -> IP server
- User sudo di server.

## 2. Install Dependensi Dasar Server

```bash
sudo apt update
sudo apt install -y curl git nginx
```

Install Node.js LTS (contoh Node 20):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Install CKAN Native (Tanpa Docker)

Referensi resmi CKAN:

- https://docs.ckan.org/en/2.11/maintaining/installing/install-from-package.html
- https://docs.ckan.org/en/2.11/maintaining/datastore.html

### 3.1 Install paket CKAN

```bash
sudo apt update
sudo apt install -y libpq5 redis-server nginx supervisor postgresql
wget https://packaging.ckan.org/python-ckan_2.11-jammy_amd64.deb
sudo dpkg -i python-ckan_2.11-jammy_amd64.deb
```

### 3.2 Install Solr (manual, non-Docker)

```bash
sudo apt install -y openjdk-11-jdk
wget https://downloads.apache.org/solr/solr/9.7.0/solr-9.7.0.tgz
tar xzf solr-9.7.0.tgz solr-9.7.0/bin/install_solr_service.sh --strip-components=2
sudo bash ./install_solr_service.sh solr-9.7.0.tgz
sudo -u solr /opt/solr/bin/solr create -c ckan
sudo -u solr wget -O /var/solr/data/ckan/conf/managed-schema https://raw.githubusercontent.com/ckan/ckan/ckan-2.11.5/ckan/config/solr/schema.xml
sudo systemctl restart solr
```

Catatan:

- Pastikan versi schema mengikuti versi CKAN yang dipakai (contoh di atas `ckan-2.11.5`).
- Jangan expose Solr ke publik.

### 3.3 Buat database CKAN

```bash
sudo -u postgres createuser -S -D -R -P ckan_default
sudo -u postgres createdb -O ckan_default ckan_default -E utf-8
```

### 3.4 Buat database DataStore

```bash
sudo -u postgres createuser -S -D -R -P datastore_default
sudo -u postgres createdb -O ckan_default datastore_default -E utf-8
```

### 3.5 Konfigurasi `ckan.ini`

Edit file:

```bash
sudo nano /etc/ckan/default/ckan.ini
```

Minimal pastikan:

```ini
ckan.site_url = https://data.domainanda.go.id
sqlalchemy.url = postgresql://ckan_default:<PASSWORD_CKAN_DB>@localhost/ckan_default
ckan.datastore.write_url = postgresql://ckan_default:<PASSWORD_CKAN_DB>@localhost/datastore_default
ckan.datastore.read_url = postgresql://datastore_default:<PASSWORD_DATASTORE_RO>@localhost/datastore_default
ckan.storage_path = /var/lib/ckan/default
solr_url = http://127.0.0.1:8983/solr/ckan
redis.url = redis://127.0.0.1:6379/1
```

Aktifkan plugin datastore (dan plugin lain sesuai kebutuhan Anda):

```ini
ckan.plugins = datastore
```

### 3.6 Inisialisasi DB CKAN + permission DataStore

```bash
sudo ckan db init
sudo ckan datastore set-permissions | sudo -u postgres psql --set ON_ERROR_STOP=1
```

### 3.7 Start proses CKAN

```bash
sudo supervisorctl reload
sudo supervisorctl status
```

Catatan: pada package install CKAN, service uWSGI CKAN biasanya listen di `127.0.0.1:8080` dan Nginx default CKAN akan forward ke sana.

## 4. Deploy Frontend Next.js

### 4.1 Ambil source + build

```bash
sudo mkdir -p /srv/satudata
sudo chown -R $USER:$USER /srv/satudata
cd /srv/satudata
git clone <URL_REPO_ANDA> app
cd app/web
npm ci
npm run build
cd ..
sudo chown -R www-data:www-data /srv/satudata/app
```

### 4.2 Siapkan env production

Copy contoh env:

```bash
sudo mkdir -p /etc/satudata
sudo cp /srv/satudata/app/deploy/env/web.production.env.example /etc/satudata/web.env
sudo nano /etc/satudata/web.env
```

Isi minimal:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
DATA_SOURCE_MODE=ckan
CKAN_BASE_URL=https://data.domainanda.go.id
```

## 5. Jalankan Next.js via systemd

Copy service:

```bash
sudo cp /srv/satudata/app/deploy/systemd/satudata-web.service /etc/systemd/system/satudata-web.service
sudo systemctl daemon-reload
sudo systemctl enable satudata-web
sudo systemctl restart satudata-web
sudo systemctl status satudata-web
```

## 6. Konfigurasi Nginx (2 subdomain)

Copy template:

```bash
sudo cp /srv/satudata/app/deploy/nginx/satudata-single-server.conf /etc/nginx/sites-available/satudata-single-server.conf
sudo nano /etc/nginx/sites-available/satudata-single-server.conf
```

Edit domain:

- `portal.domainanda.go.id`
- `data.domainanda.go.id`

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/satudata-single-server.conf /etc/nginx/sites-enabled/satudata-single-server.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/ckan
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Pasang SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portal.domainanda.go.id -d data.domainanda.go.id
```

Setelah SSL aktif, pastikan:

- `CKAN_BASE_URL` pada `/etc/satudata/web.env` menggunakan `https://data.domainanda.go.id`
- `ckan.site_url` pada `/etc/ckan/default/ckan.ini` menggunakan `https://data.domainanda.go.id`

Lalu restart:

```bash
sudo systemctl restart satudata-web
sudo supervisorctl reload
sudo systemctl reload nginx
```

## 8. Smoke Test

```bash
curl -I https://portal.domainanda.go.id
curl -I https://data.domainanda.go.id
curl https://data.domainanda.go.id/api/3/action/status_show
```

Dari repo:

```bash
cd /srv/satudata/app
node scripts/test-ckan-connection.mjs https://data.domainanda.go.id
node scripts/smoke-dual-mode.mjs
```

## 9. Operasional Harian

- Restart frontend:
  - `sudo systemctl restart satudata-web`
- Lihat log frontend:
  - `sudo journalctl -u satudata-web -f`
- Cek proses CKAN:
  - `sudo supervisorctl status`
- Reload Nginx:
  - `sudo systemctl reload nginx`

## 10. Catatan Penting

- Satu server tetap direkomendasikan pakai 2 subdomain (portal + data) agar URL CKAN tetap bersih dan stabil.
- Jika ingin satu domain dengan path (mis. `/ckan`), bisa, tapi konfigurasi lebih kompleks dan berisiko masalah redirect/static path di CKAN.
- Jangan expose Solr atau PostgreSQL ke publik.
