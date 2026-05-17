import type { Metadata } from "next";
import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Gavel,
  Network,
  Scale,
  Settings2,
  ShieldCheck,
  Users2
} from "lucide-react";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Profil Satu Data Indonesia",
  description:
    "Mengenal kerangka kerja Satu Data Indonesia (SDI) sebagai pilar tata kelola data sektoral yang akurat, mutakhir, dan terintegrasi di Kabupaten Bulungan.",
  path: "/tentang/profil-sdi",
  keywords: ["Satu Data Indonesia", "Profil SDI Bulungan", "tata kelola data", "regulasi data pemerintah"],
});

const sdiPrinciples = [
  {
    title: "Standar Data",
    description: "Data yang dihasilkan harus memenuhi standar yang mencakup konsep, definisi, klasifikasi, unit, dan satuan.",
    icon: Settings2
  },
  {
    title: "Metadata",
    description: "Informasi terstruktur yang menjelaskan konteks, isi, dan masa berlaku data untuk menjamin akurasi.",
    icon: FileText
  },
  {
    title: "Interoperabilitas",
    description: "Kemampuan data untuk dibagipakaikan antar sistem elektronik yang saling berinteraksi secara mulus.",
    icon: Network
  },
  {
    title: "Kode Referensi",
    description: "Penggunaan data induk dan kode referensi yang unik untuk sinkronisasi data lintas instansi.",
    icon: ShieldCheck
  }
];

const sdiRoles = [
  {
    title: "Pembina",
    institution: "BPS Kabupaten Bulungan",
    description: "Bertanggung jawab memberikan arahan teknis, metodologi, dan standar data agar sesuai dengan norma nasional.",
    icon: CheckCircle2
  },
  {
    title: "Sekretariat",
    institution: "Bappedalitbang Kabupaten Bulungan",
    description: "Bertindak sebagai Koordinator dan Sekretariat Satu Data tingkat daerah yang mengkoordinasikan seluruh forum Satu Data.",
    icon: Network
  },
  {
    title: "Walidata",
    institution: "DKIP Kabupaten Bulungan",
    description: "Mengelola, memverifikasi, dan menyebarluaskan data sektoral dari produsen data ke dalam portal pusat.",
    icon: Users2
  },
  {
    title: "Produsen Data / Operator",
    institution: "Organisasi Perangkat Daerah (OPD)",
    description: "Menghasilkan data sektoral berdasarkan tugas pokok dan fungsi instansi masing-masing secara akurat.",
    icon: BookOpen
  }
];

export default function ProfilSdiPage() {
  return (
    <PortalPageShell activeMenu="tentang">
      <div className="space-y-10 pb-16">
        {/* Hero Section */}
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                <span className="text-(--color-primary)">Satu Data</span> Kabupaten Bulungan
              </>
            }
            description="Mewujudkan tata kelola data Kabupaten Bulungan yang transparan, berkualitas, dan terintegrasi untuk mendukung perencanaan pembangunan daerah yang lebih baik dan berbasis data"
            decoration={
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-end pr-[clamp(1rem,5vw,5rem)] opacity-[0.85]">
                  <Image
                    src="/assets/partners/logo-sdi.png"
                    alt="Logo Satu Data Indonesia"
                    width={400}
                    height={400}
                    className="size-[clamp(12rem,20vw,20rem)] object-contain"
                  />
                </div>
              </div>
            }
          />
        </section>

        {/* Commitment Section: Minimalist & Clean */}
        <section>
          <Card className="relative overflow-hidden p-6 sm:p-8 text-center border border-slate-100 bg-white shadow-sm rounded-[32px]">
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text)] sm:text-xl tracking-tight">
                Komitmen Satu Data Kabupaten Bulungan
              </h2>
              <div className="mt-2.5 h-1 w-10 bg-[var(--color-primary)] mx-auto rounded-full" />
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--color-muted)] font-medium italic opacity-85">
                "Mewujudkan tata kelola data Kabupaten Bulungan yang transparan, berkualitas, dan terintegrasi untuk mendukung perencanaan pembangunan daerah yang lebih baik dan berbasis data."
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[url('/assets/brand/motifs/motif-3-suku-band.webp')] bg-[length:auto_100%] bg-repeat-x opacity-[0.1]" />
          </Card>
        </section>

        {/* Ecosystem Section: High Density Layout */}
        <section className="space-y-8">
          <div className="text-center">
            <SectionHeading
              title="Ekosistem Penyelenggaraan"
              description="Kolaborasi aktif antar elemen pemerintah daerah dalam mengelola data sektoral."
              className="items-center"
              titleClassName="text-2xl sm:text-3xl"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {sdiRoles.map((role) => (
              <Card key={role.title} className="group flex flex-col p-5 sm:p-6 border-t-2 border-t-[var(--color-accent-gold)] bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-start justify-between mb-5">
                  <h3 className="text-lg font-bold text-[var(--color-text)]">{role.title}</h3>
                  <img
                    src={role.title.includes("Pembina") ? "/assets/partners/logo-bps.png" : "/assets/brand/logos/lambang-bulungan.png"}
                    alt={`Logo ${role.institution}`}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="mb-3">
                  <Badge variant="secondary" className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                    {role.institution}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                  {role.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Legal Basis Section: Compact Pro Version */}
        <section>
          <Card className="overflow-hidden p-0 bg-white border border-slate-100 shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row">
              <div className="bg-[radial-gradient(circle_at_top,#142752_0%,#0d1733_44%,#0a132b_100%)] p-6 md:w-1/4 flex flex-col justify-center items-center text-center relative">
                <div className="relative z-10">
                  <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 mb-4">
                    <Gavel className="size-8 text-[var(--color-accent-gold)]" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Dasar Hukum</h3>
                </div>
              </div>
              <div className="p-6 md:w-3/4 space-y-5 bg-white">
                <div className="flex gap-4 group">
                  <div className="shrink-0 mt-0.5 flex size-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    <Scale className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)]">Peraturan Presiden Nomor 39 Tahun 2019</h4>
                    <p className="text-xs text-[var(--color-muted)] mt-1">Satu Data Indonesia sebagai landasan utama tata kelola data nasional.</p>
                  </div>
                </div>
                <div className="flex gap-4 group border-t border-slate-50 pt-5">
                  <div className="shrink-0 mt-0.5 flex size-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    <Scale className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)]">Peraturan Bupati Bulungan</h4>
                    <p className="text-xs text-[var(--color-muted)] mt-1">Pedoman teknis penyelenggaraan Satu Data di tingkat daerah Kabupaten Bulungan.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </PortalPageShell>
  );
}
