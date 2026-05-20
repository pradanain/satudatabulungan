"use client";

import { useState } from "react";
import { Settings, Paintbrush, Globe, Database, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PortalSettings } from "@/lib/types/internal";
import { cn } from "@/lib/utils/cn";
import { ToastNotification } from "@/components/ui/toast-popup";

export function InternalSettingsForm({ settings }: { settings: PortalSettings }) {
  const [activeTab, setActiveTab] = useState("umum");
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
    // Mock fields for UI completeness
    primaryColor: "#3a6ebe",
    seoDescription: "Portal Satu Data BISA Kabupaten Bulungan",
    ckanUrl: "http://localhost:5000",
    ckanApiKey: "xxxx-xxxx-xxxx-xxxx"
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
      
      // Auto dismiss success message
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan pengaturan portal.");
    } finally {
      setIsPending(false);
    }
  }

  const tabs = [
    { id: "umum", label: "Umum", icon: Settings },
    { id: "tema", label: "Tema & Tampilan", icon: Paintbrush },
    { id: "seo", label: "SEO", icon: Globe },
    { id: "integrasi", label: "Integrasi CKAN", icon: Database },
  ];

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="grid gap-6 xl:grid-cols-[250px_1fr] items-start">
        {/* Vertical Tabs */}
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                )}
              >
                <Icon className={cn("size-4", activeTab === tab.id ? "text-blue-600" : "text-gray-400")} />
                {tab.label}
              </button>
            );
          })}
        </Card>

        {/* Tab Content */}
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-soft)]/30">
            <h2 className="text-lg font-bold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="p-6">
            <div className={cn("grid gap-6", activeTab === "umum" ? "block" : "hidden")}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Nama Portal</label>
                  <Input value={form.portalName} onChange={(e) => setForm(c => ({ ...c, portalName: e.target.value }))} className="max-w-md" />
                  <p className="text-xs text-[var(--color-muted)] mt-1">Nama yang ditampilkan pada header dan footer.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Email Publik</label>
                  <Input type="email" value={form.publicEmail} onChange={(e) => setForm(c => ({ ...c, publicEmail: e.target.value }))} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Telepon Publik</label>
                  <Input type="tel" value={form.publicPhone} onChange={(e) => setForm(c => ({ ...c, publicPhone: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className={cn("grid gap-6", activeTab === "tema" ? "block" : "hidden")}>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Warna Utama (Primary Color)</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={form.primaryColor} onChange={(e) => setForm(c => ({ ...c, primaryColor: e.target.value }))} className="h-10 w-20 cursor-pointer rounded border border-gray-200" />
                    <Input value={form.primaryColor} onChange={(e) => setForm(c => ({ ...c, primaryColor: e.target.value }))} className="w-32 font-mono uppercase" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Hero Headline</label>
                  <Input value={form.heroHeadline} onChange={(e) => setForm(c => ({ ...c, heroHeadline: e.target.value }))} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Hero Subheadline</label>
                  <Textarea value={form.heroSubheadline} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(c => ({ ...c, heroSubheadline: e.target.value }))} rows={3} className="resize-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Banner Notifikasi Global</label>
                  <Input value={form.notificationBanner} onChange={(e) => setForm(c => ({ ...c, notificationBanner: e.target.value }))} placeholder="Kosongkan jika tidak ada banner aktif" />
                  <p className="text-xs text-[var(--color-muted)] mt-1">Teks ini akan muncul di atas header portal publik.</p>
                </div>
              </div>
            </div>

            <div className={cn("grid gap-6", activeTab === "seo" ? "block" : "hidden")}>
               <div className="space-y-6">
                 <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Deskripsi SEO (Meta Description)</label>
                  <Textarea value={form.seoDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(c => ({ ...c, seoDescription: e.target.value }))} rows={3} className="resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Catatan Footer</label>
                  <Textarea value={form.footerNote} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(c => ({ ...c, footerNote: e.target.value }))} rows={4} className="resize-none" />
                </div>
               </div>
            </div>

            <div className={cn("grid gap-6", activeTab === "integrasi" ? "block" : "hidden")}>
               <div className="space-y-6 max-w-lg">
                 <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200 text-sm">
                   Perubahan URL atau API Key CKAN dapat menyebabkan portal terputus dari backend.
                 </div>
                 
                 <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">CKAN Base URL</label>
                  <Input value={form.ckanUrl} onChange={(e) => setForm(c => ({ ...c, ckanUrl: e.target.value }))} className="font-mono text-sm" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">API Key Internal</label>
                  <Input type="password" value={form.ckanApiKey} onChange={(e) => setForm(c => ({ ...c, ckanApiKey: e.target.value }))} className="font-mono text-sm" />
                </div>
               </div>
            </div>
          </div>
          
          <div className="border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-soft)]/30 flex items-center justify-end">
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="size-4" />
              {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </Card>
      </div>
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={message} type="success" onClose={() => setMessage(null)} />
    </form>
  );
}
