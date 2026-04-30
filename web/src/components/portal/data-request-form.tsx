"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { WalidataTarget } from "@/lib/data/layanan-data";
import { dataFormatOptions, requestPurposeOptions } from "@/lib/data/layanan-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubmissionState = {
  ok: boolean;
  message: string;
  ticketId?: string;
  targetLabel?: string;
  targetEmail?: string;
};

interface DataRequestFormProps {
  targets: WalidataTarget[];
}

const initialState = {
  requesterName: "",
  requesterEmail: "",
  requesterInstitution: "",
  requesterPhone: "",
  targetWalidataId: "",
  requestPurpose: "",
  requestedDataDescription: "",
  usagePurpose: "",
  periodStart: "",
  periodEnd: "",
  preferredFormat: "",
  additionalNotes: "",
};

export function DataRequestForm({ targets }: DataRequestFormProps) {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState | null>(null);

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === form.targetWalidataId),
    [form.targetWalidataId, targets],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionState(null);

    try {
      const response = await fetch("/api/data-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        ticketId?: string;
        targetLabel?: string;
        targetEmail?: string;
      };

      if (!response.ok || payload.success !== true) {
        setSubmissionState({
          ok: false,
          message: payload.message ?? "Permintaan gagal diproses. Silakan coba lagi.",
        });
        return;
      }

      setSubmissionState({
        ok: true,
        message: payload.message ?? "Permintaan data berhasil dikirim.",
        ticketId: payload.ticketId,
        targetLabel: payload.targetLabel,
        targetEmail: payload.targetEmail,
      });
      setForm(initialState);
    } catch {
      setSubmissionState({
        ok: false,
        message: "Terjadi kendala jaringan saat mengirim permintaan. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Nama Pemohon
          <Input
            name="requesterName"
            value={form.requesterName}
            onChange={(event) => setForm((current) => ({ ...current, requesterName: event.target.value }))}
            placeholder="Nama lengkap"
            required
            maxLength={120}
            autoComplete="name"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Email Pemohon
          <Input
            type="email"
            name="requesterEmail"
            value={form.requesterEmail}
            onChange={(event) => setForm((current) => ({ ...current, requesterEmail: event.target.value }))}
            placeholder="nama@instansi.go.id"
            required
            maxLength={160}
            autoComplete="email"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Instansi / Organisasi
          <Input
            name="requesterInstitution"
            value={form.requesterInstitution}
            onChange={(event) => setForm((current) => ({ ...current, requesterInstitution: event.target.value }))}
            placeholder="Contoh: Bappeda, Kampus, Media, Komunitas"
            required
            maxLength={160}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Nomor Kontak (WA/HP)
          <Input
            name="requesterPhone"
            value={form.requesterPhone}
            onChange={(event) => setForm((current) => ({ ...current, requesterPhone: event.target.value }))}
            placeholder="08xxxxxxxxxx"
            required
            maxLength={40}
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Tujuan Walidata
          <select
            name="targetWalidataId"
            value={form.targetWalidataId}
            onChange={(event) => setForm((current) => ({ ...current, targetWalidataId: event.target.value }))}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-(--color-text) shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
            required
          >
            <option value="">Pilih walidata tujuan</option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
          {selectedTarget ? (
            <span className="text-xs font-medium text-(--color-muted)">Permintaan akan diarahkan ke {selectedTarget.email}</span>
          ) : null}
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Tujuan Permintaan
          <select
            name="requestPurpose"
            value={form.requestPurpose}
            onChange={(event) => setForm((current) => ({ ...current, requestPurpose: event.target.value }))}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-(--color-text) shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
            required
          >
            <option value="">Pilih tujuan permintaan</option>
            {requestPurposeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        Data yang Diminta
        <textarea
          name="requestedDataDescription"
          value={form.requestedDataDescription}
          onChange={(event) => setForm((current) => ({ ...current, requestedDataDescription: event.target.value }))}
          placeholder="Tuliskan indikator, periode, wilayah, level agregasi, serta variabel utama yang dibutuhkan."
          required
          rows={5}
          maxLength={2500}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-(--color-text) shadow-sm outline-none transition placeholder:text-(--color-muted) focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        Tujuan Pemanfaatan Data
        <textarea
          name="usagePurpose"
          value={form.usagePurpose}
          onChange={(event) => setForm((current) => ({ ...current, usagePurpose: event.target.value }))}
          placeholder="Jelaskan untuk apa data digunakan, output yang dihasilkan, dan pihak pengguna data."
          required
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-(--color-text) shadow-sm outline-none transition placeholder:text-(--color-muted) focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Periode Mulai
          <Input
            type="date"
            name="periodStart"
            value={form.periodStart}
            onChange={(event) => setForm((current) => ({ ...current, periodStart: event.target.value }))}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Periode Akhir
          <Input
            type="date"
            name="periodEnd"
            value={form.periodEnd}
            onChange={(event) => setForm((current) => ({ ...current, periodEnd: event.target.value }))}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          Format Data Prioritas
          <select
            name="preferredFormat"
            value={form.preferredFormat}
            onChange={(event) => setForm((current) => ({ ...current, preferredFormat: event.target.value }))}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-(--color-text) shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
            required
          >
            <option value="">Pilih format</option>
            {dataFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        Catatan Tambahan (opsional)
        <textarea
          name="additionalNotes"
          value={form.additionalNotes}
          onChange={(event) => setForm((current) => ({ ...current, additionalNotes: event.target.value }))}
          placeholder="Tambahkan konteks tambahan, tenggat waktu, atau kebutuhan format khusus bila ada."
          rows={3}
          maxLength={1200}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-(--color-text) shadow-sm outline-none transition placeholder:text-(--color-muted) focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg)"
        />
      </label>

      <input type="text" name="company" value="" readOnly hidden autoComplete="off" tabIndex={-1} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="rounded-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {isSubmitting ? "Mengirim Permintaan..." : "Kirim Permintaan Data"}
        </Button>

        <p className="m-0 text-xs text-(--color-muted)">
          Dengan mengirim formulir ini, Anda menyatakan informasi yang diberikan benar dan dapat diverifikasi.
        </p>
      </div>

      {submissionState ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            submissionState.ok
              ? "border-[#b6dfc8] bg-[#f3fff7] text-[#1f5d3c]"
              : "border-[#f2c7c7] bg-[#fff7f7] text-[#8f2626]"
          }`}
        >
          <p className="m-0 font-semibold">{submissionState.message}</p>
          {submissionState.ok && submissionState.ticketId ? (
            <p className="mb-0 mt-2">
              Tiket: <strong>{submissionState.ticketId}</strong>
              {submissionState.targetLabel ? ` - Tujuan: ${submissionState.targetLabel}` : ""}
              {submissionState.targetEmail ? ` (${submissionState.targetEmail})` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

