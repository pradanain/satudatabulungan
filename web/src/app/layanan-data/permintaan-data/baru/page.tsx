import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Info } from "lucide-react";
import { DataRequestForm } from "@/components/portal/data-request-form";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Formulir Permintaan Data Baru",
  description: "Lengkapi formulir pengajuan data resmi Kabupaten Bulungan untuk kebutuhan riset, kebijakan, atau layanan publik.",
  path: "/layanan-data/permintaan-data/baru",
});

export default function NewDataRequestPage() {
  return (
    <PortalPageShell activeMenu="layanan-data">
      <div className="space-y-10 pb-20">
        {/* Header Navigation */}
        <nav className="flex items-center justify-between">
          <Button asChild variant="ghost" className="-ml-4 rounded-full text-(--color-muted) hover:text-(--color-primary)">
            <Link href="/layanan-data/permintaan-data" className="flex items-center gap-2">
              <ChevronLeft className="size-4" />
              Kembali ke Panduan
            </Link>
          </Button>
        </nav>

        {/* Focused Form Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-(--color-primary) p-3 text-white shadow-lg shadow-(--color-primary)/20">
              <ClipboardList className="size-6" />
            </div>
            <h1 className="m-0 font-(family-name:--font-heading) text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
              Formulir Permintaan Data
            </h1>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-(--color-muted) sm:text-lg">
            Mohon isi informasi di bawah ini dengan lengkap dan benar. Informasi ini akan digunakan oleh Walidata untuk memproses verifikasi ketersediaan data Anda.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main Form Area */}
          <main>
            <Card className="border-(--color-border) bg-white p-6 shadow-sm sm:p-10 rounded-[32px]">
              <DataRequestForm />
            </Card>
          </main>

          {/* Side Help / Info */}
          <aside className="space-y-6">
            <Card className="border-(--color-border) bg-[#f8fafd] p-6 rounded-3xl">
              <div className="flex items-center gap-3 text-(--color-primary) mb-4">
                <Info className="size-5" />
                <h3 className="font-bold text-sm">Informasi Penting</h3>
              </div>
              <ul className="space-y-4 text-xs leading-relaxed text-[#5f5957]">
                <li>
                  <span className="font-bold block mb-1">Cek Kembali</span>
                  Pastikan email dan nomor telepon aktif untuk pengiriman nomor tiket.
                </li>
                <li>
                  <span className="font-bold block mb-1">Tujuan Penggunaan</span>
                  Jelaskan secara spesifik bagaimana data ini akan digunakan untuk mempercepat verifikasi.
                </li>
                <li>
                  <span className="font-bold block mb-1">Privasi</span>
                  Data pribadi Anda dilindungi dan hanya digunakan untuk keperluan koordinasi walidata.
                </li>
              </ul>
            </Card>

            <div className="rounded-2xl border border-dashed border-(--color-border) p-6 text-center">
              <p className="text-xs text-(--color-muted) leading-relaxed">
                Butuh bantuan dalam pengisian? <br />
                <Link href="/layanan-data/faq" className="font-bold text-(--color-primary) hover:underline">
                  Lihat FAQ Layanan Data
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PortalPageShell>
  );
}
