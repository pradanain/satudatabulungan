import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, FileSearch, SendHorizontal, ShieldCheck } from "lucide-react";
import { DataRequestForm } from "@/components/portal/data-request-form";
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
      <section>
        <Card className="relative overflow-hidden rounded-[28px] border-(--color-border) bg-white p-0 shadow-[0_12px_28px_rgba(33,41,52,0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative z-10 overflow-hidden bg-[linear-gradient(100deg,#fffefb_0%,#f8f3e6_50%,#edf3fc_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.78)_1px,transparent_0)] [background-size:3px_3px]"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <Badge
                  variant="outline"
                  className="w-fit border-transparent bg-transparent px-0 py-0 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-primary) shadow-none"
                >
                  Layanan Data Publik
                </Badge>
                <SectionHeading
                  title="Permintaan Data"
                  description="Sampaikan kebutuhan data Anda secara terstruktur. Permintaan akan diteruskan ke walidata terkait untuk proses verifikasi dan tindak lanjut."
                  className="mt-3"
                  titleClassName="text-4xl leading-[0.98] sm:text-5xl lg:text-6xl"
                  descriptionClassName="mt-1 max-w-2xl text-base sm:text-[1.05rem] text-[#5f5957]"
                />
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button asChild className="rounded-full">
                    <Link href="#form-permintaan-data">Isi Formulir Sekarang</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/layanan-data/faq">Baca FAQ Layanan Data</Link>
                  </Button>
                </div>
              </div>
            </div>

            <aside className="relative border-t border-(--color-border) bg-[#f6f8fc] px-6 py-6 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-8">
              <h2 className="m-0 font-(family-name:--font-heading) text-3xl font-semibold leading-tight text-(--color-text)">
                Alur Permintaan
              </h2>
              <div className="mt-4 grid gap-2.5">
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-sm font-semibold">1. Lengkapi Form</p>
                  <p className="mb-0 mt-1 text-sm leading-relaxed text-(--color-muted)">
                    Isi informasi pemohon, tujuan, cakupan periode, dan deskripsi data yang dibutuhkan.
                  </p>
                </article>
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-sm font-semibold">2. Verifikasi Walidata</p>
                  <p className="mb-0 mt-1 text-sm leading-relaxed text-(--color-muted)">
                    Walidata memeriksa kelengkapan, legalitas, serta kesesuaian pemanfaatan data.
                  </p>
                </article>
                <article className="rounded-2xl border border-[#d8deea] bg-white px-4 py-3">
                  <p className="m-0 text-sm font-semibold">3. Tindak Lanjut</p>
                  <p className="mb-0 mt-1 text-sm leading-relaxed text-(--color-muted)">
                    Anda menerima nomor tiket permintaan untuk memudahkan komunikasi lanjutan.
                  </p>
                </article>
              </div>
            </aside>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <ClipboardList className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Form Terstruktur</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">Membantu tim walidata memproses kebutuhan data lebih cepat.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <FileSearch className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Verifikasi</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">Permintaan ditinjau berdasarkan konteks metadata dan lisensi.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#edf2fb] p-2 text-[#385b98]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-(--color-primary)">Aman</p>
              <p className="mb-0 mt-1 text-sm text-(--color-muted)">Input divalidasi dan disimpan sebagai tiket permintaan data.</p>
            </div>
          </div>
        </Card>
      </section>

      <section id="form-permintaan-data">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title="Formulir Permintaan Data"
              description="Lengkapi formulir berikut agar permintaan dapat diteruskan ke walidata tujuan secara tepat."
              titleClassName="text-2xl sm:text-3xl"
              descriptionClassName="text-sm sm:text-base"
            />
            <Badge variant="secondary">{walidataTargets.length.toLocaleString("id-ID")} tujuan walidata tersedia</Badge>
          </div>

          <div className="mt-5">
            <DataRequestForm targets={walidataTargets} />
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 font-(family-name:--font-heading) text-2xl font-semibold sm:text-3xl">Butuh Referensi Teknis?</h2>
              <p className="mb-0 mt-2 text-sm text-(--color-muted) sm:text-base">
                Baca dokumentasi API publik atau FAQ lengkap sebelum mengirim pengajuan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="rounded-full">
                <Link href="/api">Buka Dokumentasi API</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link href="/layanan-data/faq">
                  FAQ Layanan Data
                  <SendHorizontal className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
