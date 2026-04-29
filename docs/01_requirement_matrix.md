# 01 Requirement Matrix

## Matrix Requirement Fase 1

| ID | Kategori | Sumber Dokumen | Requirement | Status Fase 1 | Implementasi |
| --- | --- | --- | --- | --- | --- |
| BIZ-01 | Bisnis | PRD §4 | Portal sebagai gerbang tunggal data sektoral Bulungan | Done | Frontend publik satu aplikasi (`web`) |
| BIZ-02 | Bisnis | PRD §7 P1 | Homepage publik dengan pencarian utama dan ringkasan statistik | Done | `/` dengan hero + search + KPI |
| BIZ-03 | Bisnis | PRD §7 P2 | Katalog dataset dengan filter/sort/pencarian | Done | `/dataset` |
| BIZ-04 | Bisnis | PRD §7 P3 | Halaman detail dataset dengan metadata dan resource | Done | `/dataset/[slug]` |
| BIZ-06 | Bisnis | PRD §6 | Halaman publik topik dan organisasi | Done | `/topik`, `/organisasi` |
| BIZ-05 | Bisnis | PRD §9 | Hindari portal sekadar repositori file | Partial | Resource + metadata + preview visual (vertical slice) |
| FUN-01 | Fungsional | SRS FR-001 | Beranda: search, statistik, topik populer, dataset terbaru | Done | Homepage section hero/stats/topik/dataset |
| FUN-02 | Fungsional | SRS FR-002, FSD M02 | Katalog: filter topik, OPD, format, frekuensi, sort | Done | Filter panel + quick chips + query search params |
| FUN-02A | Fungsional | FSD M02 | Katalog: pagination | Done | `page` + `pageSize` URL-based pagination |
| FUN-03 | Fungsional | SRS FR-003, FSD M03 | Detail: metadata, resource, preview, informasi update | Done | MetadataSection + ResourceList + PreviewPanel |
| FUN-04A | Fungsional | PRD §6, SRS §7 | Halaman publik metadata dan API | Done | `/metadata`, `/api` |
| FUN-04 | Fungsional | FSD §6 | Dataset publik minimal punya metadata + resource/API | Done | Struktur `Dataset` + mock seed wajib resource |
| FUN-05 | Fungsional | FSD §5 | Dukungan status dataset | Partial | Status domain model disiapkan; workflow UI internal belum |
| FUN-06 | Fungsional | SRS FR-008/FR-009 | Workflow review/publish dan riwayat | Not in scope | Ditunda fase berikutnya |
| TECH-01 | Teknis | 07_Lainnya §2 | Frontend Next.js | Done | Next.js App Router (`web/src/app`) |
| TECH-02 | Teknis | 07_Lainnya §2 | Backend CKAN sebagai target | Partial | `ckan-dataset-adapter.ts` + env switch |
| TECH-03 | Teknis | 07_Lainnya §2 | PostgreSQL, Solr, Redis, DataStore disiapkan | Partial | Draft `services/ckan/docker-compose.yml` |
| TECH-04 | Teknis | Prompt proyek | Harus runnable lokal meski CKAN belum aktif | Done | Default `DATA_SOURCE_MODE=mock` + fallback ke mock |
| TECH-06 | Teknis | Prompt proyek | Uji koneksi CKAN lokal nyata | Partial | Script uji tersedia, eksekusi terblokir Docker daemon lokal |
| TECH-05 | Teknis | Prompt proyek | Env-based config endpoint backend | Done | `.env.example`, `src/lib/config.ts` |
| UI-01 | Visual | Style Guide §2 | Token warna Bulungan | Done | CSS vars (`globals.css`) |
| UI-02 | Visual | Style Guide §4 | Aset budaya dipakai terukur, tidak berlebihan | Done | Motif strip/watermark + ilustrasi terbatas |
| UI-03 | Visual | Style Guide §7 | Komponen dasar (button/chip/card/search/footer) | Done | Komponen reusable di `src/components/portal` |
| UI-04 | Visual | Mockup desktop/mobile | Responsif desktop + mobile | Done | Media queries + layout adaptif |
| QA-01 | Quality gate | Prompt proyek | Tidak ada import rusak | Done | Lint pass |
| QA-02 | Quality gate | Prompt proyek | Build tidak error | Done | `npm run build` pass |
| QA-03 | Quality gate | Prompt proyek | Route utama berjalan | Done | Verifikasi `GET /` dan `GET /dataset` status 200 |

## Requirement Ditunda (Outside Fase 1)

1. Panel internal lengkap (CRUD, workflow review lintas peran).
2. Monitoring kualitas dataset otomatis.
3. Form layanan publik (permohonan data/laporan masalah) yang tersambung backend.
4. Integrasi DataStore/preview tabular real dari CKAN.
5. Integrasi notifikasi email, audit trail lengkap, SSO.
