import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { InfografisBrowser } from "@/components/portal/infografis-browser";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi Infografis",
  description:
    "Kumpulan infografis resmi DKIP Bulungan yang disinkronkan otomatis melalui endpoint internal Portal Satu Data.",
  path: "/publikasi/infografis",
  keywords: ["infografis", "DKIP Bulungan", "Satu Data Bulungan", "publikasi data"],
});

export const dynamic = "force-dynamic";

export default function PublikasiInfografisPage() {
  return (
    <PortalPageShell activeMenu="publikasi">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Publikasi / Infografis"
            description="Daftar infografis dari DKIP Bulungan ditarik otomatis melalui API internal dengan fallback sumber terkelola."
          />
        </Card>
      </section>

      <section>
        <InfografisBrowser initialLimit={12} />
      </section>
    </PortalPageShell>
  );
}

