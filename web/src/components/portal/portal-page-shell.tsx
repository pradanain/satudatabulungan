import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { type ActiveMenu, PortalHeader } from "@/components/portal/portal-header";
import { PortalFooter } from "@/components/portal/portal-footer";

interface PortalPageShellProps {
  activeMenu?: ActiveMenu;
  children: ReactNode;
  mainClassName?: string;
}

export function PortalPageShell({ activeMenu = "none", children, mainClassName }: PortalPageShellProps) {
  return (
    <div className="page-shell">
      <PortalHeader activeMenu={activeMenu} />
      <main className={cn("portal-shell flex min-h-0 flex-1 flex-col gap-6 py-6 sm:gap-7 sm:py-7", mainClassName)}>
        {children}
      </main>
      <PortalFooter />
    </div>
  );
}
