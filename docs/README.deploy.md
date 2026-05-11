# Deploy Branch (Minimal)

Branch `deploy` disiapkan otomatis agar isi repo lebih bersih untuk server runtime:

- `web/` (source aplikasi)
- `services/` (service pendukung)
- `deploy/` (compose, env contoh, konfigurasi deploy)
- workflow deploy yang relevan

File audit, docs, prompt, dan artefak non-runtime tidak ikut ke branch ini.

## Alur cepat

1. Push perubahan ke `main`.
2. GitHub Actions build image web ke GHCR.
3. GitHub Actions sinkronkan branch `deploy`.
4. Di server:
   - clone/pull branch `deploy`
   - isi file env runtime
   - jalankan `docker compose` tanpa build lokal

## Menjalankan di server

```bash
cp deploy/env/web.production.env.example deploy/env/web.production.env
cp deploy/env/portal.deploy.env.example deploy/env/portal.deploy.env

# sesuaikan WEB_IMAGE dan WEB_HOST_PORT
docker compose --env-file deploy/env/portal.deploy.env -f deploy/docker/docker-compose.portal.yml up -d
```

## Mapping Cloudflare Tunnel Global

Saat membuat Public Hostname untuk `portal.databenuanta.id`, arahkan service ke:

- `http://<IP-atau-host-server>:<WEB_HOST_PORT>`
