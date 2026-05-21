"use client";

import { type ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Archive,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Database,
  History,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Newspaper,
  PlugZap,
  Settings,
  Tags,
  UserCircle2,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import { InternalLogoutButton } from "@/components/internal/internal-logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InternalNavKey, InternalSession } from "@/lib/types/internal";
import {
  canAccessNav,
  getVisibleNavKeys,
  internalNavLabels,
  internalRoleLabels,
  getDisplayOrganizationName,
} from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  berita: Newspaper,
  bukuDigital: BookOpen,
  infografis: ImageIcon,
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
    keys: ["dashboard", "datasets", "review", "monitoring", "berita", "bukuDigital", "infografis"],
  },
  {
    id: "masterData",
    label: "Master Data",
    keys: ["topics", "organizations", "users"],
  },
  {
    id: "akunSistem",
    label: "Akun & Sistem",
    keys: ["integrations"],
  },
];

function getHref(key: InternalNavKey): string {
  switch (key) {
    case "dashboard": return "/internal/dashboard";
    case "datasets": return "/internal/datasets";
    case "review": return "/internal/workflow";
    case "monitoring": return "/internal/monitoring";
    case "users": return "/internal/users";
    case "archive": return "/internal/archive";
    case "organizations": return "/internal/organizations";
    case "topics": return "/internal/topics";
    case "notifications": return "/internal/notifications";
    case "workflowHistory": return "/internal/workflow-history";
    case "settings": return "/internal/settings";
    case "profile": return "/internal/profile";
    case "help": return "/internal/help";
    case "integrations": return "/internal/integrations";
    case "berita": return "/internal/berita";
    case "bukuDigital": return "/internal/buku-digital";
    case "infografis": return "/internal/infografis";
    default: return "/internal/dashboard";
  }
}

export function InternalShell({ session, activeKey, children }: InternalShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem("internal-sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("internal-sidebar-collapsed", String(newState));
  };

  const navKeys = getVisibleNavKeys(session.role);
  const visibleNavSet = new Set(navKeys);
  const groupedNav = navGroups
    .map((group) => ({
      ...group,
      keys: group.keys.filter((key) => visibleNavSet.has(key)),
    }))
    .filter((group) => group.keys.length > 0);

  // Prevent hydration mismatch on initial render for layout styles
  if (!mounted) {
    return null;
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Sidebar Header */}
      <div className={cn("internal-ornament-band flex h-16 shrink-0 items-center border-b border-[var(--color-border)] px-4", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <Image
            src="/assets/brand/logos/bulungan-bisa-logo.png"
            alt="Bulungan Bisa"
            width={120}
            height={30}
            className="h-auto w-auto max-h-8"
          />
        )}
        {isCollapsed && (
          <Image
            src="/assets/brand/logos/lambang-bulungan.png"
            alt="Lambang Bulungan"
            width={32}
            height={32}
            className="size-8"
          />
        )}
      </div>

      {/* Sidebar User Info removed from here and moved to topbar */}

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto px-3", isCollapsed ? "pt-4" : "py-4")}>
        <TooltipProvider delayDuration={0}>
          <nav aria-label="Navigasi internal" className="grid gap-4">
            {groupedNav.map((group) => (
              <div key={group.id} className="grid gap-1">
                {!isCollapsed && (
                  <div className="mb-1 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                      {group.label}
                    </span>
                  </div>
                )}
                {group.keys.map((key) => {
                  const Icon = iconByKey[key];
                  const isActive = activeKey === key;
                  const label = key === "review" && session.role === "produsen"
                    ? "Pengajuan Dataset"
                    : internalNavLabels[key];

                  const navItem = (
                    <Link
                      href={getHref(key)}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "group flex items-center rounded-lg border border-transparent transition-all duration-200 hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]",
                        isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2",
                        isActive
                          ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-semibold shadow-sm"
                          : "text-[var(--color-muted)] font-medium"
                      )}
                    >
                      <Icon className={cn(
                        "shrink-0 transition-transform group-hover:scale-110",
                        isCollapsed ? "size-5" : "size-4",
                        isActive && "text-[var(--color-primary)]"
                      )} />
                      {!isCollapsed && <span className="truncate">{label}</span>}
                      {/* Optional active indicator for collapsed state */}
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-md bg-[var(--color-primary)]" />
                      )}
                    </Link>
                  );

                  return isCollapsed ? (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        {navItem}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-4">
                        {label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={key}>{navItem}</div>
                  );
                })}
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </div>

      {/* Footer / Logout */}
      <div className="shrink-0 border-t border-[var(--color-border)] p-4">
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <InternalLogoutButton variant="ghost" className="h-10 w-10 text-red-600 hover:bg-red-50 hover:text-red-700" iconOnly />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold text-red-600">Keluar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <InternalLogoutButton variant="destructive" className="w-full justify-center" />
        )}
      </div>
    </div>
  );

  return (
    <div className="internal-page-bg flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden border-r border-[var(--color-border)] bg-white transition-all duration-300 xl:block sticky top-0 h-screen",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] -translate-x-full border-r border-[var(--color-border)] bg-white transition-transform duration-300 xl:hidden",
          isMobileOpen && "translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden -ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Toggle Menu"
            >
              <Menu className="size-5" />
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden xl:flex -ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="size-5" />
            </Button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
                <span>Portal Internal</span>
                <ChevronRight className="size-3.5 opacity-50" />
                <span className="text-[var(--color-primary)]">
                  {activeKey === "review" && session.role === "produsen" ? "Pengajuan Dataset" : internalNavLabels[activeKey]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {canAccessNav(session.role, "help") && (
              <Button asChild variant="ghost" size="icon" className="text-[var(--color-muted)] hover:text-[var(--color-text)] relative">
                <Link href="/internal/help" aria-label="Bantuan & FAQ">
                  <CircleHelp className="size-5" />
                </Link>
              </Button>
            )}
            {canAccessNav(session.role, "notifications") && (
              <Button asChild variant="ghost" size="icon" className="text-[var(--color-muted)] hover:text-[var(--color-text)] relative">
                <Link href="/internal/notifications" aria-label="Notifikasi">
                  <Bell className="size-5" />
                  {/* Fake badge for demonstration */}
                  <span className="absolute right-2 top-2 flex size-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </Link>
              </Button>
            )}
            <Link href="/internal/profile" className="ml-1 flex items-center gap-2.5 rounded-full p-1 pr-3 hover:bg-[var(--color-surface-soft)] transition-colors">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <UserCircle2 className="size-5" />
              </div>
              <div className="hidden flex-col items-start sm:flex text-left max-w-[150px] lg:max-w-[200px]">
                <span className="text-sm font-semibold text-[var(--color-text)] truncate w-full">{getDisplayOrganizationName(session)}</span>
                <span className="text-[11px] text-[var(--color-muted)] font-medium truncate w-full">{internalRoleLabels[session.role]}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="w-full flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
