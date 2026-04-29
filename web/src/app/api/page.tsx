import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { getDatasets } from "@/lib/services/dataset-service";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Dokumentasi API Publik",
  description:
    "Dokumentasi endpoint API publik Satu Data Bulungan untuk daftar dataset, detail metadata, dan integrasi aplikasi.",
  path: "/api",
  keywords: ["API Bulungan", "CKAN API", "package_search", "package_show", "Satu Data Bulungan"],
});

export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const datasets = await getDatasets({ sort: "terbaru" });
  const sample = datasets[0];
  const packageShowPath = sample
    ? `/api/3/action/package_show?id=${encodeURIComponent(sample.slug)}`
    : "/api/3/action/package_show?id=<slug-dataset>";

  const packageSearchPath = "/api/3/action/package_search?rows=10&start=0";

  return (
    <PortalPageShell activeMenu="layanan-data">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Dokumentasi API Publik"
            description="Gunakan referensi endpoint ini untuk mengambil daftar dataset, membaca metadata, dan mengintegrasikan data Bulungan ke aplikasi Anda."
          />
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Endpoint Inti CKAN"
            description="Gunakan pola endpoint berikut pada host CKAN yang Anda gunakan."
            titleClassName="text-2xl sm:text-3xl"
          />
          <div className="mt-4 grid gap-3">
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">package_search</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {packageSearchPath}
              </code>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
                Mengambil daftar dataset untuk katalog publik dengan dukungan pagination.
              </p>
            </article>
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">package_show</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {packageShowPath}
              </code>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
                Mengambil metadata lengkap dan daftar resource untuk satu dataset.
              </p>
            </article>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading title="Contoh Request" titleClassName="text-2xl sm:text-3xl" />
          <div className="mt-4 grid gap-3">
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">Contoh cURL package_search</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {`curl "<ckan-base-url>${packageSearchPath}"`}
              </code>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
                Ganti nilai <code>&lt;ckan-base-url&gt;</code> dengan host CKAN Anda.
              </p>
            </article>
            <article className="rounded-xl border border-[#d6ddea] bg-[#f8fafd] p-4">
              <h3 className="m-0 text-base font-semibold">Contoh cURL package_show</h3>
              <code className="mt-2 inline-block break-all rounded-lg bg-[#20242c] px-3 py-2 text-xs text-[#f3f6fb] sm:text-sm">
                {`curl "<ckan-base-url>${packageShowPath}"`}
              </code>
              <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">
                Gunakan slug dataset yang valid untuk mendapatkan detail resource.
              </p>
            </article>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <SectionHeading title="Referensi Cepat" titleClassName="text-2xl sm:text-3xl" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="/dataset">Jelajahi Katalog Dataset</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="/metadata">Lihat Standar Metadata</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link href="/internal">Akses Internal</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
