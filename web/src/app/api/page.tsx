import type { Metadata } from "next";
import Link from "next/link";
import { Braces, ExternalLink, Info, Lock, SearchCode, ServerCog } from "lucide-react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRuntimeConfig } from "@/lib/config";
import { getDatasets } from "@/lib/services/dataset-service";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Dokumentasi API Publik",
  description:
    "Dokumentasi endpoint API publik yang aktif digunakan aplikasi Satu Data Bulungan, termasuk endpoint infografis dan integrasi CKAN.",
  path: "/api",
  keywords: ["API Bulungan", "CKAN API", "package_search", "package_show", "infografis API"],
});

export const dynamic = "force-dynamic";

const references = [
  { label: "CKAN API Guide", href: "https://docs.ckan.org/en/2.11/api/" },
  { label: "CKAN DataStore", href: "https://docs.ckan.org/en/2.11/maintaining/datastore.html" },
  { label: "OWASP API Security Top 10", href: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/" },
  { label: "Data.gov User Guide", href: "https://data.gov/user-guide/" },
] as const;

export default async function ApiPage() {
  const config = getRuntimeConfig();
  const datasets = await getDatasets({ sort: "terbaru" });
  const sample = datasets[0];
  const sampleSlug = sample?.slug ?? "<slug-dataset>";

  const ckanBaseUrl = config.ckanBaseUrl.replace(/\/+$/, "");
  const packageSearchUrl = `${ckanBaseUrl}/api/3/action/package_search?rows=10&start=0`;
  const packageShowUrl = `${ckanBaseUrl}/api/3/action/package_show?id=${encodeURIComponent(sampleSlug)}`;
  const datastoreSearchUrl = `${ckanBaseUrl}/api/3/action/datastore_search?resource_id=<resource-id>&limit=100`;

  return (
    <PortalPageShell activeMenu="layanan-data">
      <section>
        <Card className="relative overflow-hidden rounded-[28px] border-(--color-border) bg-white p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative z-10 overflow-hidden bg-[linear-gradient(100deg,#fffefb_0%,#f8f3e6_50%,#edf3fc_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.78)_1px,transparent_0)] [background-size:3px_3px]"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <Badge
                  variant="outline"
                  className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary) shadow-none"
                >
                  Dokumentasi API Publik
                </Badge>
                <SectionHeading
                  title="API Portal Satu Data"
                  description="Dokumentasi ini hanya memuat endpoint publik yang nyata dipakai aplikasi: endpoint internal publik `/api/infografis` dan endpoint CKAN yang terintegrasi di codepath dataset."
                  className="mt-3"
                  titleClassName="text-4xl leading-[0.98] sm:text-5xl lg:text-6xl"
                  descriptionClassName="mt-1 max-w-2xl text-base sm:text-[1.05rem] text-[#5f5957]"
                />
              </div>
            </div>

            <aside className="relative border-t border-(--color-border) bg-[#f6f8fc] px-6 py-6 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-8">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight text-(--color-text)">
                Status Integrasi
              </h2>
              <div className="mt-4 grid gap-2.5">
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">DATA SOURCE MODE</p>
                  <p className="mb-0 mt-1 text-sm font-semibold text-(--color-text)">{config.dataSourceMode.toUpperCase()}</p>
                </article>
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">CKAN BASE URL</p>
                  <p className="mb-0 mt-1 break-all text-sm text-(--color-muted)">{ckanBaseUrl}</p>
                </article>
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">CATATAN</p>
                  <p className="mb-0 mt-1 text-sm text-(--color-muted)">
                    Endpoint `/api/internal/*` adalah area internal dan tidak termasuk API publik.
                  </p>
                </article>
              </div>
            </aside>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <Braces className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Endpoint Publik</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">`/api/infografis` dan endpoint Action API CKAN.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <SearchCode className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Contoh Nyata</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">Contoh URL dibuat dari konfigurasi runtime aplikasi saat ini.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <Lock className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Secure by Design</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">Hanya API publik dibagikan, endpoint internal tidak diekspos.</p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Endpoint Publik Aplikasi"
            description="Endpoint yang di-host langsung oleh aplikasi Next.js ini."
            titleClassName="text-2xl sm:text-3xl"
          />

          <div className="mt-4 grid gap-3">
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>GET</Badge>
                <h3 className="m-0 text-base font-semibold">/api/infografis</h3>
              </div>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Mengambil daftar infografis dengan pagination dan fallback sumber data (`ckan` / `live`) melalui mode `auto`.
              </p>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Query: <code>page</code>, <code>limit</code>, <code>source</code> (auto | ckan | live)
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                <code>{`curl "/api/infografis?page=1&limit=12&source=auto"`}</code>
              </pre>
            </article>

            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>POST</Badge>
                <h3 className="m-0 text-base font-semibold">/api/data-requests</h3>
              </div>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Menerima formulir permintaan data publik dan mengarahkan tiket ke walidata tujuan.
              </p>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Keamanan endpoint: validasi input, origin check, honeypot field, dan rate limit berbasis request fingerprint.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                <code>{`curl -X POST "/api/data-requests" \\\n+  -H "Content-Type: application/json" \\\n+  -d '{"requesterName":"Nama","requesterEmail":"email@contoh.id","requesterInstitution":"Instansi","requesterPhone":"08123456789","targetWalidataId":"walidata-kabupaten-bulungan","requestPurpose":"Riset akademik","requestedDataDescription":"Butuh data indikator A per kecamatan 2022-2025","usagePurpose":"Analisis tren dan perencanaan","periodStart":"2022-01-01","periodEnd":"2025-12-31","preferredFormat":"CSV"}'`}</code>
              </pre>
            </article>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Endpoint CKAN yang Dipakai Proyek"
            description="Endpoint berikut bukan route Next.js lokal, tetapi dipakai langsung oleh adapter dan service saat mode CKAN aktif."
            titleClassName="text-2xl sm:text-3xl"
          />

          <div className="mt-4 grid gap-3">
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">GET package_search</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {packageSearchUrl}
              </code>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Digunakan untuk mengambil daftar dataset. Parameter umum: <code>rows</code>, <code>start</code>, <code>q</code>.
              </p>
            </article>

            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">GET package_show</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {packageShowUrl}
              </code>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Digunakan untuk mengambil metadata detail satu dataset (berdasarkan <code>id</code> atau slug).
              </p>
            </article>

            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">GET datastore_search (opsional per resource)</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {datastoreSearchUrl}
              </code>
              <p className="mb-0 mt-2 text-sm text-(--color-muted)">
                Dipakai saat resource CKAN aktif di DataStore. Parameter umum: <code>resource_id</code>, <code>limit</code>, <code>offset</code>, <code>filters</code>.
              </p>
            </article>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading title="Keamanan Integrasi" titleClassName="text-2xl sm:text-3xl" />
          <div className="mt-4 grid gap-3 text-sm text-(--color-muted) sm:text-base">
            <p className="m-0">
              1. Publikasikan hanya endpoint publik. Endpoint <code>/api/internal/*</code> bukan untuk konsumsi publik.
            </p>
            <p className="m-0">
              2. Simpan kredensial seperti <code>CKAN_API_KEY</code> di server/env, jangan di sisi browser.
            </p>
            <p className="m-0">
              3. Batasi konsumsi resource (pagination, limit) untuk menghindari beban berlebih.
            </p>
            <p className="m-0">
              4. Validasi payload JSON dan cek field bisnis <code>success</code> pada respons CKAN.
            </p>
            <p className="m-0">
              5. Terapkan observabilitas request (status, latency, error rate) sebelum membuka integrasi ke publik luas.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title="Referensi Teknis"
              description="Rujukan eksternal yang dipakai untuk penyusunan dokumentasi API dan praktik keamanan."
              titleClassName="text-2xl sm:text-3xl"
              descriptionClassName="text-sm sm:text-base"
            />
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/layanan-data/faq">
                Buka FAQ Lengkap
                <Info className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {references.map((reference) => (
              <article key={reference.href} className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
                <a
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:text-[#8f1717]"
                >
                  {reference.label}
                  <ExternalLink className="size-4" />
                </a>
              </article>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold sm:text-3xl">Butuh Pengajuan Data Baru?</h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Jika data belum tersedia di API publik, kirim kebutuhan Anda melalui layanan permintaan data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-full">
                <Link href="/layanan-data/permintaan-data">
                  Ajukan Permintaan Data
                  <ServerCog className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link href="/dataset">Jelajahi Dataset</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
