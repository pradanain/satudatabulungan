"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const demoAccounts = [
  {
    label: "Admin",
    username: "admin@bulungan.go.id",
    password: "AdminBulungan#2026",
    note: "Akses penuh ke seluruh modul, users, settings, dan monitoring.",
  },
  {
    label: "Walidata DKIP",
    username: "walidata.dkip@bulungan.go.id",
    password: "WalidataDKIP#2026",
    note: "Fokus review metadata, approval, publikasi, dan monitoring kualitas.",
  },
  {
    label: "Operator Dinkes",
    username: "operator.kesehatan@bulungan.go.id",
    password: "OperatorDinkes#2026",
    note: "Fokus draft, edit, submit ulang, dan melihat notifikasi OPD.",
  },
];

export function InternalLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    username: "admin@bulungan.go.id",
    password: "AdminBulungan#2026",
  });
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

    startTransition(() => {
      router.push("/internal/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden border-transparent bg-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent-blue)] to-[var(--color-primary)]" />
        <div className="flex h-full flex-col justify-between gap-6 p-7 sm:p-8">
          <div>
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Portal Internal
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight sm:text-4xl">
              Satu Data Bulungan
            </h1>
            <p className="mb-0 mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
              Gunakan akun portal internal untuk mengelola dataset, metadata, review, dan workflow OPD
              sesuai peran yang tersimpan di backend CKAN.
            </p>
          </div>

          <div className="grid gap-3">
            {demoAccounts.map((account) => (
                <button
                key={account.label}
                type="button"
                onClick={() => setForm({ username: account.username, password: account.password })}
                className="group relative rounded-2xl border border-[var(--color-border)] bg-white/50 p-4 text-left transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                    {account.label}
                  </h2>
                  <Badge className="border-[var(--color-border)] bg-white/80 text-[var(--color-text)] shadow-xs" variant="outline">
                    Demo Lokal
                  </Badge>
                </div>
                <p className="mb-0 mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{account.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-[var(--color-primary)]/40" />
                  <p className="mb-0 text-xs font-medium text-[var(--color-muted)]/80">
                    {account.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden border-transparent bg-white/90 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl sm:p-9">
        <div className="absolute right-0 top-0 size-32 translate-x-12 -translate-y-12 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.25em] text-[var(--color-primary)]">
          Masuk
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Akses Workspace
        </h2>
        <p className="mb-0 mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          Masuk untuk mengelola dataset publikasi. Sistem terhubung ke sinkronisasi draf CKAN.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
          <label className="internal-field-label">
            Username
            <Input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="admin"
            />
          </label>

          <label className="internal-field-label">
            Password
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Masukkan password"
            />
          </label>

          {errorMessage ? (
            <p className="internal-alert-error">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="rounded-full px-5" disabled={isPending}>
              {isPending ? "Masuk..." : "Masuk ke Dashboard"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-5"
              onClick={() =>
                setForm({
                  username: "walidata.dkip@bulungan.go.id",
                  password: "WalidataDKIP#2026",
                })
              }
            >
              Gunakan Akun Walidata
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
