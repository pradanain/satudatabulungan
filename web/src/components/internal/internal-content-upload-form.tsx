"use client";

import { useMemo, useState } from "react";
import type { InternalSession } from "@/lib/types/internal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UploadType = "dataset" | "infografis" | "publikasi";

type OrganizationOption = {
  id: string;
  name: string;
};

type Props = {
  session: InternalSession;
  organizations: OrganizationOption[];
};

const typeLabels: Record<UploadType, string> = {
  dataset: "Dataset",
  infografis: "Infografis",
  publikasi: "Buku / Publikasi",
};

const typeFormats: Record<UploadType, string[]> = {
  dataset: ["CSV", "JSON", "XLSX"],
  infografis: ["JSON", "PNG", "JPG"],
  publikasi: ["PDF", "JSON"],
};

const defaultResourceContent: Record<UploadType, string> = {
  dataset: "kecamatan,tahun,nilai\nTanjung Selor,2025,123\nTanjung Palas,2025,98",
  infografis: JSON.stringify(
    {
      title: "Statistik Penduduk Kabupaten Bulungan 2025",
      summary: "Ringkasan visual indikator kependudukan 10 kecamatan.",
      image_url: "https://example.com/infografis/penduduk-2025.png",
    },
    null,
    2,
  ),
  publikasi: JSON.stringify(
    {
      title: "Kabupaten Bulungan Dalam Angka 2025",
      publisher: "Bappeda Litbang Kabupaten Bulungan",
      description: "Publikasi indikator makro dan sektoral Kabupaten Bulungan.",
    },
    null,
    2,
  ),
};

function slugFileName(title: string, fallback: string, extension: string): string {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback;

  return `${base}.${extension.toLowerCase()}`;
}

export function InternalContentUploadForm({ session, organizations }: Props) {
  const selectableOrganizations = useMemo(() => {
    if (session.role === "operator_opd") {
      return organizations.filter((item) => item.id === session.organizationId);
    }

    return organizations;
  }, [organizations, session.organizationId, session.role]);

  const [contentType, setContentType] = useState<UploadType>("dataset");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    notes: "",
    ownerOrgId: selectableOrganizations[0]?.id ?? session.organizationId,
    topic: "Statistik Sektoral",
    tags: "bulungan, satu-data",
    year: "2025",
    period: "2025",
    frequency: "Tahunan",
    status: "Published",
    resourceName: "",
    resourceFormat: "CSV",
    resourceDescription: "Resource unggahan dari dashboard internal.",
    resourceContent: defaultResourceContent.dataset,
  });

  function handleTypeChange(nextType: UploadType) {
    const firstFormat = typeFormats[nextType][0] ?? "CSV";
    setContentType(nextType);
    setForm((current) => ({
      ...current,
      resourceFormat: firstFormat,
      resourceContent: defaultResourceContent[nextType],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const extension = form.resourceFormat.toLowerCase() === "xlsx" ? "csv" : form.resourceFormat.toLowerCase();
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        resourceName: form.resourceName || `${typeLabels[contentType]} ${form.year}`,
        resourceFileName: slugFileName(form.title, `portal-${contentType}`, extension),
      };

      const response = await fetch(`/api/internal/uploads/${contentType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: {
          id?: string;
          name?: string;
        };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Upload gagal diproses.");
      }

      setSuccessMessage(`Upload ${typeLabels[contentType]} berhasil: ${data.result?.name ?? "tanpa-slug"}`);
      setForm((current) => ({
        ...current,
        title: "",
        notes: "",
        resourceName: "",
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload gagal diproses.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Card className="internal-surface border-transparent p-5 shadow-none sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(typeLabels) as UploadType[]).map((item) => (
            <Button
              key={item}
              type="button"
              variant={contentType === item ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => handleTypeChange(item)}
            >
              {typeLabels[item]}
            </Button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="internal-field-label md:col-span-2">
            Judul Konten
            <Input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={`Masukkan judul ${typeLabels[contentType]}`}
            />
          </label>

          <label className="internal-field-label">
            Organisasi Pemilik
            <select
              className="internal-select"
              value={form.ownerOrgId}
              onChange={(event) => setForm((current) => ({ ...current, ownerOrgId: event.target.value }))}
              disabled={session.role === "operator_opd"}
            >
              {selectableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          <label className="internal-field-label">
            Topik
            <Input value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} />
          </label>

          <label className="internal-field-label">
            Tahun
            <Input value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} />
          </label>

          <label className="internal-field-label">
            Frekuensi
            <Input value={form.frequency} onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))} />
          </label>

          <label className="internal-field-label md:col-span-3">
            Catatan / Deskripsi
            <textarea
              rows={4}
              required
              className="internal-textarea"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <label className="internal-field-label md:col-span-2">
            Nama Resource
            <Input
              value={form.resourceName}
              onChange={(event) => setForm((current) => ({ ...current, resourceName: event.target.value }))}
              placeholder="Nama file/resource"
            />
          </label>

          <label className="internal-field-label">
            Format Resource
            <select
              className="internal-select"
              value={form.resourceFormat}
              onChange={(event) => setForm((current) => ({ ...current, resourceFormat: event.target.value }))}
            >
              {typeFormats[contentType].map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>

          <label className="internal-field-label md:col-span-3">
            Konten Resource
            <textarea
              rows={10}
              required
              className="internal-textarea font-mono text-xs"
              value={form.resourceContent}
              onChange={(event) => setForm((current) => ({ ...current, resourceContent: event.target.value }))}
            />
          </label>

          <label className="internal-field-label md:col-span-3">
            Tags
            <Input
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="misal: bulungan, statistik, sektoral"
            />
          </label>
        </div>
      </Card>

      {errorMessage ? <p className="internal-alert-error">{errorMessage}</p> : null}
      {successMessage ? <p className="internal-alert-success">{successMessage}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="rounded-full px-5" disabled={pending}>
          {pending ? "Mengunggah..." : `Upload ${typeLabels[contentType]}`}
        </Button>
      </div>
    </form>
  );
}

