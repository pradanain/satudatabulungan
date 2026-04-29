import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <PortalPageShell>
      <section>
        <Card className="grid justify-items-start gap-3 p-6 sm:p-7">
          <h1 className="m-0 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight">
            Dataset tidak ditemukan
          </h1>
          <p className="m-0 text-sm text-[var(--color-muted)] sm:text-base">
            Halaman yang diminta belum tersedia atau slug dataset tidak valid.
          </p>
          <Button asChild variant="secondary" className="rounded-lg">
            <Link href="/dataset">Kembali ke Katalog</Link>
          </Button>
        </Card>
      </section>
    </PortalPageShell>
  );
}
