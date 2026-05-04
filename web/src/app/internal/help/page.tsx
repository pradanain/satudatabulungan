import Link from "next/link";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Card } from "@/components/ui/card";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";

const faqItems = [
  "Bagaimana cara membuat draft dataset baru?",
  "Kapan dataset harus diajukan ke walidata?",
  "Apa yang harus diperbaiki saat status Need Revision muncul?",
  "Bagaimana memastikan dataset yang dipublish langsung tampil di portal publik?",
];

export const dynamic = "force-dynamic";

export default async function InternalHelpPage() {
  const session = await requireInternalSession("help");

  return (
    <InternalShell session={session} activeKey="help">
      <InternalPageHeader
        title="Bantuan & FAQ"
        description="Panduan ringkas untuk mengoperasikan portal internal selama development lokal dan kesiapan menuju backend final."
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="internal-surface border-transparent p-5 shadow-none">
          <h2 className="m-0 text-xl font-semibold">FAQ Populer</h2>
          <div className="mt-4 grid gap-3">
            {faqItems.map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--color-border)] p-4 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="internal-surface border-transparent p-5 shadow-none">
          <h2 className="m-0 text-xl font-semibold">Panduan Cepat</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
            <p className="m-0">1. Buat draft di menu Dataset Internal.</p>
            <p className="m-0">2. Lengkapi metadata dan resource minimum.</p>
            <p className="m-0">3. Ajukan dari Draft ke Submitted melalui halaman Review & Approval.</p>
            <p className="m-0">4. Walidata memeriksa, menyetujui, lalu mempublikasikan dataset.</p>
            <p className="m-0">5. Dataset Published otomatis dibaca ulang oleh halaman publik karena memakai shared source yang sama.</p>
            <p className="m-0">
              Butuh konteks publik? Buka <Link href="/dataset" className="font-semibold text-[var(--color-primary)]">katalog dataset</Link>.
            </p>
          </div>
        </Card>
      </section>
    </InternalShell>
  );
}


