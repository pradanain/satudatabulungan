"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function InternalPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Password Saat Ini
            <Input
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Password Baru
            <Input
              type="password"
              value={form.nextPassword}
              onChange={(event) => setForm((current) => ({ ...current, nextPassword: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Konfirmasi Password Baru
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
          </label>
        </div>
      </Card>

      {errorMessage ? (
        <p className="m-0 rounded-2xl border border-[#f2c4c4] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#9a1a1a]">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 rounded-2xl border border-[#c7e6cf] bg-[#eef9f1] px-4 py-3 text-sm font-semibold text-[#1f6a2a]">
          {message}
        </p>
      ) : null}

      <Button type="submit" className="w-fit rounded-full px-5" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan Password"}
      </Button>
    </form>
  );
}
