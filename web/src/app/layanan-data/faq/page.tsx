import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, ExternalLink } from "lucide-react";
import { FaqAccordion } from "@/components/portal/faq-accordion";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { layananFaqSections, layananReferenceLinks } from "@/lib/data/layanan-data";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ Layanan Data",
  description:
    "FAQ lengkap layanan data publik: permintaan data, lisensi, metadata, penggunaan API, keamanan, dan troubleshooting integrasi.",
  path: "/layanan-data/faq",
  keywords: ["FAQ layanan data", "panduan data publik", "lisensi data", "keamanan API"],
});

export default function LayananDataFaqPage() {
  const totalItems = layananFaqSections.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <PortalPageShell activeMenu="layanan-data">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="FAQ Layanan Data"
            description="Kumpulan jawaban detail untuk membantu Anda menggunakan layanan data publik dengan tepat, aman, dan efektif."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{layananFaqSections.length} kategori</Badge>
            <Badge variant="outline">{totalItems} pertanyaan</Badge>
            <Badge variant="outline">{layananReferenceLinks.length} referensi resmi</Badge>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <FaqAccordion sections={layananFaqSections} />
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold sm:text-3xl">
                Referensi yang Digunakan
              </h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Daftar rujukan untuk prinsip open data, lisensi, keamanan API, dan dokumentasi CKAN.
              </p>
            </div>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/layanan-data/permintaan-data">
                Ajukan Permintaan Data
                <BookOpenCheck className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {layananReferenceLinks.map((reference) => (
              <article key={reference.url} className="rounded-2xl border border-[#d7deea] bg-[#f8fafd] p-4">
                <h3 className="m-0 text-base font-semibold">{reference.title}</h3>
                <p className="mb-0 mt-1 text-sm text-(--color-muted)">{reference.note}</p>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:text-[#8f1717]"
                >
                  Buka referensi
                  <ExternalLink className="size-4" />
                </a>
              </article>
            ))}
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
