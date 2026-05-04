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
      <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="internal-field-label">
            Nama Portal
            <Input value={form.portalName} onChange={(event) => setForm((current) => ({ ...current, portalName: event.target.value }))} />
          </label>
          <label className="internal-field-label">
            Email Publik
            <Input value={form.publicEmail} onChange={(event) => setForm((current) => ({ ...current, publicEmail: event.target.value }))} />
          </label>
          <label className="internal-field-label">
            Telepon Publik
            <Input value={form.publicPhone} onChange={(event) => setForm((current) => ({ ...current, publicPhone: event.target.value }))} />
          </label>
          <label className="internal-field-label">
            Hero Headline
            <Input value={form.heroHeadline} onChange={(event) => setForm((current) => ({ ...current, heroHeadline: event.target.value }))} />
          </label>
          <label className="internal-field-label md:col-span-2">
            Hero Subheadline
            <Input
              value={form.heroSubheadline}
              onChange={(event) => setForm((current) => ({ ...current, heroSubheadline: event.target.value }))}
            />
          </label>
          <label className="internal-field-label md:col-span-2">
            Banner Notifikasi
            <Input
              value={form.notificationBanner}
              onChange={(event) => setForm((current) => ({ ...current, notificationBanner: event.target.value }))}
            />
          </label>
          <label className="internal-field-label md:col-span-2">
            Catatan Footer
            <Input value={form.footerNote} onChange={(event) => setForm((current) => ({ ...current, footerNote: event.target.value }))} />
          </label>
        </div>
      </Card>

      {errorMessage ? (
        <p className="internal-alert-error">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="internal-alert-success">
          {message}
        </p>
      ) : null}

      <Button type="submit" className="w-fit rounded-full px-5" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
