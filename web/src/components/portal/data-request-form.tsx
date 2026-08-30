"use client";

import { FormEvent, useMemo, useState } from "react";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { Loader2, Send } from "lucide-react";
import { dataFormatOptions, requestPurposeOptions } from "@/lib/data/layanan-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubmissionState = {
  ok: boolean;
  message: string;
  ticketId?: string;
  targetLabel?: string;
  targetEmail?: string;
};

type FormState = {
  requesterName: string;
  requesterEmail: string;
  requesterInstitution: string;
  requesterPhone: string;
  age: string;
  gender: string;
  education: string;
  job: string;
  requestPurpose: string;
  requestedDataDescription: string;
  usagePurpose: string;
  periodStart: string;
  periodYear: string;
  preferredFormat: string;
  additionalNotes: string;
};

const initialState: FormState = {
  requesterName: "",
  requesterEmail: "",
  requesterInstitution: "",
  requesterPhone: "",
  age: "",
  gender: "",
  education: "",
  job: "",
  requestPurpose: requestPurposeOptions[0],
  requestedDataDescription: "",
  usagePurpose: "",
  periodStart: "",
  periodYear: "",
  preferredFormat: "",
  additionalNotes: "",
};

const genderOptions = ["Laki-laki", "Perempuan"];
const educationOptions = [
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/Sederajat",
  "D1/D2/D3",
  "S1/D4",
  "S2/S3",
  "Lainnya",
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-1">
    {children}
    <span className="text-red-500 font-bold" aria-hidden="true">*</span>
  </span>
);

export function DataRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const handleAgeChange = (value: string) => {
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, "");
    setForm((current) => ({ ...current, age: numericValue }));
  };

  const handlePhoneChange = (value: string) => {
    // Allow digits and '+' at the start
    const sanitizedValue = value.replace(/[^0-9+]/g, "");
    setForm((current) => ({ ...current, requesterPhone: sanitizedValue }));
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (event.currentTarget.checkValidity()) {
      setShowConfirmSubmit(true);
    } else {
      event.currentTarget.reportValidity();
    }
  }

  async function handleConfirmSubmit() {
    setShowConfirmSubmit(false);
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
    <>
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate={false}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Nama Lengkap</RequiredLabel>
          <Input
            name="requesterName"
            value={form.requesterName}
            onChange={(event) => setForm((current) => ({ ...current, requesterName: event.target.value }))}
            placeholder="Nama lengkap sesuai identitas"
            required
            maxLength={120}
            autoComplete="name"
            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Nama lengkap wajib diisi")}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Email</RequiredLabel>
          <Input
            type="email"
            name="requesterEmail"
            value={form.requesterEmail}
            onChange={(event) => setForm((current) => ({ ...current, requesterEmail: event.target.value }))}
            placeholder="nama@email.com"
            required
            maxLength={160}
            autoComplete="email"
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.valueMissing) {
                target.setCustomValidity("Email wajib diisi");
              } else if (target.validity.typeMismatch) {
                target.setCustomValidity("Harap masukkan format email yang valid (contoh: nama@email.com)");
              }
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Nomor Kontak (WA/HP)</RequiredLabel>
          <Input
            name="requesterPhone"
            value={form.requesterPhone}
            onChange={(event) => handlePhoneChange(event.target.value)}
            placeholder="08xxxxxxxxxx"
            required
            maxLength={20}
            autoComplete="tel"
            inputMode="tel"
            pattern="^(\+62|0)8[1-9][0-9]{6,12}$"
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.valueMissing) {
                target.setCustomValidity("Nomor kontak wajib diisi");
              } else if (target.validity.patternMismatch) {
                target.setCustomValidity("Format nomor salah. Gunakan format 08 atau +628 (10-15 angka)");
              }
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Umur</RequiredLabel>
          <Input
            type="number"
            name="age"
            value={form.age}
            onChange={(event) => handleAgeChange(event.target.value)}
            placeholder="Contoh: 25"
            required
            min={5}
            max={100}
            inputMode="numeric"
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.valueMissing) {
                target.setCustomValidity("Umur wajib diisi");
              } else if (target.validity.rangeUnderflow || target.validity.rangeOverflow) {
                target.setCustomValidity("Umur harus antara 5 sampai 100 tahun");
              }
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#47413f]">
            <RequiredLabel>Jenis Kelamin</RequiredLabel>
          </span>
          <Select
            name="gender"
            value={form.gender}
            onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}
            required
          >
            <SelectTrigger className="h-11 border-(--color-border)">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#47413f]">
            <RequiredLabel>Pendidikan Terakhir</RequiredLabel>
          </span>
          <Select
            name="education"
            value={form.education}
            onValueChange={(value) => setForm((current) => ({ ...current, education: value }))}
            required
          >
            <SelectTrigger className="h-11 border-(--color-border)">
              <SelectValue placeholder="Pilih pendidikan" />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Pekerjaan</RequiredLabel>
          <Input
            name="job"
            value={form.job}
            onChange={(event) => setForm((current) => ({ ...current, job: event.target.value }))}
            placeholder="Contoh: Mahasiswa, PNS, Peneliti"
            required
            maxLength={100}
            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Pekerjaan wajib diisi")}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Asal Instansi/Organisasi/Domisili</RequiredLabel>
          <Input
            name="requesterInstitution"
            value={form.requesterInstitution}
            onChange={(event) => setForm((current) => ({ ...current, requesterInstitution: event.target.value }))}
            placeholder="Contoh: Universitas Kaltara, Dinas Kesehatan, Tanjung Selor"
            required
            maxLength={160}
            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Asal instansi/organisasi/domisili wajib diisi")}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Tujuan Permintaan</RequiredLabel>
        </span>
        <Select
          name="requestPurpose"
          value={form.requestPurpose}
          onValueChange={(value) => setForm((current) => ({ ...current, requestPurpose: value }))}
          required
        >
          <SelectTrigger className="h-11 border-(--color-border)">
            <SelectValue placeholder="Pilih tujuan permintaan" />
          </SelectTrigger>
          <SelectContent>
            {requestPurposeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        <RequiredLabel>Uraian Data Yang Diminta</RequiredLabel>
        <textarea
          name="requestedDataDescription"
          value={form.requestedDataDescription}
          onChange={(event) => setForm((current) => ({ ...current, requestedDataDescription: event.target.value }))}
          placeholder="Tuliskan indikator, periode, wilayah, level agregasi, serta variabel utama yang dibutuhkan."
          required
          rows={5}
          maxLength={2500}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-(--color-text) shadow-sm outline-none transition placeholder:text-(--color-muted) focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg) invalid:border-red-200"
          onInvalid={(e) => (e.target as HTMLTextAreaElement).setCustomValidity("Uraian data yang diminta wajib diisi")}
          onInput={(e) => (e.target as HTMLTextAreaElement).setCustomValidity("")}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        <RequiredLabel>Uraian Tujuan Pemanfaatan Data</RequiredLabel>
        <textarea
          name="usagePurpose"
          value={form.usagePurpose}
          onChange={(event) => setForm((current) => ({ ...current, usagePurpose: event.target.value }))}
          placeholder="Jelaskan untuk apa data digunakan, output yang dihasilkan, dan pihak pengguna data."
          required
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-(--color-text) shadow-sm outline-none transition placeholder:text-(--color-muted) focus-visible:ring-2 focus-visible:ring-(--color-accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg) invalid:border-red-200"
          onInvalid={(e) => (e.target as HTMLTextAreaElement).setCustomValidity("Uraian tujuan pemanfaatan data wajib diisi")}
          onInput={(e) => (e.target as HTMLTextAreaElement).setCustomValidity("")}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Periode Mulai</RequiredLabel>
          <Input
            name="periodStart"
            value={form.periodStart}
            onChange={(event) => setForm((current) => ({ ...current, periodStart: event.target.value }))}
            placeholder="Misal: Januari 2024"
            required
            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Periode mulai wajib diisi")}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
          <RequiredLabel>Periode Tahun</RequiredLabel>
          <Input
            name="periodYear"
            value={form.periodYear}
            onChange={(event) => setForm((current) => ({ ...current, periodYear: event.target.value }))}
            placeholder="Misal: 2024-2025"
            required
            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Periode tahun wajib diisi")}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
          />
        </label>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#47413f]">
            <RequiredLabel>Format</RequiredLabel>
          </span>
          <Select
            name="preferredFormat"
            value={form.preferredFormat}
            onValueChange={(value) => setForm((current) => ({ ...current, preferredFormat: value }))}
            required
          >
            <SelectTrigger className="h-11 border-(--color-border)">
              <SelectValue placeholder="Pilih format" />
            </SelectTrigger>
            <SelectContent>
              {dataFormatOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-[#47413f]">
        Catatan
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

      <div className="flex flex-col items-end gap-3 sm:flex-row sm:justify-between">
        <p className="m-0 text-xs text-(--color-muted) sm:max-w-md">
          Dengan mengirim formulir ini, Anda menyatakan informasi yang diberikan benar dan dapat diverifikasi.
        </p>

        <Button type="submit" className="rounded-full px-8" disabled={isSubmitting}>
          {isSubmitting ? "Mengirim Permintaan..." : "Kirim Permintaan"}
          {isSubmitting ? <Loader2 className="ml-2 size-4 animate-spin" /> : <Send className="ml-2 size-4" />}
        </Button>
      </div>

      {submissionState ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${submissionState.ok
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

      <ConfirmationDialog
        open={showConfirmSubmit}
        onOpenChange={setShowConfirmSubmit}
        title="Kirim Permintaan Data?"
        description="Apakah Anda yakin data yang Anda masukkan sudah benar? Permintaan akan langsung diteruskan ke Bappedalitbang/Walidata untuk diverifikasi."
        confirmLabel="Ya, Kirim"
        cancelLabel="Batal"
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}

