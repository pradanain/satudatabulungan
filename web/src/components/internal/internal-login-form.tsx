"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const demoAccounts = [
  {
    label: "Sekretariat",
    username: "sekretariat.bappeda",
    password: "bulunganbisa",
    note: "Koordinasi, monitoring, dan evaluasi data lintas OPD.",
  },
  {
    label: "Walidata",
    username: "walidata.dkip",
    password: "bulunganbisa",
    note: "Validasi, approval, publikasi, kelola users, settings, dan integrasi.",
  },
  {
    label: "Produsen",
    username: "operator.dinkes",
    password: "bulunganbisa",
    note: "Input data OPD, draft dataset, submit review, dan kelola resource.",
  },
];

export function InternalLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const response = await fetch("/api/internal/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !data.success) {
      setErrorMessage(data.error ?? "Login internal gagal.");
      return;
    }

    window.location.href = "/internal/dashboard";
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:grid md:grid-cols-2">
      {/* Left Panel: Decorative & Institutional (Footer Style) */}
      <div className="relative hidden flex-col justify-between p-12 md:flex overflow-hidden bg-[radial-gradient(circle_at_top,#142752_0%,#0d1733_44%,#0a132b_100%)]">
        {/* Left Motif Band */}
        <div 
          className="absolute inset-y-0 left-0 z-0 w-[8%] opacity-[0.18]"
          style={{ 
            backgroundImage: 'url("/assets/brand/motifs/motif-3-suku-alt-soft.webp")',
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'left center',
            backgroundSize: '100% auto'
          }}
        />

        <div className="relative z-10">
          <div className="mb-14 flex items-start gap-4">
            <img 
              src="/assets/brand/logos/lambang-bulungan.png" 
              alt="Logo Bulungan" 
              className="h-20 w-auto"
            />
            <div className="pt-1">
              <p className="m-0 font-[family-name:var(--font-heading)] text-base font-semibold uppercase leading-tight tracking-[0.08em] text-[var(--color-accent-gold)]">
                Pemerintah Kabupaten
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-heading)] text-4xl font-semibold uppercase leading-[0.92] tracking-tight text-white sm:text-5xl">
                Bulungan
              </h1>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm border border-white/10">
              Akses Internal
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Selamat Datang di <br /> Portal Satu Data!
            </h2>
            <div className="h-1.5 w-16 bg-[var(--color-accent-gold)] rounded-full" />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Platform terpadu untuk pengelolaan, integrasi, dan analisis data strategis guna mendukung pengambilan keputusan yang berbasis data.
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8">
          <p className="text-xs font-medium text-white/50">
            © 2026 Pemerintah Kabupaten Bulungan.
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Dashboard Portal</h2>
          <p className="mt-2 text-base text-[var(--color-muted)]">
            Silakan masukkan email atau username dan password Anda.
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleLogin}>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Email atau Username
            </label>
            <Input
              className="h-11 border-[var(--color-border)] bg-white px-4 focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Masukkan email atau username"
              required
              autoComplete="username"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                className="h-11 border-[var(--color-border)] bg-white px-4 pr-10 focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--color-muted)]">
              <input type="checkbox" className="accent-[var(--color-primary)] rounded" />
              Ingat saya
            </label>
            <a href="#" className="font-semibold text-[var(--color-primary)] hover:underline">
              Bantuan akses?
            </a>
          </div>

          <Button
            type="submit"
            className="h-11 rounded-xl bg-[var(--color-primary)] font-bold text-white transition-all hover:bg-[#8f1717] active:scale-[0.98]"
            disabled={isPending}
          >
            {isPending ? "Memproses..." : "Masuk"}
          </Button>

          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-white px-3 text-[var(--color-muted)] font-bold">Opsi Demo</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => setForm({ username: account.username, password: account.password })}
                  className="rounded-lg border border-[var(--color-border)] py-2 text-[9px] font-bold uppercase tracking-tight text-[var(--color-muted)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {account.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
