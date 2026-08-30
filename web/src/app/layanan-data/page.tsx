import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, 
  Code2, 
  FileEdit, 
  HelpCircle, 
  MessageSquareQuote,
  ShieldCheck,
  Zap
} from "lucide-react";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Layanan Data",
  description:
    "Pusat layanan data publik Kabupaten Bulungan: Permintaan data sektoral, akses API publik, dan pusat bantuan (FAQ).",
  path: "/layanan-data",
  keywords: ["layanan data", "permintaan data", "API satu data", "FAQ data Bulungan"],
});

const services = [
  {
    title: "Permintaan Data",
    description: "Tidak menemukan data yang Anda cari? Ajukan permintaan data sektoral secara resmi kepada Walidata Kabupaten Bulungan.",
    href: "/layanan-data/permintaan-data",
    icon: FileEdit,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    badge: "Populer"
  },
  {
    title: "Akses API Publik",
    description: "Hubungkan aplikasi Anda langsung dengan dataset kami melalui REST API yang aman, standar, dan terdokumentasi dengan baik.",
    href: "/api",
    icon: Code2,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    badge: "Developer"
  },
  {
    title: "Pusat Bantuan (FAQ)",
    description: "Temukan jawaban cepat atas pertanyaan umum seputar lisensi data, format file, penggunaan portal, dan tata kelola data.",
    href: "/layanan-data/faq",
    icon: HelpCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  }
];

export default function LayananDataHubPage() {
  return (
    <PortalPageShell activeMenu="layanan-data">
      <div className="space-y-12 pb-20">
        {/* Hero Section */}
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                Layanan <span className="text-(--color-primary)">Data</span> Publik
              </>
            }
            description="Pusat layanan informasi dan permintaan data sektoral. Pilih kategori layanan di bawah ini untuk memulai interaksi data Anda."
            decoration={
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
            }
          />
        </section>

        {/* Services Grid */}
        <section className="space-y-8">
          <div className="text-center">
            <SectionHeading 
              title="Pilih Jenis Layanan" 
              description="Navigasi cepat untuk akses data manual maupun sistem-ke-sistem."
              className="items-center"
              titleClassName="text-2xl sm:text-3xl"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <Card 
                key={service.title} 
                className="group relative flex flex-col overflow-hidden border-[#e5eaf2] bg-white p-0 shadow-sm transition-all duration-300 hover:translate-y-[-4px] hover:border-(--color-primary)/20 hover:shadow-[0_16px_32px_rgba(33,41,52,0.08)]"
              >
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  <div className={`mb-5 inline-flex size-12 items-center justify-center rounded-xl ${service.bgColor} ${service.color} transition-transform duration-300 group-hover:scale-110`}>
                    <service.icon className="size-6" />
                  </div>
                  
                  {service.badge && (
                    <Badge className="absolute right-5 top-5 bg-(--color-primary)/10 text-(--color-primary) border-none text-[10px] uppercase font-bold tracking-wider">
                      {service.badge}
                    </Badge>
                  )}

                  <h3 className="mb-2 font-(family-name:--font-heading) text-xl font-semibold text-(--color-text)">
                    {service.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-(--color-muted) flex-grow">
                    {service.description}
                  </p>

                  <Button asChild variant="outline" className="w-full rounded-lg border-[#d1d9e6] py-5 group-hover:border-(--color-primary) group-hover:text-black hover:text-black transition-colors">
                    <Link href={service.href} className="flex items-center justify-center gap-2 text-sm font-bold">
                      Akses Layanan
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,#1a2b52_0%,#0d1733_100%)] p-6 sm:p-10 text-white">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-sm">
                <ShieldCheck className="size-4" />
                Standar Pelayanan
              </div>
              <h2 className="mt-6 font-(family-name:--font-heading) text-3xl font-semibold leading-tight sm:text-4xl">
                Komitmen Transparansi Data Pemerintah Kabupaten Bulungan
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                Setiap layanan yang kami sediakan mengikuti regulasi Satu Data Indonesia untuk menjamin kualitas, keamanan, dan kebermanfaatan data bagi masyarakat.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
                <MessageSquareQuote className="size-8 text-amber-400 mb-4" />
                <h4 className="font-bold text-lg">Respon Cepat</h4>
                <p className="mt-2 text-sm text-slate-400">Setiap permintaan data akan ditindaklanjuti dalam waktu maksimal 5 hari kerja.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
                <Zap className="size-8 text-amber-400 mb-4" />
                <h4 className="font-bold text-lg">Data Akurat</h4>
                <p className="mt-2 text-sm text-slate-400">Seluruh dataset telah melalui verifikasi Walidata and Pembina Data (BPS).</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PortalPageShell>
  );
}
