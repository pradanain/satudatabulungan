"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
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
import type {
  InternalDataset,
  InternalOrganization,
  InternalSession,
  InternalTopicReference,
} from "@/lib/types/internal";
import type { DatasetFormat, DatasetFrequency } from "@/lib/types/dataset";

type InternalDatasetFormProps = {
  mode: "create" | "edit";
  session: InternalSession;
  organizations: InternalOrganization[];
  topics: InternalTopicReference[];
  dataset?: InternalDataset;
};

const frequencyOptions: DatasetFrequency[] = [
  "Harian",
  "Bulanan",
  "Triwulanan",
  "Semesteran",
  "Tahunan",
];

const resourceFormatOptions: DatasetFormat[] = ["CSV", "XLSX", "JSON", "API", "PDF"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function InternalDatasetForm({
  mode,
  session,
  organizations,
  topics,
  dataset,
}: InternalDatasetFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: dataset?.title ?? "",
    slug: dataset?.slug ?? "",
    summary: dataset?.summary ?? "",
    description: dataset?.description ?? "",
    organizationId: dataset?.organizationId ?? session.organizationId,
    topic: dataset?.topic ?? topics[0]?.name ?? "Statistik Sektoral",
    frequency: dataset?.frequency ?? "Tahunan",
    period: dataset?.metadata.period ?? new Date().getFullYear().toString(),
    walidata: dataset?.metadata.walidata ?? "Walidata Bulungan",
    coverage: dataset?.metadata.coverage ?? "Kabupaten Bulungan",
    resourceName: dataset?.resources[0]?.name ?? "",
    resourceFormat: dataset?.resources[0]?.format ?? "CSV",
    resourceUrl: dataset?.resources[0]?.url ?? "",
    tags: dataset?.metadata.tags.join(", ") ?? "",
    reviewSummary: dataset?.reviewSummary ?? "",
  });

  const isCreate = mode === "create";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        ...form,
        slug: isCreate ? (form.slug || slugify(form.title)) : dataset?.slug,
        organization: organizations.find((item) => item.id === form.organizationId)?.shortName ?? "Walidata",
        ownerOrgSlug: organizations.find((item) => item.id === form.organizationId)?.slug,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch(
        isCreate ? "/api/internal/workflow/draft" : `/api/internal/datasets/${dataset?.slug}`,
        {
          method: isCreate ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: {
          slug?: string;
        };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Gagal menyimpan dataset.");
      }

      const nextSlug = data.result?.slug ?? payload.slug;
      setSuccessMessage(isCreate ? "Draft dataset berhasil dibuat." : "Dataset berhasil diperbarui.");

      startTransition(() => {
        router.push(`/internal/datasets/${nextSlug}`);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan dataset.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="internal-field-label md:col-span-2">
            Judul Dataset
            <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          </label>
          {/* Slug hidden - automatically generated from title */}
          <input type="hidden" value={form.slug} />

          {/* Ringkasan removed per user feedback */}
          <div className="internal-field-label">
            Topik
            <Select
              value={form.topic}
              onValueChange={(value) => setForm((current) => ({ ...current, topic: value }))}
            >
              <SelectTrigger className="h-11 border-(--color-border)">
                <SelectValue placeholder="Pilih topik" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.name}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {session.role !== "operator" ? (
            <div className="internal-field-label">
              Organisasi / OPD
              <Select
                value={form.organizationId}
                onValueChange={(value) => setForm((current) => ({ ...current, organizationId: value }))}
              >
                <SelectTrigger className="h-11 border-(--color-border)">
                  <SelectValue placeholder="Pilih organisasi" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <input type="hidden" value={form.organizationId} />
          )}

          <div className="internal-field-label">
            Frekuensi
            <Select
              value={form.frequency}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, frequency: value as DatasetFrequency }))
              }
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
          </div>

          <label className="internal-field-label">
            Periode
            <Input value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: event.target.value }))} required />
          </label>
          {/* Walidata & Cakupan hidden - fixed values for Bulungan */}
          <input type="hidden" value={form.walidata} />
          <input type="hidden" value={form.coverage} />

          <label className="internal-field-label md:col-span-2">
            Nama Resource
            <Input value={form.resourceName} onChange={(event) => setForm((current) => ({ ...current, resourceName: event.target.value }))} required />
          </label>
          <div className="internal-field-label">
            Format Resource
            <Select
              value={form.resourceFormat}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, resourceFormat: value as DatasetFormat }))
              }
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
          </div>

          <label className="internal-field-label md:col-span-3">
            URL Resource
            <Input value={form.resourceUrl} onChange={(event) => setForm((current) => ({ ...current, resourceUrl: event.target.value }))} required />
          </label>

          <label className="internal-field-label md:col-span-3">
            Deskripsi
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="internal-textarea"
            />
          </label>

          <label className="internal-field-label md:col-span-2">
            Tags
            <Input
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="misal: kependudukan, kecamatan, dukcapil"
            />
          </label>
          <label className="internal-field-label">
            Ringkasan Review
            <Input
              value={form.reviewSummary}
              onChange={(event) => setForm((current) => ({ ...current, reviewSummary: event.target.value }))}
              placeholder="Catatan internal singkat"
            />
          </label>
        </div>
      </Card>

      {errorMessage ? (
        <p className="internal-alert-error">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="internal-alert-success">
          {successMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="rounded-full px-5" disabled={isPending}>
          {isPending ? "Menyimpan..." : isCreate ? "Simpan Draft" : "Simpan Perubahan"}
        </Button>
        <Button type="button" variant="secondary" className="rounded-full px-5" onClick={() => router.push("/internal/datasets")}>
          Kembali ke Daftar Dataset
        </Button>
      </div>
    </form>
  );
}
