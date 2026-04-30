import Link from "next/link";
import type { ActiveMenu } from "@/components/portal/portal-header";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatusPageProps {
  code: string;
  title: string;
  description: string;
  note?: string;
  activeMenu?: ActiveMenu;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
}

export function StatusPage({
  code,
  title,
  description,
  note,
  activeMenu = "none",
  primaryAction = { href: "/", label: "Kembali ke Beranda" },
  secondaryAction,
}: StatusPageProps) {
  return (
    <PortalPageShell activeMenu={activeMenu} mainClassName="gap-0 py-0 sm:py-0">
      <section className="flex min-h-full flex-1 items-center">
        <div className="w-full border border-(--color-border) bg-[linear-gradient(122deg,#f6f4ee_0%,#eef4fc_52%,#e7effa_100%)] px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="blue">Status {code}</Badge>
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Portal Satu Data Bulungan</p>
            </div>
            <SectionHeading title={title} description={description} className="mt-5 max-w-2xl" />
            {note ? <p className="m-0 mt-4 text-sm text-[var(--color-muted)]">{note}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-lg">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
              {secondaryAction ? (
                <Button asChild variant="secondary" className="rounded-lg">
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </PortalPageShell>
  );
}
