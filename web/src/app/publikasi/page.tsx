import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { loadKabarDataItems } from "@/lib/services/news-service";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { buildPageMetadata } from "@/lib/utils/metadata";

const publicationMenus = [
  {
    id: "berita",
    title: "Berita",
    description: "Rilis berita terbaru seputar pemutakhiran data, peluncuran dataset, dan agenda statistik daerah.",
    href: "/publikasi#berita",
  },
  {
    id: "buku-digital",
    title: "Buku Digital",
    description: "Kumpulan buku elektronik tematik terkait pembangunan daerah dan statistik sektoral Bulungan.",
    href: "/dataset?sort=terbaru",
  },
  {
    id: "infografis",
    title: "Infografis",
    description: "Materi visual ringkas untuk membaca capaian indikator prioritas dan perkembangan antar tahun.",
    href: "/publikasi/infografis",
  },
  {
    id: "regulasi",
    title: "Regulasi",
    description: "Produk hukum dan kebijakan resmi yang menjadi landasan tata kelola Satu Data Kabupaten Bulungan.",
    href: "/dataset?sort=terbaru",
  },
  {
    id: "petunjuk-teknis",
    title: "Petunjuk Teknis",
    description: "Panduan pelaksanaan teknis untuk proses standar metadata, pemutakhiran data, dan publikasi.",
    href: "/dataset?sort=terbaru",
  },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Publikasi",
  description:
    "Akses publikasi resmi Satu Data Bulungan meliputi berita, buku digital, infografis, regulasi, dan petunjuk teknis.",
  path: "/publikasi",
  keywords: ["publikasi data", "berita data", "infografis Bulungan", "regulasi data"],
});

export default async function PublikasiPage() {
  const kabarDataItems = await loadKabarDataItems();

  return (
    <PortalPageShell activeMenu="publikasi">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Publikasi"
            description="Pilih jenis publikasi untuk melihat materi informasi resmi terkait tata kelola dan pemanfaatan data."
          />
        </Card>
      </section>

      <section id="berita" className="scroll-mt-24">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Semua Berita Satu Data"
            description="Daftar berita terbaru terkait koordinasi, penguatan tata kelola, dan pemanfaatan data di Kabupaten Bulungan."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kabarDataItems.map((item) => (
              <Card key={item.title} className="overflow-hidden border-(--color-border) p-0">
                <Link href={item.href} target="_blank" rel="noreferrer" className="block">
                  <div className="relative h-52">
                    <Image src={item.imageSrc} alt={item.title} fill className="object-cover" />
                  </div>
                </Link>

                <div className="p-5">
                  <div className="mb-4 h-0.5 w-8 rounded-full bg-[#8fc8bb]" />
                  <h3 className="m-0 line-clamp-3 font-(family-name:--font-heading) text-3xl font-semibold leading-snug tracking-tight text-(--color-text)">
                    {item.title}
                  </h3>
                  <p className="mb-0 mt-3 line-clamp-2 text-sm leading-relaxed text-(--color-muted)">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm text-(--color-muted)">
                    <CalendarDays className="size-4" />
                    {formatIndonesianDate(item.date)}
                  </div>
                  <p className="mb-0 mt-2 text-sm text-(--color-muted)">{item.organization}</p>
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) transition hover:text-[#8f1717]"
                  >
                    Baca berita asli
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        {publicationMenus.map((item) => (
          <Card key={item.id} id={item.id} className="flex h-full flex-col gap-4 p-5">
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">{item.title}</h2>
            <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">{item.description}</p>
            <Button asChild variant="secondary" className="mt-auto w-fit rounded-lg">
              <Link href={item.href}>Lihat Konten Terkait</Link>
            </Button>
          </Card>
        ))}
      </section>
    </PortalPageShell>
  );
}
