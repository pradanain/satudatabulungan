import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Archive,
  Bell,
  Building2,
  CircleHelp,
  ClipboardCheck,
  Database,
  History,
  LayoutDashboard,
  PlugZap,
  Settings,
  Tags,
  UserCircle2,
  Users,
} from "lucide-react";
import { InternalLogoutButton } from "@/components/internal/internal-logout-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InternalNavKey, InternalSession } from "@/lib/types/internal";
import {
  canAccessNav,
  getVisibleNavKeys,
  internalNavLabels,
  internalRoleLabels,
} from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";

const iconByKey: Record<InternalNavKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  datasets: Database,
  review: ClipboardCheck,
  monitoring: Activity,
  users: Users,
  archive: Archive,
  organizations: Building2,
  topics: Tags,
  notifications: Bell,
  workflowHistory: History,
  settings: Settings,
  profile: UserCircle2,
  help: CircleHelp,
  integrations: PlugZap,
};

type InternalShellProps = {
  session: InternalSession;
  activeKey: InternalNavKey;
  children: ReactNode;
};

function getHref(key: InternalNavKey): string {
  switch (key) {
    case "dashboard":
      return "/internal/dashboard";
    case "datasets":
      return "/internal/datasets";
    case "review":
      return "/internal/workflow";
    case "monitoring":
      return "/internal/monitoring";
    case "users":
      return "/internal/users";
    case "archive":
      return "/internal/archive";
    case "organizations":
      return "/internal/organizations";
    case "topics":
      return "/internal/topics";
    case "notifications":
      return "/internal/notifications";
    case "workflowHistory":
      return "/internal/workflow-history";
    case "settings":
      return "/internal/settings";
    case "profile":
      return "/internal/profile";
    case "help":
      return "/internal/help";
    case "integrations":
      return "/internal/integrations";
    default:
      return "/internal/dashboard";
  }
}

export function InternalShell({ session, activeKey, children }: InternalShellProps) {
  const navKeys = getVisibleNavKeys(session.role);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f6fb_0%,#eef2f8_100%)]">
      <div className="shell py-4 sm:py-6">
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <Card className="sticky top-6 overflow-hidden bg-[#241d1d] text-white">
              <div className="border-b border-white/10 bg-[url('/assets/brand/motifs/motif-3-suku.png')] bg-size-[auto_100%] bg-repeat-x px-5 py-5">
                <Image
                  src="/assets/brand/logos/bulungan-bisa-logo.png"
                  alt="Bulungan Bisa"
                  width={150}
                  height={40}
                  className="h-auto w-auto max-h-10 brightness-[4]"
                />
                <p className="mb-0 mt-4 text-sm leading-relaxed text-white/70">
                  Panel internal untuk dataset, metadata, review, dan operasional portal Satu Data Bulungan.
                </p>
              </div>

              <div className="px-3 py-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="m-0 text-xs uppercase tracking-[0.18em] text-white/50">Akun Aktif</p>
                  <p className="mb-0 mt-2 text-lg font-semibold">{session.name}</p>
                  <p className="mb-0 mt-1 text-sm text-white/70">{session.organizationName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="border-white/10 bg-white/10 text-white" variant="outline">
                      {internalRoleLabels[session.role]}
                    </Badge>
                  </div>
                </div>

                <nav aria-label="Navigasi internal" className="mt-4 grid gap-1">
                  {navKeys.map((key) => {
                    const Icon = iconByKey[key];
                    return (
                      <Link
                        key={key}
                        href={getHref(key)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white/68 transition hover:bg-white/8 hover:text-white",
                          activeKey === key && "bg-white text-[#241d1d] shadow-[0_10px_25px_rgba(0,0,0,0.2)]",
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{internalNavLabels[key]}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/10 px-5 py-4">
                <InternalLogoutButton />
              </div>
            </Card>
          </aside>

          <div className="min-w-0">
            <Card className="overflow-hidden bg-white/95 p-4 shadow-[0_20px_40px_rgba(33,41,52,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/brand/logos/lambang-bulungan.png"
                    alt="Lambang Bulungan"
                    width={48}
                    height={48}
                    className="size-12 rounded-2xl border border-[var(--color-border)] bg-white p-2"
                  />
                  <div>
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                      Internal Portal
                    </p>
                    <h2 className="m-0 mt-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
                      {internalNavLabels[activeKey]}
                    </h2>
                    <p className="m-0 mt-1 text-sm text-[var(--color-muted)]">
                      {session.name} • {session.organizationName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canAccessNav(session.role, "notifications") ? (
                    <Button asChild variant="secondary" size="sm" className="rounded-full">
                      <Link href="/internal/notifications">Notifikasi</Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="secondary" size="sm" className="rounded-full">
                    <Link href="/dataset">Lihat Portal Publik</Link>
                  </Button>
                  <div className="xl:hidden">
                    <InternalLogoutButton />
                  </div>
                </div>
              </div>

              <nav
                aria-label="Navigasi internal mobile"
                className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden"
              >
                {navKeys.map((key) => {
                  const Icon = iconByKey[key];
                  return (
                    <Link
                      key={`mobile-${key}`}
                      href={getHref(key)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
                        activeKey === key && "border-[var(--color-primary)] bg-[#fff3f3] text-[var(--color-primary)]",
                      )}
                    >
                      <Icon className="size-4" />
                      {internalNavLabels[key]}
                    </Link>
                  );
                })}
              </nav>
            </Card>

            <div className="mt-4 grid gap-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
