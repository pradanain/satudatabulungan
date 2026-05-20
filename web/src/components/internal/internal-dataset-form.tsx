"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState, useEffect, useRef } from "react";
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
import { Search, ChevronDown, Check, Trash2, FileSpreadsheet, FileText, FileCode, AlertCircle, Info, Database, FileUp, CalendarDays } from "lucide-react";
import type {
  InternalDataset,
  InternalOrganization,
  InternalSession,
  InternalTopicReference,
} from "@/lib/types/internal";
import type { DatasetFormat, DatasetFrequency, DatasetPreview, DatasetResource } from "@/lib/types/dataset";
import { hasPermission } from "@/lib/utils/internal-auth";
import { homepageTopics } from "@/lib/data/homepage-topics";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";

// ─── Searchable Dropdown / Select Component ───────────────────────────────────
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={`flex h-11 w-full items-center justify-between rounded-xl border border-[#d6ddeb] bg-white px-3.5 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-[#4b7fe0] focus:outline-none focus:ring-1 focus:ring-[#4b7fe0] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-[#d6ddeb] bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col">
          <div className="relative border-b border-gray-100 p-2 shrink-0 bg-gray-50">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari opsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-950 focus:border-[#4b7fe0] focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto max-h-40 flex-1 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-[#f5f8ff] hover:text-[#4b7fe0] transition-colors text-gray-700 font-medium"
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="h-3.5 w-3.5 text-[#4b7fe0] shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-center text-xs text-gray-400">
                Tidak ditemukan hasil.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── File Upload Interface ───────────────────────────────────────────────────
interface FormFile {
  name: string;
  format: DatasetFormat;
  url?: string;
  sizeLabel: string;
  file?: File;
  base64?: string;
  isExisting?: boolean;
}

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

function isTitleRow(row: string[]): boolean {
  if (!row || row.length === 0) return false;
  const nonEmptyCells = row.filter((c) => c.trim() !== "");
  if (nonEmptyCells.length === 0) return false;

  const hasVeryLongCell = nonEmptyCells.some((c) => c.length > 35);
  if (hasVeryLongCell) return true;

  const hasTitleKeywords = nonEmptyCells.some((c) => {
    const cl = c.toLowerCase();
    return (
      cl.includes("kabupaten bulungan") ||
      cl.includes("rekapitulasi") ||
      cl.includes("daftar") ||
      cl.includes("tabel ") ||
      cl.includes("jumlah anggota dewan")
    );
  });
  if (hasTitleKeywords) return true;

  if (nonEmptyCells.length <= 2 && nonEmptyCells.some((c) => c.length > 20)) {
    return true;
  }

  return false;
}

function convertRawRowsToDatasetPreview(rawRows: any[][]): DatasetPreview {
  if (!rawRows || rawRows.length === 0) {
    return { points: [], rows: [], insights: [] };
  }

  // Convert raw cells to clean trimmed strings, keeping only non-empty rows
  const cleanRows = rawRows
    .map((r) =>
      Array.isArray(r)
        ? r.map((c) => (c === undefined || c === null ? "" : String(c).trim()))
        : [],
    )
    .filter((r) => r.length > 0 && r.some((c) => c !== ""));

  if (cleanRows.length === 0) {
    return { points: [], rows: [], insights: [] };
  }

  // 1. Identify the actual header row
  let headerIndex = 0;
  for (let i = 0; i < Math.min(cleanRows.length, 6); i++) {
    const row = cleanRows[i];
    const nonEmpty = row.filter((c) => c !== "");
    if (nonEmpty.length >= 2) {
      const hasKeywords = row.some((c) => {
        const lower = c.toLowerCase();
        return (
          lower.includes("wilayah") ||
          lower.includes("kecamatan") ||
          lower.includes("partai") ||
          lower.includes("nama") ||
          lower.includes("kabupaten") ||
          lower.includes("kategori") ||
          lower.includes("opd") ||
          lower.includes("bulan") ||
          lower.includes("tahun")
        );
      });
      const hasNumbers = row.some((c) => c !== "" && !isNaN(Number(c.replace(/\./g, "").replace(",", "."))));
      if (hasKeywords || !hasNumbers) {
        headerIndex = i;
        break;
      }
    }
  }

  // 2. Build final combined headers
  const finalHeaders: string[] = [];
  const rowCurrent = cleanRows[headerIndex] || [];
  const rowAbove = headerIndex > 0 ? cleanRows[headerIndex - 1] : [];
  const rowBelow = headerIndex < cleanRows.length - 1 ? cleanRows[headerIndex + 1] : [];

  const maxCols = rowCurrent.length;
  const belowIsYearRow = rowBelow.some((c) => /^\d{4}$/.test(c));
  const aboveIsTextSubheader = rowAbove.some((c) => c !== "" && isNaN(Number(c))) && !isTitleRow(rowAbove);

  // Tentukan label default untuk kolom pertama berdasarkan isinya secara dinamis
  let detectedFirstColLabel = "Wilayah / Kecamatan";
  if (cleanRows.length > headerIndex + 1) {
    const firstColValues = cleanRows.slice(headerIndex + 1).map((r) => String(r[0] || "").toLowerCase());
    const hasPartai = firstColValues.some((v) => v.includes("partai") || v.includes("golkar") || v.includes("pdi") || v.includes("gerindra"));
    const hasOPD = firstColValues.some((v) => v.includes("dinas") || v.includes("badan") || v.includes("kantor") || v.includes("sekretariat") || v.includes("opd"));
    
    if (hasPartai) {
      detectedFirstColLabel = "Partai Politik";
    } else if (hasOPD) {
      detectedFirstColLabel = "Produsen Data / OPD";
    } else {
      const isKecamatanOnly = firstColValues.some((v) => v.includes("peso") || v.includes("selor") || v.includes("sekatak") || v.includes("bunyu"));
      if (isKecamatanOnly) {
        detectedFirstColLabel = "Kecamatan";
      }
    }
  }

  for (let colIdx = 0; colIdx < maxCols; colIdx++) {
    const currentVal = rowCurrent[colIdx] || "";
    const aboveVal = rowAbove[colIdx] || "";
    const belowVal = rowBelow[colIdx] || "";

    let combined = currentVal;

    if (aboveIsTextSubheader && aboveVal && aboveVal !== currentVal) {
      if (currentVal) {
        combined = `${aboveVal} (${currentVal})`;
      } else {
        combined = aboveVal;
      }
    } else if (belowIsYearRow && belowVal && belowVal !== currentVal) {
      combined = currentVal;
    }

    if (!combined) {
      combined = colIdx === 0 ? detectedFirstColLabel : `Kolom ${colIdx + 1}`;
    } else if (colIdx === 0 && (combined === "Wilayah / Kecamatan" || combined === "Wilayah" || combined === "Kecamatan")) {
      combined = detectedFirstColLabel;
    }

    finalHeaders.push(combined);
  }

  // 3. Define schema columns
  const columns: DatasetPreview["columns"] = [];
  const firstColLabel = finalHeaders[0] || detectedFirstColLabel;
  columns.push({ key: "area", label: firstColLabel, isNumeric: false });

  for (let colIdx = 1; colIdx < maxCols; colIdx++) {
    const headerName = finalHeaders[colIdx];
    const lowerHeader = headerName.toLowerCase();

    let key = `col_${colIdx}`;
    if (lowerHeader.includes("laki") || lowerHeader.includes("male") || lowerHeader.includes("pria")) {
      key = "male";
    } else if (lowerHeader.includes("perempuan") || lowerHeader.includes("female") || lowerHeader.includes("wanita")) {
      key = "female";
    } else if (lowerHeader.includes("jumlah") || lowerHeader.includes("total")) {
      key = "total";
    }

    columns.push({
      key,
      label: headerName,
      isNumeric: true,
    });
  }

  const hasMale = columns.some((c) => c.key === "male");
  const hasFemale = columns.some((c) => c.key === "female");
  const hasTotal = columns.some((c) => c.key === "total");
  if (hasMale && hasFemale && !hasTotal) {
    columns.push({ key: "total", label: "Total", isNumeric: true });
  }

  // 4. Extract data rows
  let startDataIndex = headerIndex + 1;
  // If the row immediately below was a year row that we merged, skip it from data rows
  if (belowIsYearRow && startDataIndex < cleanRows.length) {
    startDataIndex++;
  }

  const rows: DatasetPreview["rows"] = [];

  for (let i = startDataIndex; i < cleanRows.length; i++) {
    const row = cleanRows[i] || [];
    const nonEmpty = row.filter((c) => c !== "");
    if (nonEmpty.length === 0) continue;

    // Skip separator lines
    const isSeparator = row.every((c) => c === "" || c === "-" || c === "=" || c === ".");
    if (isSeparator) continue;

    const area = row[0] || `Baris ${i + 1}`;
    
    // Skip general sheet totals that we will aggregate or show in insights
    if (area.toLowerCase() === "jumlah" || area.toLowerCase() === "total") {
      continue;
    }

    let male: number | undefined;
    let female: number | undefined;
    let total: number | undefined;

    const values: Record<string, number | string> = {};

    for (let colIdx = 1; colIdx < maxCols; colIdx++) {
      const colDef = columns[colIdx];
      if (!colDef) continue;

      const valStr = row[colIdx] || "";
      let numVal = 0;
      let isNumeric = false;

      if (valStr === "-" || valStr === "") {
        numVal = 0;
        isNumeric = true;
      } else {
        const cleanedStr = valStr.replace(/\./g, "").replace(",", ".");
        const parsed = Number(cleanedStr);
        if (!isNaN(parsed)) {
          numVal = parsed;
          isNumeric = true;
        }
      }

      if (isNumeric) {
        values[colDef.key] = numVal;
        if (colDef.key === "male") male = numVal;
        else if (colDef.key === "female") female = numVal;
        else if (colDef.key === "total") total = numVal;
      } else {
        values[colDef.key] = valStr;
      }
    }

    if (total === undefined) {
      if (male !== undefined || female !== undefined) {
        total = (male || 0) + (female || 0);
      } else {
        const numVals = Object.values(values).filter((v): v is number => typeof v === "number");
        total = numVals.length > 0 ? numVals[0] : 0;
      }
    }

    rows.push({
      area,
      male,
      female,
      total,
      values,
    });
  }

  const points = rows.slice(0, 10).map((row) => ({
    label: row.area,
    value: row.total,
  }));

  const insights = [
    {
      label: "Total Baris",
      value: `${rows.length} Baris`,
      description: "Jumlah baris data yang teridentifikasi.",
    },
    {
      label: "Total Akumulasi",
      value: rows.reduce((sum, r) => sum + r.total, 0).toLocaleString("id-ID"),
      description: "Akumulasi nilai total dari seluruh baris data.",
    },
  ];

  return {
    points,
    rows,
    columns,
    insights,
  };
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

  const [showConfirmRemoveFile, setShowConfirmRemoveFile] = useState(false);
  const [fileToRemoveIndex, setFileToRemoveIndex] = useState<number | null>(null);

  const [formFiles, setFormFiles] = useState<FormFile[]>(() => {
    if (!dataset) return [];
    return dataset.resources
      .filter((res) => res.format !== "API")
      .map((res) => ({
        name: res.name,
        format: res.format,
        url: res.url,
        sizeLabel: res.sizeLabel,
        isExisting: true,
      }));
  });

  const [parsedPreview, setParsedPreview] = useState<DatasetPreview | null>(dataset?.preview ?? null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isCreate = mode === "create";

  const [form, setForm] = useState({
    title: dataset?.title ?? "",
    slug: dataset?.slug ?? "",
    summary: dataset?.summary ?? "",
    description: dataset?.description ?? "",
    organizationId: dataset?.organizationId ?? (hasPermission(session.role, "dataset.view_all") ? "" : session.organizationId),
    topic: dataset?.topic ?? "",
    frequency: dataset?.frequency ?? "",
    period: dataset?.metadata.period ?? "",
    walidata: dataset?.metadata.walidata ?? "Walidata Bulungan",
    coverage: dataset?.metadata.coverage ?? "Kabupaten Bulungan",
    resourceName: dataset?.resources[0]?.name ?? "",
    resourceFormat: dataset?.resources[0]?.format ?? "CSV",
    resourceUrl: dataset?.resources[0]?.url ?? "",
    tags: dataset?.metadata.tags.join(", ") ?? "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "title" && !value.trim()) {
      error = "Judul dataset wajib diisi.";
    } else if (name === "period" && !value.trim()) {
      error = "Periode data wajib diisi.";
    } else if (name === "description" && !value.trim()) {
      error = "Deskripsi dataset wajib diisi.";
    } else if (name === "topic" && !value) {
      error = "Topik dataset wajib dipilih.";
    } else if (name === "frequency" && !value) {
      error = "Frekuensi pembaruan wajib dipilih.";
    } else if (name === "organizationId" && !value) {
      error = "OPD Produsen data wajib dipilih.";
    }
    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((selectedFile) => {
      const ext = selectedFile.name.split(".").pop()?.toUpperCase() || "CSV";
      const cleanExt = ["CSV", "XLSX", "PDF", "API", "JSON"].includes(ext) ? ext : "CSV";

      const newFileObj: FormFile = {
        name: selectedFile.name.replace(/\.[^/.]+$/, ""),
        format: cleanExt as DatasetFormat,
        sizeLabel: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        file: selectedFile,
      };

      const base64Reader = new FileReader();
      base64Reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        newFileObj.base64 = base64;
      };
      base64Reader.readAsDataURL(selectedFile);

      if ((cleanExt === "CSV" || cleanExt === "XLSX") && !parsedPreview) {
        const arrayReader = new FileReader();
        arrayReader.onload = async (e) => {
          try {
            const XLSX = await import("xlsx");
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (rawRows && rawRows.length > 0) {
              const previewData = convertRawRowsToDatasetPreview(rawRows);
              setParsedPreview(previewData);
            }
          } catch (err) {
            console.error("Gagal parse berkas untuk pratinjau tabel:", err);
          }
        };
        arrayReader.readAsArrayBuffer(selectedFile);
      }

      setFormFiles((prev) => [...prev, newFileObj]);
    });
  };

  const removeFile = (index: number) => {
    setFormFiles((prev) => prev.filter((_, i) => i !== index));
    if (formFiles.length <= 1) {
      setParsedPreview(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Run validations
    validateField("title", form.title);
    validateField("period", form.period);
    validateField("description", form.description);
    validateField("topic", form.topic);
    validateField("frequency", form.frequency);
    if (hasPermission(session.role, "dataset.view_all")) {
      validateField("organizationId", form.organizationId);
    }

    if (
      !form.title.trim() || 
      !form.period.trim() || 
      !form.description.trim() || 
      !form.topic || 
      !form.frequency ||
      (hasPermission(session.role, "dataset.view_all") && !form.organizationId)
    ) {
      setErrorMessage("Silakan lengkapi semua kolom wajib yang bertanda bintang.");
      setIsPending(false);
      return;
    }

    if (formFiles.length === 0) {
      setErrorMessage("Silakan unggah minimal satu file dataset terlebih dahulu.");
      setIsPending(false);
      return;
    }

    try {
      const slug = isCreate ? (form.slug || slugify(form.title)) : dataset?.slug;
      
      const uploadedResources = await Promise.all(
        formFiles.map(async (f, idx) => {
          if (f.isExisting) {
            const absoluteUrl = f.url!.startsWith("http") 
              ? f.url! 
              : `${window.location.origin}${f.url!}`;
              
            return {
              id: `${slug}-resource-${idx}`,
              name: f.name,
              description: "Resource dataset terverifikasi",
              format: f.format,
              url: absoluteUrl,
              sizeLabel: f.sizeLabel,
              lastUpdated: new Date().toISOString(),
            };
          }

          const uploadRes = await fetch("/api/internal/uploads/file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: `${f.name}.${f.format.toLowerCase()}`,
              fileContent: f.base64,
            }),
          });

          const uploadData = (await uploadRes.json()) as { success: boolean; url?: string; error?: string };
          if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
            throw new Error(uploadData.error ?? `Gagal mengunggah berkas ${f.name} ke server.`);
          }

          return {
            id: `${slug}-resource-${idx}-${Date.now()}`,
            name: f.name,
            description: "Resource terunggah",
            format: f.format,
            url: `${window.location.origin}${uploadData.url}`,
            sizeLabel: f.sizeLabel,
            lastUpdated: new Date().toISOString(),
          };
        })
      );

      const firstResource = uploadedResources[0];

      const payload = {
        ...form,
        resourceUrl: firstResource ? firstResource.url : "",
        resourceName: firstResource ? firstResource.name : "Berkas Utama",
        resourceFormat: firstResource ? firstResource.format : "CSV",
        slug,
        organization: organizations.find((item) => item.id === form.organizationId)?.shortName ?? "Walidata",
        ownerOrgSlug: organizations.find((item) => item.id === form.organizationId)?.slug,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        preview: parsedPreview || undefined,
        resources: [
          ...uploadedResources,
          {
            id: `${slug}-resource-api`,
            name: `package_show?id=${slug}`,
            description: "Metadata API internal",
            format: "API" as const,
            url: `/api/3/action/package_show?id=${slug}`,
            sizeLabel: "JSON",
            lastUpdated: new Date().toISOString(),
          }
        ]
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

  // Load topics directly from the public-facing homepageTopics definition!
  const topicOptions = homepageTopics.map((t) => ({
    label: t.label,
    value: t.label,
  }));

  const opdOptions = organizations.map((org) => ({
    label: `${org.shortName} - ${org.name}`,
    value: org.id,
  }));

  const updatedFrequencies = [...frequencyOptions, "Series", "Multi-tahunan", "Lainnya"];

  const getFileIcon = (format: DatasetFormat) => {
    switch (format) {
      case "XLSX":
      case "CSV":
        return <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />;
      case "JSON":
      case "API":
        return <FileCode className="h-8 w-8 text-amber-500 shrink-0" />;
      default:
        return <FileText className="h-8 w-8 text-blue-500 shrink-0" />;
    }
  };

  return (
    <form className="space-y-6 w-full" onSubmit={handleSubmit}>
      
      {/* ─── BAGIAN 1: METADATA UTAMA ────────────────────────────────────────── */}
      <Card className="p-6 border border-gray-200/80 rounded-3xl shadow-xs bg-white space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e2f52] leading-tight">1. Informasi Utama Dataset</h3>
            <p className="text-xs text-gray-500">Judul, deskripsi dan topik utama dataset yang akan ditayangkan ke publik.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          
          {/* Judul Dataset */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Judul Dataset <span className="text-red-500">*</span>
            </label>
            <Input 
              value={form.title} 
              onChange={(event) => {
                const val = event.target.value;
                setForm((current) => ({ ...current, title: val }));
                validateField("title", val);
              }} 
              required 
              placeholder="Contoh: Jumlah Penduduk Berdasarkan Jenis Kelamin" 
              className={`h-11 rounded-xl ${validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"}`}
            />
            {validationErrors.title ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {validationErrors.title}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <Info className="size-3 text-blue-400 shrink-0" />
                Contoh: <strong>Jumlah Kunjungan Wisatawan Mancanegara Menurut Kecamatan</strong>
              </span>
            )}
          </div>
          <input type="hidden" value={form.slug} />

          {/* Topik (Searchable Select - Synchronized with homepage) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Topik Klasifikasi <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={form.topic}
              onValueChange={(val) => {
                setForm((current) => ({ ...current, topic: val }));
                validateField("topic", val);
              }}
              options={topicOptions}
              placeholder="Pilih topik data"
              className={validationErrors.topic ? "border-red-500" : ""}
            />
            {validationErrors.topic ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {validationErrors.topic}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                Pilih bidang klasifikasi untuk mempermudah pencarian publik.
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Tags / Kata Kunci
            </label>
            <Input
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="wisata, turis, mancanegara"
              className="h-11 rounded-xl border-gray-200"
            />
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
              Contoh: <strong>wisata, demografi, kependudukan</strong> (pisahkan dengan koma).
            </span>
          </div>

          {/* Deskripsi Dataset */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Deskripsi Detail Dataset <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => {
                const val = event.target.value;
                setForm((current) => ({ ...current, description: val }));
                validateField("description", val);
              }}
              className={`w-full rounded-xl border p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#4b7fe0] focus:border-[#4b7fe0] ${
                validationErrors.description ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Tuliskan keterangan detail mengenai data yang disajikan..."
              required
            />
            {validationErrors.description ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {validationErrors.description}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <Info className="size-3 text-blue-400 shrink-0" />
                Contoh: <strong>Dataset ini memuat data statistik jumlah kunjungan wisatawan asing ke Bulungan yang dihimpun per bulan.</strong>
              </span>
            )}
          </div>

        </div>
      </Card>

      {/* ─── BAGIAN 2: BERKAS & DOKUMEN DATASET ─────────────────────────────────── */}
      <Card className="p-6 border border-gray-200/80 rounded-3xl shadow-xs bg-white space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 rounded-xl bg-green-50 text-green-600 shrink-0">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e2f52] leading-tight">2. Berkas & Dokumen Dataset</h3>
            <p className="text-xs text-gray-500">Unggah berkas data mentah (CSV, Excel, PDF) yang bisa diunduh dan dipratinjau publik.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Unggah File Dataset <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d6ddeb] bg-gray-50/50 p-6 text-center transition hover:bg-gray-50">
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv,.json,.pdf" 
                onChange={handleFileChange} 
                multiple
                className="block max-w-max text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#4b7fe0] hover:file:bg-blue-100 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 font-normal">Mendukung multi-file & berbagai format (.xlsx, .csv, .json, .pdf)</span>
            </div>
          </div>

          {/* List of uploaded files */}
          {formFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Berkas Terpilih ({formFiles.length}):</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {formFiles.map((f, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-gray-150 bg-white p-3 shadow-xs animate-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(f.format)}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={f.name}>{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white ${
                            f.format === "XLSX" ? "bg-green-600" :
                            f.format === "CSV" ? "bg-emerald-500" :
                            f.format === "PDF" ? "bg-red-500" : "bg-[#4b7fe0]"
                          }`}>{f.format}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{f.sizeLabel}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFileToRemoveIndex(index);
                        setShowConfirmRemoveFile(true);
                      }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Hapus file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Visual Table Preview inside the Form! */}
          {parsedPreview && parsedPreview.rows.length > 0 && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-[#f7faff] p-5 shadow-xs animate-in fade-in duration-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1e2f52] mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                Pratinjau Data Terunggah ({parsedPreview.rows.length} baris terdeteksi)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-150 bg-white">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-[#5f7398] uppercase text-[10px] font-bold tracking-wider border-b border-gray-150">
                      {parsedPreview.columns && parsedPreview.columns.length > 0 ? (
                        parsedPreview.columns.map((col) => (
                          <th 
                            key={col.key} 
                            className={`px-4 py-2.5 font-semibold ${col.isNumeric ? "text-right" : "text-left"}`}
                          >
                            {col.label}
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="px-4 py-2.5 text-left font-semibold">Wilayah / Kecamatan</th>
                          {parsedPreview.rows[0].male !== undefined && <th className="px-4 py-2.5 text-right font-semibold">Laki-laki</th>}
                          {parsedPreview.rows[0].female !== undefined && <th className="px-4 py-2.5 text-right font-semibold">Perempuan</th>}
                          <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                          {parsedPreview.rows[0].values && Object.keys(parsedPreview.rows[0].values).slice(0, 3).map(k => (
                            <th key={k} className="px-4 py-2.5 text-left font-semibold">{k}</th>
                          ))}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-[#f5f8ff] transition-colors">
                        {parsedPreview.columns && parsedPreview.columns.length > 0 ? (
                          parsedPreview.columns.map((col) => {
                            if (col.key === "area") {
                              return <td key={col.key} className="px-4 py-2.5 font-medium text-gray-800">{row.area}</td>;
                            }
                            if (col.key === "male") {
                              return <td key={col.key} className="px-4 py-2.5 text-right tabular-nums text-gray-600">{(row.male ?? 0).toLocaleString('id-ID')}</td>;
                            }
                            if (col.key === "female") {
                              return <td key={col.key} className="px-4 py-2.5 text-right tabular-nums text-gray-600">{(row.female ?? 0).toLocaleString('id-ID')}</td>;
                            }
                            if (col.key === "total") {
                              return <td key={col.key} className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-800">{(row.total ?? 0).toLocaleString('id-ID')}</td>;
                            }
                            const cellValue = row.values?.[col.key] ?? "";
                            const isNum = typeof cellValue === "number";
                            return (
                              <td 
                                key={col.key} 
                                className={`px-4 py-2.5 text-gray-600 ${isNum ? "text-right font-medium tabular-nums" : "text-left"}`}
                              >
                                {isNum ? cellValue.toLocaleString('id-ID') : String(cellValue)}
                              </td>
                            );
                          })
                        ) : (
                          <>
                            <td className="px-4 py-2.5 font-medium text-gray-800">{row.area}</td>
                            {row.male !== undefined && <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{row.male.toLocaleString('id-ID')}</td>}
                            {row.female !== undefined && <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{row.female.toLocaleString('id-ID')}</td>}
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-800">{row.total.toLocaleString('id-ID')}</td>
                            {row.values && Object.entries(row.values).slice(0, 3).map(([k, v]) => (
                              <td key={k} className="px-4 py-2.5 text-gray-600">{String(v)}</td>
                            ))}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreview.rows.length > 5 && (
                <p className="text-[10px] text-gray-500 mt-2 italic">Menampilkan 5 baris pertama untuk validasi visual sebelum disimpan.</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ─── BAGIAN 3: METADATA & PERIODE DATA ─────────────────────────────────── */}
      <Card className="p-6 border border-gray-200/80 rounded-3xl shadow-xs bg-white space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e2f52] leading-tight">3. Detail Teknis & Produsen Data</h3>
            <p className="text-xs text-gray-500">Masa cakupan data, siklus pembaruan berkas, serta OPD penghasil data.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          
          {/* Periode Data / Series */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Periode / Series Data <span className="text-red-500">*</span>
            </label>
            <Input 
              value={form.period} 
              onChange={(event) => {
                const val = event.target.value;
                setForm((current) => ({ ...current, period: val }));
                validateField("period", val);
              }} 
              required 
              placeholder="2026 atau 2020-2025" 
              className={`h-11 rounded-xl ${validationErrors.period ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"}`}
            />
            {validationErrors.period ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {validationErrors.period}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <Info className="size-3 text-blue-400 shrink-0" />
                Contoh: <strong>2026</strong>, <strong>2020-2025 (Series)</strong>, atau <strong>Triwulan I 2026</strong>
              </span>
            )}
          </div>

          {/* Frekuensi Pembaruan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Frekuensi Pembaruan <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={form.frequency}
              onValueChange={(val) => {
                setForm((current) => ({ ...current, frequency: val as DatasetFrequency }));
                validateField("frequency", val);
              }}
              options={updatedFrequencies.map(f => ({ label: f, value: f }))}
              placeholder="Pilih frekuensi pembaruan"
              className={validationErrors.frequency ? "border-red-500" : ""}
            />
            {validationErrors.frequency ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {validationErrors.frequency}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                Seberapa sering data ini di-update oleh produsen data.
              </span>
            )}
          </div>

          {/* Produsen Data / OPD (Searchable Select if Admin) */}
          {hasPermission(session.role, "dataset.view_all") ? (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                Produsen Data / OPD <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={form.organizationId}
                onValueChange={(val) => {
                  setForm((current) => ({ ...current, organizationId: val }));
                  validateField("organizationId", val);
                }}
                options={opdOptions}
                placeholder="Pilih OPD Produsen Data"
                className={validationErrors.organizationId ? "border-red-500" : ""}
              />
              {validationErrors.organizationId ? (
                <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertCircle className="size-3" /> {validationErrors.organizationId}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                  Nama Satuan Kerja Perangkat Daerah penanggung jawab data.
                </span>
              )}
            </div>
          ) : (
            <input type="hidden" value={form.organizationId} />
          )}

          {/* Walidata (Hidden because it is always Walidata Bulungan) */}
          <input type="hidden" value={form.walidata} />

          {/* Cakupan Wilayah */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              Cakupan Wilayah <span className="text-red-500">*</span>
            </label>
            <Input 
              value={form.coverage} 
              onChange={(event) => setForm((current) => ({ ...current, coverage: event.target.value }))} 
              required 
              placeholder="Contoh: Kabupaten Bulungan" 
              className="h-11 rounded-xl border-gray-200"
            />
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              Wilayah representasi dari data.
            </span>
          </div>

          {/* Advanced resource configs toggle */}
          <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-[#4b7fe0] hover:underline flex items-center gap-1 focus:outline-none transition-all cursor-pointer"
            >
              {showAdvanced ? "Sembunyikan Pengaturan Berkas Lanjutan ▴" : "Tampilkan Pengaturan Berkas Lanjutan (Nama, Format, URL manual) ▾"}
            </button>

            {showAdvanced && (
              <Card className="mt-3 p-4 border border-[#d6ddeb] bg-[#f8fbff] grid gap-4 grid-cols-1 md:grid-cols-3 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                <label className="internal-field-label">
                  Nama Resource Utama
                  <Input value={form.resourceName} onChange={(event) => setForm((current) => ({ ...current, resourceName: event.target.value }))} required />
                </label>
                
                <div className="internal-field-label">
                  Format Berkas Utama
                  <Select
                    value={form.resourceFormat}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, resourceFormat: value as DatasetFormat }))
                    }
                  >
                    <SelectTrigger className="h-11 bg-white border-[#d6ddeb]">
                      <SelectValue placeholder="Format" />
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
                  URL Resource (Diisi otomatis dari unggahan file)
                  <Input value={form.resourceUrl} onChange={(event) => setForm((current) => ({ ...current, resourceUrl: event.target.value }))} placeholder="Atau isi URL manual untuk API external" />
                </label>
              </Card>
            )}
          </div>

        </div>
      </Card>

      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />

      <div className="flex flex-wrap gap-2 pt-2 justify-end">
        <Button type="button" variant="secondary" className="rounded-full px-6 h-11 font-semibold cursor-pointer border-gray-200" onClick={() => router.push("/internal/datasets")}>
          Batal
        </Button>
        <Button type="submit" className="rounded-full px-7 h-11 bg-[var(--color-primary)] font-bold text-white transition-all hover:bg-[#8f1717] active:scale-[0.98] cursor-pointer" disabled={isPending}>
          {isPending ? "Menyimpan..." : isCreate ? "Simpan Draft" : "Simpan Perubahan"}
        </Button>
      </div>

      <ConfirmationDialog
        open={showConfirmRemoveFile}
        onOpenChange={setShowConfirmRemoveFile}
        title="Hapus Berkas Dataset?"
        description={
          fileToRemoveIndex !== null && formFiles[fileToRemoveIndex]
            ? `Apakah Anda yakin ingin menghapus berkas "${formFiles[fileToRemoveIndex].name}" dari daftar unggahan?`
            : "Apakah Anda yakin ingin menghapus berkas ini?"
        }
        confirmLabel="Hapus Berkas"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={() => {
          if (fileToRemoveIndex !== null) {
            removeFile(fileToRemoveIndex);
            setFileToRemoveIndex(null);
          }
        }}
      />
    </form>
  );
}
