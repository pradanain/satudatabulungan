import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  Braces, 
  Code2, 
  ExternalLink, 
  FileJson, 
  Info, 
  Key, 
  Lock, 
  SearchCode, 
  ServerCog, 
  ShieldCheck, 
  Terminal,
  Zap 
} from "lucide-react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRuntimeConfig } from "@/lib/config";
import { getDatasets } from "@/lib/services/dataset-service";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { ApiCodeTabs } from "@/components/portal/api-code-tabs";

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
  { label: "OWASP API Security", href: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/" },
] as const;

export default async function ApiPage() {
  const config = getRuntimeConfig();
  const datasets = await getDatasets({ sort: "terbaru" });
  const sample = datasets[0];
  const sampleSlug = sample?.slug ?? "pendapatan-daerah-2024";

  // Logic to ensure professional URL display
  const rawCkanUrl = config.ckanBaseUrl.replace(/\/+$/, "");
  const displayCkanUrl = rawCkanUrl.includes("localhost") 
    ? "https://data.bulungan.go.id" 
    : rawCkanUrl;
  
  const displayPortalUrl = "https://satudata.bulungan.go.id";

  const packageSearchUrl = `${displayCkanUrl}/api/3/action/package_search?rows=10&start=0`;
  const packageShowUrl = `${displayCkanUrl}/api/3/action/package_show?id=${sampleSlug}`;

  // Example Code Snippets for Infografis
  const infografisExamples = [
    {
      lang: "curl",
      label: "cURL",
      code: `curl -X GET "${displayPortalUrl}/api/infografis?page=1&limit=10"`
    },
    {
      lang: "javascript",
      label: "JavaScript",
      code: `const response = await fetch('${displayPortalUrl}/api/infografis?page=1&limit=10');\nconst data = await response.json();\nconsole.log(data.infografis);`
    },
    {
      lang: "python",
      label: "Python",
      code: `import requests\n\nurl = "${displayPortalUrl}/api/infografis"\nparams = {"page": 1, "limit": 10}\n\nresponse = requests.get(url, params=params)\nprint(response.json())`
    },
    {
      lang: "php",
      label: "PHP",
      code: `<?php\n$url = "${displayPortalUrl}/api/infografis?page=1&limit=10";\n$response = file_get_contents($url);\n$data = json_decode($response, true);\nprint_r($data);`
    }
  ];

  // Mock JSON Response
  const mockJsonResponse = `{
  "success": true,
  "data": {
    "count": 42,
    "infografis": [
      {
        "id": "info-001",
        "title": "Capaian Ekonomi 2023",
        "imageUrl": "/assets/infographics/ekonomi-2023.jpg",
        "category": "Ekonomi"
      }
    ]
  }
}`;

  return (
    <PortalPageShell activeMenu="layanan-data">
      <div className="space-y-12 pb-20">
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                Dokumentasi <span className="text-(--color-primary)">API</span> Publik
              </>
            }
            description="Hubungkan aplikasi Anda langsung dengan dataset kami melalui REST API yang aman, standar, dan terdokumentasi dengan baik."
            decoration={
              <>
                <div className="absolute left-6 top-6 z-10 rounded-2xl border border-[#d5dbe7] bg-white/95 px-5 py-3 shadow-[0_12px_24px_rgba(33,41,52,0.12)]">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                    TOTAL ENDPOINTS
                  </p>
                  <p className="m-0 mt-1 flex items-center gap-2 font-(family-name:--font-heading) text-3xl font-semibold text-(--color-text)">
                    <Terminal className="size-5 text-(--color-primary)" />
                    12+
                  </p>
                </div>

                <div className="absolute bottom-[clamp(0.5rem,1.5vw,1.25rem)] right-[clamp(1rem,5vw,3rem)] z-2 flex items-end gap-0">
                  <Image
                    src="/assets/brand/illustrations/bulungan-laki-laki.png"
                    alt="Maskot Bulungan Laki-laki"
                    width={360}
                    height={520}
                    className="h-[clamp(12rem,22vw,15.5rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                  />
                  <Image
                    src="/assets/brand/illustrations/bulungan-perempuan.png"
                    alt="Maskot Bulungan Perempuan"
                    width={340}
                    height={500}
                    className="relative -ml-[24%] h-[clamp(9rem,16vw,11rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                  />
                </div>
              </>
            }
          />
        </section>

        {/* Getting Started / Security */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 border-(--color-border) shadow-sm group hover:border-(--color-accent-gold) transition-colors bg-white">
            <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
              <Key className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-(--color-text) mb-2">Autentikasi</h3>
            <p className="text-sm text-(--color-muted) leading-relaxed">
              Endpoint publik dapat diakses tanpa token. Untuk integrasi skala besar, silakan ajukan permintaan API Key khusus.
            </p>
          </Card>
          <Card className="p-6 border-(--color-border) shadow-sm group hover:border-(--color-accent-gold) transition-colors bg-white">
            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-(--color-text) mb-2">Rate Limiting</h3>
            <p className="text-sm text-(--color-muted) leading-relaxed">
              Dibatasi maksimal 100 request/menit untuk IP publik guna menjaga stabilitas sistem Satu Data.
            </p>
          </Card>
          <Card className="p-6 border-(--color-border) shadow-sm group hover:border-(--color-accent-gold) transition-colors bg-white">
            <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <FileJson className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-(--color-text) mb-2">Format Data</h3>
            <p className="text-sm text-(--color-muted) leading-relaxed">
              Seluruh respons dikirimkan dalam format standar JSON dengan encoding UTF-8 untuk kompatibilitas maksimal.
            </p>
          </Card>
        </section>

        {/* API Endpoints Section */}
        <section id="endpoints" className="space-y-8">
          <SectionHeading 
            title="Endpoint Utama" 
            description="Daftar endpoint RESTful yang tersedia untuk akses data publik."
          />

          {/* Endpoint 1: Infografis */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-(--color-success) text-white border-none font-bold">GET</Badge>
                <h3 className="text-xl font-bold text-(--color-text)">/api/infografis</h3>
              </div>
              <p className="text-(--color-muted) leading-relaxed text-sm">
                Mengambil daftar infografis terbaru yang dipublikasikan di portal. Mendukung navigasi halaman dan pengaturan jumlah data.
              </p>
              
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted)">Parameters</h4>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface-soft) p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <code className="text-(--color-success) font-bold">page</code>
                    <span className="text-(--color-muted) italic">integer (default: 1)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <code className="text-(--color-success) font-bold">limit</code>
                    <span className="text-(--color-muted) italic">integer (default: 12)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-(--color-muted) ml-2">Request Example</h4>
              <ApiCodeTabs examples={infografisExamples} />
              
              <details className="group rounded-xl border border-(--color-border) bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-bold text-(--color-text)">
                  <span>Lihat Contoh Response JSON</span>
                  <div className="rounded-full bg-(--color-surface-soft) p-1 group-open:rotate-180 transition-transform">
                    <SearchCode className="size-4" />
                  </div>
                </summary>
                <div className="p-4 border-t border-(--color-border) bg-[#0a132b] rounded-b-xl overflow-hidden">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                    <code>{mockJsonResponse}</code>
                  </pre>
                </div>
              </details>
            </div>
          </div>

          <div className="h-px bg-(--color-border) opacity-50 my-10" />

          {/* Endpoint 2: CKAN Action API */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-(--color-success) text-white border-none font-bold">GET</Badge>
                <h3 className="text-xl font-bold text-(--color-text)">CKAN Action API</h3>
              </div>
              <p className="text-(--color-muted) leading-relaxed text-sm">
                Akses langsung ke mesin data CKAN untuk pencarian package dan metadata detail. Sangat disarankan bagi pengembang yang membutuhkan data mentah secara dinamis.
              </p>

              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
                <Info className="size-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Endpoint ini terhubung langsung ke backend CKAN. Dokumentasi lengkap dapat dilihat pada referensi resmi CKAN.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-(--color-muted) ml-2">Direct API URLs</h4>
              <Card className="bg-[#0a132b] border-none p-5 space-y-4 shadow-xl">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Package Search</span>
                  <code className="block break-all text-[11px] text-blue-400 font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                    {packageSearchUrl}
                  </code>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Package Show</span>
                  <code className="block break-all text-[11px] text-emerald-400 font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                    {packageShowUrl}
                  </code>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer Resources */}
        <section className="pt-10">
          <Card className="p-8 sm:p-12 bg-(--color-surface-soft) border-none rounded-[32px]">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-(--color-text)">Referensi Lanjutan</h2>
                <p className="mt-4 text-(--color-muted) leading-relaxed">
                  Gunakan referensi resmi berikut untuk mempelajari kapabilitas penuh mesin data yang kami gunakan.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {references.map((ref) => (
                    <a 
                      key={ref.href} 
                      href={ref.href} 
                      target="_blank" 
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-(--color-border) hover:border-(--color-accent-gold) transition-colors group"
                    >
                      <span className="font-bold text-(--color-text)">{ref.label}</span>
                      <ExternalLink className="size-4 text-(--color-border) group-hover:text-(--color-accent-gold)" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-[40px] overflow-hidden bg-white p-8 shadow-2xl shadow-slate-200 border border-(--color-border)">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-12 rounded-2xl bg-(--color-text) flex items-center justify-center text-white">
                    <ServerCog className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-(--color-text)">Data Request</h3>
                </div>
                <p className="text-(--color-muted) mb-8 leading-relaxed text-sm">
                  Data yang Anda cari belum tersedia di API publik? Silakan kirimkan permintaan data resmi melalui layanan pengajuan kami.
                </p>
                <Button asChild className="w-full rounded-2xl h-12 text-base bg-(--color-primary) hover:bg-(--color-primary)/90">
                  <Link href="/layanan-data/permintaan-data">Ajukan Permintaan</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </PortalPageShell>
  );
}
