import type { Metadata } from "next";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/portal/section-heading";
import { buildPageMetadata } from "@/lib/utils/metadata";

const faqItems = [
  {
    question: "Bagaimana cara meminta dataset yang belum tersedia?",
    answer:
      "Gunakan layanan Permintaan Data dan isi detail kebutuhan data, periode, serta tujuan pemanfaatan agar proses verifikasi lebih cepat.",
  },
  {
    question: "Apakah data dapat digunakan ulang untuk riset atau aplikasi?",
    answer:
      "Ya, selama mengikuti ketentuan lisensi pada setiap dataset dan tetap mencantumkan sumber data resmi Pemerintah Kabupaten Bulungan.",
  },
  {
    question: "Di mana dokumentasi teknis API dapat diakses?",
    answer: "Dokumentasi lengkap endpoint tersedia pada menu API di bawah layanan data.",
  },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Layanan Data",
  description:
    "Layanan publik untuk permintaan data, akses API, dan FAQ seputar pemanfaatan data Kabupaten Bulungan.",
  path: "/layanan-data",
  keywords: ["layanan data", "permintaan data Bulungan", "FAQ data", "API data Bulungan"],
});

export default function LayananDataPage() {
  return (
    <PortalPageShell activeMenu="layanan-data">
      <section>
        <Card className="bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-6">
          <SectionHeading
            title="Layanan Data"
            description="Pusat layanan publik untuk mengajukan permintaan data, mengakses API, dan menemukan jawaban cepat."
          />
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card id="permintaan-data" className="flex h-full flex-col gap-4 p-5">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">Permintaan Data</h2>
          <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">
            Ajukan permintaan data resmi untuk kebutuhan riset, perencanaan, evaluasi program, atau kebutuhan layanan
            publik.
          </p>
          <Button asChild className="mt-auto w-fit rounded-lg">
            <Link href="/dataset?sort=terbaru">Ajukan Melalui Katalog Dataset</Link>
          </Button>
        </Card>

        <Card className="flex h-full flex-col gap-4 p-5">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-semibold">API</h2>
          <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">
            Integrasikan data Kabupaten Bulungan ke aplikasi Anda melalui endpoint API publik berbasis CKAN.
          </p>
          <Button asChild variant="secondary" className="mt-auto w-fit rounded-lg">
            <Link href="/api">Buka Dokumentasi API</Link>
          </Button>
        </Card>
      </section>

      <section>
        <Card id="faq" className="p-5 sm:p-6">
          <SectionHeading title="FAQ" description="Pertanyaan yang sering diajukan terkait layanan data publik." />
          <div className="mt-4 grid gap-3">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-[#d7ddeb] bg-[#f8fafd] p-4">
                <h3 className="m-0 text-base font-semibold">{item.question}</h3>
                <p className="mb-0 mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
