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
cp deploy/env/cloudflared.env.example deploy/env/cloudflared.env

# sesuaikan WEB_IMAGE dan TUNNEL_TOKEN
docker compose --env-file deploy/env/cloudflared.env -f deploy/docker/docker-compose.portal.yml up -d
```
