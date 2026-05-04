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
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="internal-surface overflow-hidden border-transparent shadow-none">
        <div className="internal-ornament-band h-8 border-b border-[var(--color-border)]" />
        <div className="flex h-full flex-col justify-between gap-6 p-6">
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
                className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left transition hover:border-[var(--color-accent-blue)]/25 hover:bg-[var(--color-surface-soft)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 text-base font-semibold">{account.label}</h2>
                  <Badge className="border-[var(--color-border)] bg-white text-[var(--color-text)]" variant="outline">
                    Demo Lokal
                  </Badge>
                </div>
                <p className="mb-0 mt-2 text-sm text-[var(--color-muted)]">{account.note}</p>
                <p className="mb-0 mt-3 text-xs text-[var(--color-muted)]">
                  {account.username} / {account.password}
                </p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="internal-surface border-transparent p-6 shadow-none sm:p-7">
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Masuk
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold">
          Masuk ke Portal Internal
        </h2>
        <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          Login ini membaca akun dari backend CKAN (dengan fallback akun lokal saat backend belum siap).
          Silakan pilih akun contoh di panel kiri atau isi manual.
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
