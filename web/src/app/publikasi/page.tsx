import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Info,
  Newspaper,
  Settings2
} from "lucide-react";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pusat Publikasi",
  description:
    "Akses publikasi resmi Satu Data Bulungan meliputi berita terbaru, buku digital, infografis data, regulasi, dan petunjuk teknis.",
  path: "/publikasi",
  keywords: ["publikasi data", "berita Bulungan", "infografis", "buku digital", "regulasi data"],
});

const publicationCategories = [
  {
    title: "Berita",
    description: "Kumpulan berita dan artikel terbaru seputar kegiatan, rilis data, dan informasi terkini dari Pemerintah Kabupaten Bulungan.",
    href: "/publikasi-berita",
    icon: Newspaper,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Buku Digital",
    description: "Dokumen publikasi statistik dalam format elektronik (PDF) yang menyajikan data komprehensif berbagai sektor pembangunan.",
    href: "/publikasi-buku-digital",
    icon: BookOpen,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    title: "Infografis",
    description: "Visualisasi data statistik yang disajikan secara menarik dan mudah dipahami untuk memberikan gambaran cepat fakta daerah.",
    href: "/publikasi/infografis",
    icon: Info,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  {
    title: "Regulasi",
    description: "Daftar payung hukum dan kebijakan terkait pengelolaan data, statistik sektoral, dan Satu Data Indonesia di tingkat daerah.",
    href: "/publikasi-regulasi",
    icon: FileText,
    color: "text-rose-600",
    bgColor: "bg-rose-50"
  },
  {
    title: "Petunjuk Teknis",
    description: "Panduan operasional dan standar prosedur teknis untuk produsen data dalam mengelola dan mengunggah data ke portal.",
    href: "/publikasi-petunjuk-teknis",
    icon: Settings2,
    color: "text-slate-600",
    bgColor: "bg-slate-50"
  }
];

export default function PublikasiHubPage() {
  return (
    <PortalPageShell activeMenu="publikasi">
      <div className="space-y-12 pb-20">
        {/* Hero Section */}
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                Pusat <span className="text-(--color-primary)">Publikasi</span>
              </>
            }
            description="Akses publikasi resmi pemerintah kabupaten bulungan yang meliputi berita terbaru, buku digital, infografis data, regulasi, dan petunjuk teknis."
            decoration={
              <div className="absolute bottom-0 right-[clamp(1rem,5vw,3rem)] z-2 flex items-end gap-0">
                <Image
                  src="/assets/brand/illustrations/bulungan-laki-laki.png"
                  alt="Maskot Bulungan Laki-laki"
                  width={360}
                  height={520}
                  className="h-[clamp(10rem,18vw,14rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                />
                <Image
                  src="/assets/brand/illustrations/bulungan-perempuan.png"
                  alt="Maskot Bulungan Perempuan"
                  width={340}
                  height={500}
                  className="relative -ml-[20%] h-[clamp(8rem,14vw,10rem)] w-auto object-contain object-bottom drop-shadow-[0_12px_24px_rgba(40,46,56,0.15)] transition-transform hover:translate-y-[-5px]"
                />
              </div>
            }
          />
        </section>

        {/* Categories Grid */}
        <section className="space-y-8">
          <div className="text-center">
            <SectionHeading
              title="Kategori Publikasi"
              description="Jelajahi informasi berdasarkan jenis konten yang Anda butuhkan."
              className="items-center"
              titleClassName="text-2xl sm:text-3xl"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicationCategories.map((category) => (
              <Card
                key={category.title}
                className="group relative flex flex-col overflow-hidden border-[#e5eaf2] bg-white p-0 shadow-sm transition-all duration-300 hover:translate-y-[-4px] hover:border-(--color-primary)/20 hover:shadow-[0_16px_32px_rgba(33,41,52,0.08)]"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className={`mb-5 inline-flex size-14 items-center justify-center rounded-2xl ${category.bgColor} ${category.color} transition-transform duration-300 group-hover:scale-110`}>
                    <category.icon className="size-7" />
                  </div>

                  <h3 className="mb-2 font-(family-name:--font-heading) text-xl font-semibold text-(--color-text)">
                    {category.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-(--color-muted) flex-grow">
                    {category.description}
                  </p>

                  <Button asChild variant="outline" className="w-full rounded-xl border-[#d1d9e6] py-6 group-hover:border-(--color-primary) group-hover:text-black hover:text-black transition-colors">
                    <Link href={category.href} className="flex items-center justify-center gap-2 text-sm font-bold">
                      Buka Publikasi
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PortalPageShell>
  );
}
