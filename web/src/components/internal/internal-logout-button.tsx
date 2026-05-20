"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { cn } from "@/lib/utils/cn";

export interface InternalLogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  iconOnly?: boolean;
}

export function InternalLogoutButton({ className, variant = "secondary", iconOnly = false }: InternalLogoutButtonProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  async function handleLogout() {
    setShowConfirmLogout(false);
    await fetch("/api/internal/auth/logout", {
      method: "POST",
    });

    window.location.href = "/internal";
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : "sm"}
        className={cn(iconOnly ? "rounded-lg" : "rounded-full", className)}
        onClick={() => setShowConfirmLogout(true)}
        disabled={isPending}
        aria-label="Logout"
      >
        <LogOut className={cn("size-4", !iconOnly && "mr-2")} />
        {!iconOnly && (isPending ? "Keluar..." : "Logout")}
      </Button>

      <ConfirmationDialog
        open={showConfirmLogout}
        onOpenChange={setShowConfirmLogout}
        title="Logout dari Dashboard?"
        description="Apakah Anda yakin ingin keluar dari dashboard internal Satu Data Bulungan?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
}
