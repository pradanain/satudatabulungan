import Link from "next/link";
import type { ActiveMenu } from "@/components/portal/portal-header";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <PortalPageShell activeMenu={activeMenu}>
      <section>
        <Card className="grid gap-5 bg-gradient-to-br from-[#f1efe8] to-[#e7effa] p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="blue">Status {code}</Badge>
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Portal Satu Data Bulungan</p>
          </div>
          <SectionHeading title={title} description={description} className="max-w-2xl" />
          {note ? <p className="m-0 text-sm text-[var(--color-muted)]">{note}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-lg">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            {secondaryAction ? (
              <Button asChild variant="secondary" className="rounded-lg">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </section>
    </PortalPageShell>
  );
}
