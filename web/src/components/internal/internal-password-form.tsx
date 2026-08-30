"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Info, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { ToastNotification } from "@/components/ui/toast-popup";

function RequirementItem({ fulfilled, label }: { fulfilled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {fulfilled ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <X className="size-3.5 text-gray-300" />
      )}
      <span className={fulfilled ? "text-emerald-700" : "text-[var(--color-muted)]"}>
        {label}
      </span>
    </div>
  );
}

export function InternalPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  
  const [form, setForm] = useState({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });

  const reqLength = form.nextPassword.length >= 8;
  const reqCase = /[a-z]/.test(form.nextPassword) && /[A-Z]/.test(form.nextPassword);
  const reqNumberSymbol = /[0-9]/.test(form.nextPassword) || /[^A-Za-z0-9]/.test(form.nextPassword);
  const reqMatch = form.nextPassword !== "" && form.nextPassword === form.confirmPassword;
  
  const validRequirements = [reqLength, reqCase, reqNumberSymbol, reqMatch].filter(Boolean).length;
  const isFormValid = validRequirements === 4 && form.currentPassword !== "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) return;
    
    setIsPending(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/internal/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Gagal memperbarui password.");
      }

      setMessage("Password berhasil diperbarui.");
      setForm({
        currentPassword: "",
        nextPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memperbarui password.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4 bg-[var(--color-surface-soft)]/30">
          <ShieldCheck className="size-5 text-[var(--color-primary)]" />
          <h2 className="text-base font-bold">Keamanan Akun</h2>
        </div>
        
        <div className="p-5 space-y-5">
          <div className="rounded-lg bg-blue-50 p-3 flex gap-3 text-blue-700 border border-blue-100">
            <Info className="size-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Password hanya berlaku untuk sesi lokal pengembangan. Autentikasi final akan mengikuti backend produksi CKAN.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Password Saat Ini</label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Password Baru</label>
              <div className="relative">
                <Input
                  type={showNext ? "text" : "password"}
                  value={form.nextPassword}
                  onChange={(event) => setForm((current) => ({ ...current, nextPassword: event.target.value }))}
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNext(!showNext)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Konfirmasi Password Baru</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className={cn(form.confirmPassword.length > 0 && !reqMatch && "border-red-300 focus-visible:ring-red-200")}
              />
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="bg-[var(--color-surface-soft)]/50 rounded-lg p-4 border border-[var(--color-border)]">
            <p className="text-xs font-semibold mb-2 text-[var(--color-text)]">Kekuatan Password</p>
            <div className="flex gap-1 h-1.5 w-full mb-3">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    validRequirements >= step 
                      ? (validRequirements === 4 ? "bg-emerald-500" : validRequirements >= 2 ? "bg-blue-500" : "bg-orange-500") 
                      : "bg-gray-200"
                  )} 
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RequirementItem fulfilled={reqLength} label="Minimal 8 karakter" />
              <RequirementItem fulfilled={reqCase} label="Huruf besar & kecil" />
              <RequirementItem fulfilled={reqNumberSymbol} label="Angka atau simbol" />
              <RequirementItem fulfilled={reqMatch} label="Konfirmasi cocok" />
            </div>
          </div>
        </div>



        <div className="border-t border-[var(--color-border)] p-5">
          <Button type="submit" className="w-full" disabled={isPending || !isFormValid}>
            {isPending ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </div>
      </Card>
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={message} type="success" onClose={() => setMessage(null)} />
    </form>
  );
}
