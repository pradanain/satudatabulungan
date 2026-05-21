import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatusPageProps {
  code: string;
  title: string;
  description: string;
  note?: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  showBranding?: boolean;
}

export function StatusPage({
  code,
  title,
  description,
  note,
  primaryAction = { href: "/", label: "Kembali ke Beranda" },
  secondaryAction,
  showBranding = true,
}: StatusPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f7fc] p-6">
      {showBranding ? (
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-[var(--color-primary)]">PEMERINTAH KABUPATEN</span>
              <span className="text-xl font-bold leading-none tracking-tight text-[var(--color-text)]">BULUNGAN</span>
            </div>
          </Link>
        </div>
      ) : null}

      <div className="w-full max-w-3xl rounded-3xl border border-[#d2d9e4] bg-white p-8 shadow-[0_8px_32px_rgba(25,35,52,0.04)] sm:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Badge variant="blue" className="px-3 py-1 text-sm font-semibold">Status {code}</Badge>
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Portal Satu Data Bulungan</p>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-[var(--color-text)] mb-4">{title}</h1>
          <p className="text-lg text-[var(--color-muted)] mb-6 max-w-2xl">{description}</p>
          
          {note ? <p className="m-0 mb-8 text-sm text-[#738297] bg-[#f8fbff] p-4 rounded-xl border border-[#e1e7f0]">{note}</p> : null}
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-xl font-semibold">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            {secondaryAction ? (
              <Button asChild variant="outline" size="lg" className="rounded-xl font-semibold">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
