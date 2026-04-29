"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InternalLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    await fetch("/api/internal/auth/logout", {
      method: "POST",
    });

    startTransition(() => {
      router.push("/internal");
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={handleLogout} disabled={isPending}>
      <LogOut className="mr-2 size-4" />
      {isPending ? "Keluar..." : "Logout"}
    </Button>
  );
}
