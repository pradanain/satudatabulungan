"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { SectionHeading } from "@/components/portal/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatasetFormat, DatasetFrequency, DatasetStatus } from "@/lib/types/dataset";
import {
  canTransition,
  getNextStatuses,
  workflowLaneOrder,
  getStatusLabel,
  type WorkflowItem,
} from "@/lib/types/workflow";
import { cn } from "@/lib/utils/cn";
import { formatIndonesianDate } from "@/lib/utils/formatters";

type WorkflowBoardProps = {
  initialItems: WorkflowItem[];
};

type DraftFormState = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  organization: string;
  ownerOrgSlug: string;
  topic: string;
  frequency: DatasetFrequency;
  period: string;
  walidata: string;
  coverage: string;
  resourceName: string;
  resourceFormat: DatasetFormat;
  resourceUrl: string;
};

const statusActionLabel: Record<DatasetStatus, string> = {
  Draft: "Draft",
  Submitted: "Ajukan ke Walidata",
  "Under Review": "Mulai Pemeriksaan",
  "Need Revision": "Minta Revisi",
  Approved: "Tandai Layak Publikasi",
  Published: "Publikasikan",
  Archived: "Arsipkan",
};

const laneTone: Record<DatasetStatus, { badgeClass: string; surfaceClass: string }> = {
  Draft: {
    badgeClass: "border-[#f8d8a0] bg-[#fff7e8] text-[#9a5d00]",
    surfaceClass: "bg-[#fffdf7]",
  },
  Submitted: {
    badgeClass: "border-[#cce0ff] bg-[#eff6ff] text-[#1e4f95]",
    surfaceClass: "bg-[#fafdff]",
  },
  "Under Review": {
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    surfaceClass: "bg-[#fffdf7]",
  },
  "Need Revision": {
    badgeClass: "border-[#f6c9c9] bg-[#fff4f4] text-[#9d2b2b]",
    surfaceClass: "bg-[#fffdfd]",
  },
  Approved: {
    badgeClass: "border-[#cde9cc] bg-[#f2fbf2] text-[#20692d]",
    surfaceClass: "bg-[#fcfffc]",
  },
  Published: {
    badgeClass: "border-[#cde3d6] bg-[#f1faf6] text-[#1f5e3e]",
    surfaceClass: "bg-[#fbfffd]",
  },
  Archived: {
    badgeClass: "border-[#dcdde2] bg-[#f5f6f9] text-[#515564]",
    surfaceClass: "bg-[#fcfcfd]",
  },
};

function getActionLabel(from: DatasetStatus, to: DatasetStatus): string {
  if (from === "Need Revision" && to === "Submitted") return "Ajukan Ulang ke Walidata";
  if (from === "Archived" && to === "Published") return "Pulihkan Publikasi";
  return statusActionLabel[to] || to;
}

const frequencyOptions: DatasetFrequency[] = [
  "Bulanan",
  "Triwulanan",
  "Semesteran",
  "Tahunan",
  "Lainnya",
];

const resourceFormatOptions: DatasetFormat[] = ["CSV", "XLSX", "JSON", "API", "PDF"];

const defaultDraftForm: DraftFormState = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  organization: "",
  ownerOrgSlug: "",
  topic: "",
  frequency: "Tahunan",
  period: "",
  walidata: "",
  coverage: "Kabupaten Bulungan",
  resourceName: "",
  resourceFormat: "CSV",
  resourceUrl: "",
};

function moveStatus(
  items: WorkflowItem[],
  id: string,
  nextStatus: DatasetStatus,
  updatedAt = new Date().toISOString(),
): WorkflowItem[] {
  return items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    if (!canTransition(item.status, nextStatus)) {
      return item;
    }

    return {
      ...item,
      status: nextStatus,
      lastUpdated: updatedAt,
    };
  });
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function FormField({ label, required = false, className, children }: FormFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-semibold text-[#47413f]", className)}>
      {label}
      {required ? " *" : ""}
      {children}
    </label>
  );
}

export function WorkflowBoard({ initialItems }: WorkflowBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<WorkflowItem[]>(initialItems);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [draftPending, setDraftPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState<DraftFormState>(defaultDraftForm);

  function updateDraftField<K extends keyof DraftFormState>(key: K, value: DraftFormState[K]) {
    setDraftForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDraftPending(true);

    try {
      const response = await fetch("/api/internal/workflow/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftForm),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: { slug?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Gagal membuat draft dataset.");
      }

      setDraftForm(defaultDraftForm);
      setSuccessMessage(`Draft '${data.result?.slug ?? "baru"}' berhasil dibuat.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal membuat draft dataset.");
    } finally {
      setDraftPending(false);
    }
  }

  async function handleTransition(item: WorkflowItem, nextStatus: DatasetStatus) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingItemId(item.id);

    try {
      const response = await fetch("/api/internal/workflow/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: item.slug,
          fromStatus: item.status,
          toStatus: nextStatus,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: { updatedAt?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Transisi workflow gagal diproses.");
      }

      setItems((prev) => moveStatus(prev, item.id, nextStatus, data.result?.updatedAt));
      setSuccessMessage(`Status '${item.title}' berhasil diubah ke ${getStatusLabel(nextStatus)}.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan transisi workflow.");
    } finally {
      setPendingItemId(null);
    }
  }

  const grouped = useMemo(() => {
    return workflowLaneOrder.map((status) => ({
      status,
      items: items.filter((item) => item.status === status),
    }));
  }, [items]);

  return (
    <section className="grid gap-4">
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Workflow Dataset"
          description="Transisi status dipersist ke backend dan setiap perubahan dicatat dalam audit trail (who/when/from/to)."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Buat Draft Dataset"
          description="Isi metadata minimum dan minimal satu resource agar draft dapat masuk alur review internal."
          titleClassName="text-2xl sm:text-3xl"
          descriptionClassName="text-sm sm:text-base"
        />
        <form className="mt-4 grid gap-3" onSubmit={handleCreateDraft}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Judul Dataset" required>
              <Input
                value={draftForm.title}
                onChange={(event) => updateDraftField("title", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Slug Dataset">
              <Input
                value={draftForm.slug}
                onChange={(event) => updateDraftField("slug", event.target.value)}
                placeholder="opsional, otomatis dari judul jika kosong"
              />
            </FormField>
            <FormField label="Ringkasan" required>
              <Input
                value={draftForm.summary}
                onChange={(event) => updateDraftField("summary", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Organisasi/OPD" required>
              <Input
                value={draftForm.organization}
                onChange={(event) => updateDraftField("organization", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Owner Org Slug">
              <Input
                value={draftForm.ownerOrgSlug}
                onChange={(event) => updateDraftField("ownerOrgSlug", event.target.value)}
                placeholder="opsional"
              />
            </FormField>
            <FormField label="Topik" required>
              <Input
                value={draftForm.topic}
                onChange={(event) => updateDraftField("topic", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Frekuensi" required>
              <Select
                value={draftForm.frequency}
                onValueChange={(value) =>
                  updateDraftField("frequency", value as DatasetFrequency)
                }
                name="frequency"
                required
              >
                <SelectTrigger className="h-11 border-(--color-border)">
                  <SelectValue placeholder="Pilih frekuensi" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Periode" required>
              <Input
                value={draftForm.period}
                onChange={(event) => updateDraftField("period", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Walidata" required>
              <Input
                value={draftForm.walidata}
                onChange={(event) => updateDraftField("walidata", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Cakupan Wilayah">
              <Input
                value={draftForm.coverage}
                onChange={(event) => updateDraftField("coverage", event.target.value)}
              />
            </FormField>
            <FormField label="Nama Resource" required>
              <Input
                value={draftForm.resourceName}
                onChange={(event) => updateDraftField("resourceName", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Format Resource" required>
              <Select
                value={draftForm.resourceFormat}
                onValueChange={(value) => updateDraftField("resourceFormat", value as DatasetFormat)}
                name="resourceFormat"
                required
              >
                <SelectTrigger className="h-11 border-(--color-border)">
                  <SelectValue placeholder="Pilih format" />
                </SelectTrigger>
                <SelectContent>
                  {resourceFormatOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="URL Resource" required className="md:col-span-2 xl:col-span-3">
              <Input
                value={draftForm.resourceUrl}
                onChange={(event) => updateDraftField("resourceUrl", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Deskripsi" className="md:col-span-2 xl:col-span-3">
              <textarea
                value={draftForm.description}
                onChange={(event) => updateDraftField("description", event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
              />
            </FormField>
          </div>
          <Button type="submit" disabled={draftPending} className="w-full rounded-xl sm:w-auto">
            {draftPending ? "Menyimpan Draft..." : "Simpan Draft"}
          </Button>
        </form>
      </Card>

      {errorMessage ? (
        <p
          className="m-0 rounded-xl border border-[#f2b0b0] bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#9a1a1a]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="m-0 rounded-xl border border-[#9fd0a7] bg-[#eefbf0] px-4 py-3 text-sm font-semibold text-[#1f6a2a]">
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((lane) => (
          <Card key={lane.status} className={cn("overflow-hidden", laneTone[lane.status].surfaceClass)}>
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <Badge variant="outline" className={cn("rounded-full font-semibold", laneTone[lane.status].badgeClass)}>
                {getStatusLabel(lane.status)}
              </Badge>
              <span className="inline-flex size-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold">
                {lane.items.length}
              </span>
            </header>

            <div className="grid gap-3 p-4">
              {lane.items.length === 0 ? (
                <p className="m-0 text-sm text-[var(--color-muted)]">Belum ada dataset pada tahap ini.</p>
              ) : (
                lane.items.map((item) => {
                  const actions = getNextStatuses(item.status);
                  const latestAudit = item.auditTrail?.[item.auditTrail.length - 1];

                  return (
                    <article key={item.id} className="grid gap-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
                      <h4 className="m-0 text-sm font-semibold">{item.title}</h4>
                      <p className="m-0 text-sm text-[var(--color-muted)]">{item.organization}</p>
                      <small className="text-xs text-[var(--color-muted)]">
                        Resource: {item.resourceCount} | Update: {formatIndonesianDate(item.lastUpdated)}
                      </small>
                      {latestAudit ? (
                        <p className="m-0 rounded-lg border border-[#d4e4ff] bg-[#f5f9ff] px-2.5 py-2 text-xs text-[#29508a]">
                          Audit terakhir: {getStatusLabel(latestAudit.fromStatus as any)} {"->"} {getStatusLabel(latestAudit.toStatus)} oleh{" "}
                          {latestAudit.actor} ({formatIndonesianDate(latestAudit.at)})
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="secondary" size="sm" className="rounded-full">
                          <Link href={`/dataset/${item.slug}`}>Lihat detail</Link>
                        </Button>
                        <Button asChild variant="secondary" size="sm" className="rounded-full">
                          <Link href={`/internal/workflow/${item.slug}/audit`}>Lihat audit</Link>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actions.length === 0 ? (
                          <span className="text-xs text-[var(--color-muted)]">Tidak ada aksi lanjutan.</span>
                        ) : (
                          actions.map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              type="button"
                              size="sm"
                              className="rounded-full"
                              disabled={pendingItemId === item.id}
                              onClick={() => handleTransition(item, nextStatus)}
                            >
                              {pendingItemId === item.id ? "Menyimpan..." : getActionLabel(item.status, nextStatus)}
                            </Button>
                          ))
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
