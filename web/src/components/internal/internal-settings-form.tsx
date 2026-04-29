"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PortalSettings } from "@/lib/types/internal";

export function InternalSettingsForm({ settings }: { settings: PortalSettings }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    portalName: settings.portalName,
    publicEmail: settings.publicEmail,
    publicPhone: settings.publicPhone,
    heroHeadline: settings.heroHeadline,
    heroSubheadline: settings.heroSubheadline,
    footerNote: settings.footerNote,
    notificationBanner: settings.notificationBanner,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/internal/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Gagal menyimpan pengaturan portal.");
      }

      setMessage("Pengaturan portal berhasil diperbarui.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan pengaturan portal.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Nama Portal
            <Input value={form.portalName} onChange={(event) => setForm((current) => ({ ...current, portalName: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Email Publik
            <Input value={form.publicEmail} onChange={(event) => setForm((current) => ({ ...current, publicEmail: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Telepon Publik
            <Input value={form.publicPhone} onChange={(event) => setForm((current) => ({ ...current, publicPhone: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f]">
            Hero Headline
            <Input value={form.heroHeadline} onChange={(event) => setForm((current) => ({ ...current, heroHeadline: event.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f] md:col-span-2">
            Hero Subheadline
            <Input
              value={form.heroSubheadline}
              onChange={(event) => setForm((current) => ({ ...current, heroSubheadline: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f] md:col-span-2">
            Banner Notifikasi
            <Input
              value={form.notificationBanner}
              onChange={(event) => setForm((current) => ({ ...current, notificationBanner: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#47413f] md:col-span-2">
            Catatan Footer
            <Input value={form.footerNote} onChange={(event) => setForm((current) => ({ ...current, footerNote: event.target.value }))} />
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
        {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
