import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, ClipboardList, FileSearch, SendHorizontal, ShieldCheck } from "lucide-react";
import { DataRequestForm } from "@/components/portal/data-request-form";
import { PortalHeroCard } from "@/components/portal/portal-hero-card";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { walidataTargets } from "@/lib/data/layanan-data";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Permintaan Data",
  description:
    "Ajukan permintaan data resmi ke walidata terkait dengan formulir terstruktur untuk kebutuhan riset, layanan publik, dan pengembangan aplikasi.",
  path: "/layanan-data/permintaan-data",
  keywords: ["permintaan data", "formulir data Bulungan", "walidata", "layanan data publik"],
});

export default function PermintaanDataPage() {
  return (
    <PortalPageShell activeMenu="layanan-data">
      <div className="space-y-12 pb-20">
        {/* Institutional Hero Section */}
        <section>
          <PortalHeroCard
            eyebrow="PORTAL SATU DATA"
            title={
              <>
                <span className="text-(--color-primary)">Permintaan</span> Akses Data
              </>
            }
            description="Tidak menemukan data yang Anda cari? Ajukan permintaan data sektoral secara resmi kepada Walidata Kabupaten Bulungan."
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

        {/* Alur Permintaan Section */}
        <section>
          <Card className="relative overflow-hidden border-(--color-border) bg-white p-6 sm:p-10 rounded-[32px] shadow-sm">
            <div className="relative z-10">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold tracking-tight text-(--color-text) sm:text-3xl">
                  Alur <span className="text-(--color-primary)">Permintaan</span> Data
                </h2>
                <p className="mt-2 text-sm text-(--color-muted) max-w-xl">
                  Proses pengajuan data dilakukan secara transparan melalui tahapan verifikasi standar Satu Data Indonesia.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: 1,
                    title: "Lengkapi Form",
                    description: "Isi informasi pemohon, tujuan, cakupan periode, dan deskripsi data yang dibutuhkan."
                  },
                  {
                    step: 2,
                    title: "Verifikasi Walidata",
                    description: "Walidata memeriksa kelengkapan, legalitas, serta kesesuaian pemanfaatan data."
                  },
                  {
                    step: 3,
                    title: "Tindak Lanjut",
                    description: "Anda menerima nomor tiket permintaan untuk memudahkan komunikasi lanjutan."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="group relative">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                      <div className="relative mb-6 flex size-12 items-center justify-center rounded-2xl border border-(--color-primary)/20 bg-(--color-primary)/5 text-lg font-bold text-(--color-primary) shadow-sm ring-4 ring-(--color-primary)/5 transition-transform group-hover:scale-110">
                        {item.step}
                      </div>
                      <h3 className="text-lg font-bold text-(--color-text)">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                        {item.description}
                      </p>
                    </div>
                    {idx < 2 && (
                      <div className="absolute right-0 top-6 hidden h-px w-1/3 bg-(--color-border) lg:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subtle Motif Background */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              aria-hidden="true"
              style={{
                backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                backgroundRepeat: "repeat",
                backgroundPosition: "center",
                backgroundSize: "240px auto",
              }}
            />
          </Card>
        </section>

        {/* Requirements Section */}
        <section>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-(--color-border) bg-white p-8 shadow-sm rounded-[32px]">
              <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-bold text-(--color-text)">Persyaratan Umum</h2>
              <p className="mt-2 text-sm text-(--color-muted)">Pastikan Anda memenuhi kriteria berikut sebelum mengajukan permintaan data.</p>

              <ul className="mt-6 space-y-4">
                {[
                  "Identitas pemohon yang jelas (Nama, Organisasi/Instansi).",
                  "Tujuan penggunaan data yang spesifik (Riset, Kebijakan, Aplikasi).",
                  "Kesesuaian dengan regulasi perlindungan data dan privasi.",
                  "Komitmen untuk mencantumkan atribusi sumber data resmi."
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm leading-relaxed text-[#5f5957]">
                    <div className="size-5 rounded-full bg-(--color-success)/10 text-(--color-success) flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="size-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-(--color-border) bg-white p-8 shadow-sm rounded-[32px]">
              <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-bold text-(--color-text)">Ketentuan Layanan</h2>
              <p className="mt-2 text-sm text-(--color-muted)">Hak dan kewajiban walidata serta pemohon selama proses verifikasi.</p>

              <ul className="mt-6 space-y-4">
                {[
                  "Proses verifikasi memakan waktu 3-5 hari kerja.",
                  "Walidata berhak menolak permintaan jika tujuan tidak jelas.",
                  "Data yang diberikan hanya untuk penggunaan yang disetujui.",
                  "Nomor tiket akan diberikan setelah formulir terkirim."
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm leading-relaxed text-[#5f5957]">
                    <div className="size-5 rounded-full bg-(--color-accent-blue)/10 text-(--color-accent-blue) flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpenCheck className="size-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* CTA to Dedicated Form Page */}
        <section id="form-permintaan-data">
          <Card className="relative overflow-hidden border-(--color-primary)/20 bg-white p-10 shadow-xl shadow-(--color-primary)/5 rounded-[40px] text-center">
            <div className="relative z-10 space-y-6">
              <div className="mx-auto size-20 rounded-3xl bg-(--color-primary)/5 flex items-center justify-center text-(--color-primary)">
                <ClipboardList className="size-10" />
              </div>
              <div className="space-y-2">
                <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
                  Sudah Siap Mengajukan Data?
                </h2>
                <p className="mx-auto max-w-2xl text-base text-(--color-muted) leading-relaxed">
                  Lengkapi formulir permintaan data secara detail melalui sistem pengajuan terstruktur kami untuk mempercepat proses verifikasi.
                </p>
              </div>
              <Button asChild size="lg" className="h-14 rounded-2xl bg-(--color-primary) px-12 text-lg font-bold text-white shadow-xl shadow-(--color-primary)/30 hover:bg-(--color-primary)/90 hover:scale-[1.02] transition-all">
                <Link href="/layanan-data/permintaan-data/baru">
                  Mulai Pengajuan Sekarang
                </Link>
              </Button>
            </div>

            {/* Decorative background for CTA */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ClipboardList className="size-64 -rotate-12" />
            </div>
          </Card>
        </section>

        {/* Technical Reference Footer */}
        <section>
          <Card className="relative overflow-hidden border-(--color-border) bg-(--color-surface-soft) p-8 sm:p-10 rounded-[32px]">
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 lg:flex-row">
              <div className="text-center lg:text-left">
                <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-bold text-(--color-text) sm:text-3xl">Butuh Referensi Teknis?</h2>
                <p className="mt-3 max-w-xl text-base text-(--color-muted) leading-relaxed">
                  Pelajari cara kerja integrasi melalui dokumentasi API publik atau temukan jawaban instan di Pusat Bantuan kami.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="h-12 rounded-xl bg-white px-8 text-base font-bold border-(--color-border) hover:bg-(--color-surface-soft)">
                  <Link href="/api">Dokumentasi API</Link>
                </Button>
                <Button asChild className="h-12 rounded-xl bg-(--color-primary) px-8 text-base font-bold text-white shadow-lg shadow-(--color-primary)/20 hover:bg-(--color-primary)/90">
                  <Link href="/layanan-data/faq" className="flex items-center gap-2">
                    Buka Pusat Bantuan
                    <SendHorizontal className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Subtle Motif Background for Footer Card */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              aria-hidden="true"
              style={{
                backgroundImage: "url('/assets/brand/motifs/motif-3-suku-optimized.webp')",
                backgroundRepeat: "repeat",
                backgroundPosition: "center",
                backgroundSize: "300px auto",
              }}
            />
          </Card>
        </section>
      </div>
    </PortalPageShell>
  );
}
