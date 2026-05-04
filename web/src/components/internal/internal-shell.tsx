import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Archive,
  Bell,
  Building2,
  ChevronDown,
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

type NavGroup = {
  id: "operasional" | "masterData" | "akunSistem";
  label: string;
  keys: InternalNavKey[];
};

const navGroups: NavGroup[] = [
  {
    id: "operasional",
    label: "Operasional",
    keys: ["dashboard", "datasets", "review", "monitoring", "notifications", "workflowHistory", "archive"],
  },
  {
    id: "masterData",
    label: "Master Data",
    keys: ["topics", "organizations", "users"],
  },
  {
    id: "akunSistem",
    label: "Akun & Sistem",
    keys: ["profile", "settings", "integrations", "help"],
  },
];

const quickAccessByRole: Record<InternalSession["role"], InternalNavKey[]> = {
  admin: ["dashboard", "datasets", "review", "monitoring", "users"],
  walidata: ["dashboard", "datasets", "review", "monitoring", "notifications"],
  operator_opd: ["dashboard", "datasets", "review", "notifications", "workflowHistory"],
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
  const visibleNavSet = new Set(navKeys);
  const groupedNav = navGroups
    .map((group) => ({
      ...group,
      keys: group.keys.filter((key) => visibleNavSet.has(key)),
    }))
    .filter((group) => group.keys.length > 0);
  const quickAccessKeys = quickAccessByRole[session.role]
    .filter((key) => visibleNavSet.has(key))
    .slice(0, 4);

  return (
    <div className="internal-page-bg">
      <div className="internal-shell py-4 sm:py-6">
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <Card className="internal-surface sticky top-4 overflow-hidden border-transparent shadow-none">
              <div className="internal-ornament-band border-b border-[var(--color-border)] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Image
                    src="/assets/brand/logos/bulungan-bisa-logo.png"
                    alt="Bulungan Bisa"
                    width={140}
                    height={36}
                    className="h-auto w-auto max-h-9"
                  />
                  <Badge className="border-[var(--color-border)] bg-white text-[var(--color-text)]" variant="outline">
                    {internalRoleLabels[session.role]}
                  </Badge>
                </div>
                <p className="mb-0 mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                  Navigasi kerja internal untuk operasional data, review, dan monitoring.
                </p>
              </div>

              <div className="px-3 pb-3 pt-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    Akun Aktif
                  </p>
                  <p className="mb-0 mt-1 text-base font-semibold">{session.name}</p>
                  <p className="mb-0 mt-0.5 text-sm text-[var(--color-muted)]">{session.organizationName}</p>
                </div>

                {quickAccessKeys.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
                    <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                      Menu Cepat
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {quickAccessKeys.map((key) => {
                        const Icon = iconByKey[key];
                        return (
                          <Link
                            key={`quick-${key}`}
                            href={getHref(key)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]",
                              activeKey === key &&
                                "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
                            )}
                          >
                            <Icon className="size-3.5" />
                            {internalNavLabels[key]}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <nav aria-label="Navigasi internal" className="mt-3 grid gap-2">
                  <div className="max-h-[calc(100dvh-420px)] overflow-y-auto pr-1">
                    <div className="grid gap-2">
                      {groupedNav.map((group) => (
                        <details
                          key={group.id}
                          open={group.keys.includes(activeKey)}
                          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white [&_summary::-webkit-details-marker]:hidden"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">
                              {group.label}
                            </span>
                            <div className="flex items-center gap-2 text-[var(--color-muted)]">
                              <span className="rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[11px] font-semibold">
                                {group.keys.length}
                              </span>
                              <ChevronDown className="size-4" />
                            </div>
                          </summary>
                          <div className="grid gap-1 border-t border-[var(--color-border)] p-2">
                            {group.keys.map((key) => {
                              const Icon = iconByKey[key];
                              return (
                                <Link
                                  key={key}
                                  href={getHref(key)}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]",
                                    activeKey === key &&
                                      "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
                                  )}
                                >
                                  <Icon className="size-4" />
                                  <span>{internalNavLabels[key]}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>

              <div className="border-t border-[var(--color-border)] px-4 py-3">
                <InternalLogoutButton />
              </div>
            </Card>
          </aside>

          <div className="min-w-0">
            <Card className="internal-surface overflow-hidden border-transparent p-3.5 shadow-none sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/assets/brand/logos/lambang-bulungan.png"
                    alt="Lambang Bulungan"
                    width={40}
                    height={40}
                    className="size-10 rounded-xl border border-[var(--color-border)] bg-white p-1.5"
                  />
                  <div>
                    <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                      Ruang Kerja Internal
                    </p>
                    <p className="m-0 mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {session.name} - {internalRoleLabels[session.role]} - {session.organizationName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{internalNavLabels[activeKey]}</Badge>
                  {canAccessNav(session.role, "notifications") ? (
                    <Button asChild variant="secondary" size="sm" className="rounded-full">
                      <Link href="/internal/notifications">Notifikasi</Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="secondary" size="sm" className="rounded-full">
                    <Link href="/dataset">Portal Publik</Link>
                  </Button>
                  <div className="xl:hidden">
                    <InternalLogoutButton />
                  </div>
                </div>
              </div>

              <nav aria-label="Navigasi internal mobile" className="mt-3 grid gap-2 xl:hidden">
                {quickAccessKeys.length > 0 ? (
                  <details
                    open
                    className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                        Menu Cepat
                      </span>
                      <ChevronDown className="size-4 text-[var(--color-muted)]" />
                    </summary>
                    <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] p-2">
                      {quickAccessKeys.map((key) => {
                        const Icon = iconByKey[key];
                        return (
                          <Link
                            key={`mobile-quick-${key}`}
                            href={getHref(key)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]",
                              activeKey === key &&
                                "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
                            )}
                          >
                            <Icon className="size-3.5" />
                            {internalNavLabels[key]}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                ) : null}

                <details className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                      Semua Menu
                    </span>
                    <ChevronDown className="size-4 text-[var(--color-muted)]" />
                  </summary>
                  <div className="grid gap-2 border-t border-[var(--color-border)] p-2">
                    {groupedNav.map((group) => (
                      <details
                        key={`mobile-${group.id}`}
                        open={group.keys.includes(activeKey)}
                        className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] [&_summary::-webkit-details-marker]:hidden"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                            {group.label}
                          </span>
                          <span className="rounded-full border border-[var(--color-border)] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-muted)]">
                            {group.keys.length}
                          </span>
                        </summary>
                        <div className="grid gap-1 border-t border-[var(--color-border)] p-2">
                          {group.keys.map((key) => {
                            const Icon = iconByKey[key];
                            return (
                              <Link
                                key={`mobile-${key}`}
                                href={getHref(key)}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]",
                                  activeKey === key &&
                                    "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
                                )}
                              >
                                <Icon className="size-4" />
                                {internalNavLabels[key]}
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              </nav>
            </Card>

            <div className="mt-4 grid gap-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
