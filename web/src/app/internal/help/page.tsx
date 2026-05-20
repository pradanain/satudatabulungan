import Link from "next/link";
import { Book, Headset, Info, MessageCircleQuestion, Search, ShieldCheck } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const dynamic = "force-dynamic";

export default async function InternalHelpPage() {
  const session = await requireInternalSession("help");

  return (
    <InternalShell session={session} activeKey="help">
      <div className="flex flex-col gap-6">
        {/* Help Center Header & Search */}
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden px-8 py-12 sm:px-12 sm:py-16 text-center text-white">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('/bg-batik.png')] bg-cover bg-center mix-blend-overlay" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Halo, ada yang bisa kami bantu?</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Cari panduan penggunaan, pertanyaan umum, atau hubungi tim support untuk masalah teknis.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input 
                placeholder="Cari artikel atau kata kunci (contoh: 'sinkronisasi CKAN')" 
                className="pl-12 h-12 rounded-full border-0 bg-white/10 text-white placeholder:text-white/60 focus-visible:bg-white focus-visible:text-gray-900 shadow-xl transition-all"
              />
            </div>
          </div>
        </div>

        {/* Kategori Bantuan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="#" className="group block">
            <Card className="h-full p-5 shadow-sm border-[var(--color-border)] hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Panduan Admin</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">Konfigurasi & User</p>
              </div>
            </Card>
          </Link>
          <Link href="#" className="group block">
            <Card className="h-full p-5 shadow-sm border-[var(--color-border)] hover:border-emerald-300 hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Book className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Panduan Walidata</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">Alur Review Data</p>
              </div>
            </Card>
          </Link>
          <Link href="#" className="group block">
            <Card className="h-full p-5 shadow-sm border-[var(--color-border)] hover:border-orange-300 hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircleQuestion className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text)]">FAQ Umum</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">Pertanyaan sering diajukan</p>
              </div>
            </Card>
          </Link>
          <Link href="#" className="group block">
            <Card className="h-full p-5 shadow-sm border-[var(--color-border)] hover:border-purple-300 hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headset className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Hubungi Support</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">Tiket bantuan teknis</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* FAQ Accordion */}
        <Card className="shadow-sm border-[var(--color-border)] p-6 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <Info className="size-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-semibold">Bagaimana alur publikasi dataset di Portal Satu Data?</AccordionTrigger>
                <AccordionContent className="text-[var(--color-muted)] leading-relaxed">
                  Dataset baru harus dibuat dalam status <strong>Draft</strong>. Setelah melengkapi metadata, OPD mengirim dataset untuk direview (berubah menjadi <strong>Submitted</strong>). Walidata akan memeriksa kelengkapan. Jika disetujui, status menjadi <strong>Approved</strong> lalu <strong>Published</strong>. Jika ada kekurangan, akan dikembalikan (<strong>Need Revision</strong>).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-semibold">Apa yang harus dilakukan jika mendapatkan status Need Revision?</AccordionTrigger>
                <AccordionContent className="text-[var(--color-muted)] leading-relaxed">
                  Buka detail dataset dan lihat catatan revisi yang diberikan oleh Walidata di bagian bawah atau di panel notifikasi Anda. Lakukan perbaikan pada form, lalu klik tombol "Ajukan Ulang" agar dataset kembali masuk ke antrean review.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-semibold">Mengapa dataset gagal tersinkronisasi dengan CKAN?</AccordionTrigger>
                <AccordionContent className="text-[var(--color-muted)] leading-relaxed">
                  Gagal sinkronisasi biasanya disebabkan oleh struktur metadata yang tidak valid menurut skema CKAN, atau terjadi timeout jaringan saat proses sync. Cek detail error di halaman <strong>Integrasi CKAN</strong> atau hubungi Admin Teknis.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-semibold">Bagaimana cara menambahkan format referensi topik baru?</AccordionTrigger>
                <AccordionContent className="text-[var(--color-muted)] leading-relaxed">
                  Topik dan kode referensi hanya dapat ditambahkan oleh Admin atau Walidata Data Master. Anda dapat mengajukan permintaan penambahan topik melalui tim Walidata dengan menyertakan format dan deskripsi standar yang ingin digunakan.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="mt-8 text-center border-t border-[var(--color-border)] pt-8">
            <p className="text-[var(--color-muted)] text-sm mb-4">Masih tidak dapat menemukan jawaban?</p>
            <Button className="rounded-full px-6">Buat Tiket Bantuan</Button>
          </div>
        </Card>
      </div>
    </InternalShell>
  );
}
