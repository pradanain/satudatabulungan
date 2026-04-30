import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

const commonStatuses = [
  { code: "400", label: "Permintaan tidak valid" },
  { code: "401", label: "Memerlukan autentikasi" },
  { code: "403", label: "Akses ditolak" },
  { code: "404", label: "Halaman tidak ditemukan" },
  { code: "429", label: "Terlalu banyak permintaan" },
  { code: "500", label: "Gangguan sistem" },
  { code: "502", label: "Layanan perantara bermasalah" },
  { code: "503", label: "Layanan tidak tersedia" },
  { code: "504", label: "Batas waktu habis" },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Halaman Error",
  description: "Daftar halaman status error untuk kebutuhan simulasi dan pengujian antarmuka.",
  path: "/error",
  keywords: ["error page", "status code", "Satu Data Bulungan"],
});

export default function ErrorIndexPage() {
  return (
    <PortalPageShell>
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Halaman Status Error"
            description="Gunakan halaman ini untuk melihat tampilan status 4xx/5xx dengan gaya yang konsisten di portal."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {commonStatuses.map((item) => (
              <Button key={item.code} asChild variant="secondary" size="sm" className="rounded-lg">
                <Link href={`/error/${item.code}`}>{item.code}</Link>
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {commonStatuses.map((item) => (
          <Card key={item.code} className="flex h-full flex-col gap-3 p-4">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status {item.code}</p>
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-xl font-semibold">{item.label}</h2>
            <Button asChild className="mt-auto rounded-lg">
              <Link href={`/error/${item.code}`}>Buka Halaman</Link>
            </Button>
          </Card>
        ))}
      </section>
    </PortalPageShell>
  );
}
