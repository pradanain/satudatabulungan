"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  InternalOrganization,
  InternalSession,
  InternalPublication,
  ContentType,
} from "@/lib/types/internal";
import { hasPermission } from "@/lib/utils/internal-auth";
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  FileText,
  ImageIcon,
  X,
  Search,
  ChevronDown,
  Check,
  Newspaper,
  BookOpen,
  LayoutTemplate,
  Info,
  Save,
  Send,
  Eye,
  CalendarDays,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";

// ─── Searchable OPD Select ────────────────────────────────────────────────────

interface SearchableOPDSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  alignDirection?: "up" | "down" | "auto";
}

function SearchableOPDSelect({
  value,
  onValueChange,
  options,
  placeholder = "Pilih OPD sumber",
  disabled = false,
  hasError = false,
  alignDirection = "auto",
}: SearchableOPDSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
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
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  function handleToggle() {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320);
    }
    setIsOpen(!isOpen);
    setSearch("");
  }

  const effectiveUp = alignDirection === "up" || (alignDirection === "auto" && openUpward);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError
            ? "border-red-400 focus:border-red-400 focus:ring-red-400"
            : "border-[#d6ddeb] focus:border-[#4b7fe0] focus:ring-[#4b7fe0]"
        }`}
      >
        <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className="h-4 w-4 text-gray-500 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${
            effectiveUp
              ? "bottom-full mb-1 slide-in-from-bottom-1"
              : "mt-1 slide-in-from-top-1"
          } max-h-60 w-full overflow-hidden rounded-xl border border-[#d6ddeb] bg-white shadow-lg animate-in fade-in duration-150 flex flex-col`}
        >
          <div className="relative border-b border-gray-100 p-2 shrink-0 bg-gray-50">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari OPD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-950 focus:border-[#4b7fe0] focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-44 flex-1 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onValueChange(opt.value); setIsOpen(false); }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-[#f5f8ff] hover:text-[#4b7fe0] transition-colors text-gray-700 font-medium"
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="h-3.5 w-3.5 text-[#4b7fe0] shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-center text-xs text-gray-400">
                OPD tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InternalPublicationFormProps {
  mode: "create" | "edit";
  session: InternalSession;
  organizations: { id: string; name: string; shortName: string }[];
  initialData?: InternalPublication;
  fixedType?: ContentType;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDateForDisplay(isoDate: string): string {
  if (!isoDate) return "";
  // if already DD/MM/YYYY format return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return isoDate;
  }
}

function isValidDate(value: string): boolean {
  if (!value) return false;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  return !isNaN(d.getTime());
}

// ─── Section header component ──────────────────────────────────────────────────

function SectionCard({
  icon,
  stepLabel,
  title,
  description,
  iconBgClass = "bg-[#1e2f52]",
  gradientFrom = "from-[#eef3fb]",
  children,
}: {
  icon: React.ReactNode;
  stepLabel: string;
  title: string;
  description: string;
  iconBgClass?: string;
  gradientFrom?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-gray-200/80 rounded-2xl shadow-sm bg-white">
      <div className={`flex items-start gap-4 bg-gradient-to-r ${gradientFrom} to-white px-6 py-4 border-b border-gray-100 rounded-t-2xl`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBgClass} text-white shadow-sm`}>
          {icon}
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stepLabel}</span>
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </Card>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
          <AlertCircle className="size-3" /> {error}
        </span>
      ) : hint ? (
        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
          <Info className="size-3 text-blue-400 shrink-0" /> {hint}
        </span>
      ) : null}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function InternalPublicationForm({
  mode,
  session,
  organizations,
  initialData,
  fixedType,
}: InternalPublicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProdusen = session.role === "produsen";
  const canManageAll = hasPermission(session, "content.manage_all");

  const defaultType =
    fixedType || initialData?.type || (isProdusen ? "digital_publication" : "news") as ContentType;

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: defaultType,
    description: initialData?.description || "",
    content: initialData?.content || "",
    fileUrl: initialData?.fileUrl || "",
    imageUrl: initialData?.imageUrl || "",
    organizationId: isProdusen
      ? session.organizationId
      : initialData?.organizationId || "",
    year: initialData?.year || new Date().getFullYear().toString(),
    // For news: store date as DD/MM/YYYY
    publishDate: initialData?.publishedAt
      ? formatDateForDisplay(initialData.publishedAt)
      : formatDateForDisplay(new Date().toISOString()),
  });

  const [pdfFileObj, setPdfFileObj] = useState<{ name: string; file: File; previewUrl: string } | null>(null);
  const [imageFileObj, setImageFileObj] = useState<{ name: string; file: File; previewUrl: string } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<null | "draft" | "publish" | "submit_review">(null);

  const opdOptions = organizations.map((org) => ({
    label: `${org.shortName} — ${org.name}`,
    value: org.id,
  }));

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Otomatis ganti underscore dengan spasi pada field judul agar tampilan tidak rusak
    const cleanedValue = name === "title" ? value.replace(/_/g, " ") : value;
    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "fileUrl" | "imageUrl",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (field === "fileUrl") {
      if (file.type !== "application/pdf" || ext !== "pdf") {
        setErrorMessage("Format file tidak didukung. Gunakan PDF.");
        return;
      }
      const maxSize = formData.type === "digital_publication" ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
      const label = formData.type === "digital_publication" ? "50 MB" : "25 MB";
      if (file.size > maxSize) {
        setErrorMessage(`Ukuran file terlalu besar. Maksimum ${label}.`);
        return;
      }
      // Revoke old preview URL to avoid memory leaks
      if (pdfFileObj?.previewUrl) URL.revokeObjectURL(pdfFileObj.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      setPdfFileObj({ name: file.name, file, previewUrl });
      if (errors.fileUrl) setErrors((prev) => ({ ...prev, fileUrl: "" }));
    }

    if (field === "imageUrl") {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
      if (!allowedTypes.includes(file.type) || !allowedExts.includes(ext || "")) {
        setErrorMessage("Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
        return;
      }
      const maxSize = formData.type === "infographic" ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
      const label = formData.type === "infographic" ? "15 MB" : "10 MB";
      if (file.size > maxSize) {
        setErrorMessage(`Ukuran gambar terlalu besar. Maksimum ${label}.`);
        return;
      }
      // Revoke old preview URL to avoid memory leaks
      if (imageFileObj?.previewUrl) URL.revokeObjectURL(imageFileObj.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      setImageFileObj({ name: file.name, file, previewUrl });
      if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: "" }));
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  // ─── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Judul wajib diisi.";
    else if (formData.title.includes("_")) newErrors.title = "Judul tidak boleh mengandung underscore (_). Gunakan spasi sebagai pemisah kata.";
    if (!formData.organizationId) newErrors.organizationId = "OPD Sumber wajib dipilih.";

    if (formData.type === "news") {
      if (!formData.content.trim()) newErrors.content = "Isi berita wajib diisi.";
      if (!formData.publishDate) {
        newErrors.publishDate = "Tanggal berita wajib diisi.";
      } else if (!isValidDate(formData.publishDate)) {
        newErrors.publishDate = "Format tanggal tidak valid. Gunakan DD/MM/YYYY.";
      }
      const finalImageUrl = imageFileObj?.previewUrl || formData.imageUrl;
      if (!finalImageUrl) newErrors.imageUrl = "Dokumentasi Kegiatan/Thumbnail wajib diunggah.";
    }

    if (formData.type === "digital_publication") {
      if (!formData.description.trim()) newErrors.description = "Deskripsi Singkat/Ringkasan wajib diisi.";
      if (!formData.year.trim()) newErrors.year = "Tahun Publikasi wajib diisi.";
      const finalFileUrl = pdfFileObj?.previewUrl || formData.fileUrl;
      if (!finalFileUrl) newErrors.fileUrl = "Dokumen Buku Digital wajib diunggah.";
    }

    if (formData.type === "infographic") {
      if (!formData.description.trim()) newErrors.description = "Deskripsi Singkat/Ringkasan wajib diisi.";
      if (!formData.year.trim()) newErrors.year = "Tahun Publikasi wajib diisi.";
      const finalImageUrl = imageFileObj?.previewUrl || formData.imageUrl;
      if (!finalImageUrl) newErrors.imageUrl = "Dokumen Infografis wajib diunggah.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleConfirmSubmit = async (submitType: "draft" | "publish" | "submit_review") => {
    setConfirmAction(null);
    if (!validate()) {
      setErrorMessage("Silakan lengkapi semua kolom wajib yang ditandai bintang merah.");
      return;
    }
    await executeSubmit(submitType);
  };

  const requestSubmit = (submitType: "draft" | "publish" | "submit_review") => {
    if (!validate()) {
      setErrorMessage("Silakan lengkapi semua kolom wajib yang ditandai bintang merah.");
      return;
    }
    setConfirmAction(submitType);
  };

  const executeSubmit = async (submitType: "draft" | "publish" | "submit_review") => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let finalStatus = "Draft";
      if (submitType === "publish") finalStatus = "Published";
      if (submitType === "submit_review") finalStatus = "Submitted";

      // ── Upload PDF via multipart form (efficient, no base64 overhead) ───────
      let uploadedFileUrl = formData.fileUrl;
      if (pdfFileObj) {
        const pdfForm = new FormData();
        pdfForm.set("file", pdfFileObj.file);
        pdfForm.set("contentType", formData.type);
        const uploadRes = await fetch("/api/internal/uploads/file", {
          method: "POST",
          body: pdfForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Gagal mengunggah berkas PDF.");
        }
        uploadedFileUrl = uploadData.url;
      }

      // ── Upload Image via multipart form ──────────────────────────────────
      let uploadedImageUrl = formData.imageUrl;
      if (imageFileObj) {
        const imgForm = new FormData();
        imgForm.set("file", imageFileObj.file);
        imgForm.set("contentType", formData.type);
        const uploadRes = await fetch("/api/internal/uploads/file", {
          method: "POST",
          body: imgForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Gagal mengunggah berkas Gambar.");
        }
        uploadedImageUrl = uploadData.url;
      }

      // Build publishedAt from DD/MM/YYYY
      let publishedAt: string | undefined;
      if (formData.type === "news" && formData.publishDate) {
        const [dd, mm, yyyy] = formData.publishDate.split("/");
        publishedAt = new Date(`${yyyy}-${mm}-${dd}`).toISOString();
      }

      const payload = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        content: formData.content,
        fileUrl: uploadedFileUrl,
        imageUrl: uploadedImageUrl,
        organizationId: formData.organizationId,
        year: formData.year,
        status: finalStatus,
        ...(publishedAt ? { publishedAt } : {}),
      };

      const endpoint =
        mode === "create"
          ? `/api/internal/publications`
          : `/api/internal/publications/${initialData?.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan konten.");
      }

      setSuccessMessage(
        mode === "create" ? "Konten berhasil ditambahkan." : "Konten berhasil diperbarui.",
      );
      setTimeout(() => {
        const redirectPath =
          formData.type === "digital_publication" ? "/internal/buku-digital"
          : formData.type === "infographic" ? "/internal/infografis"
          : formData.type === "news" ? "/internal/berita"
          : "/internal/publications";
        router.push(redirectPath);
        router.refresh();
      }, 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Type Metadata ───────────────────────────────────────────────────────────

  const typeIcon = {
    news: <Newspaper className="size-4" />,
    digital_publication: <BookOpen className="size-4" />,
    infographic: <LayoutTemplate className="size-4" />,
  }[formData.type as "news" | "digital_publication" | "infographic"] ?? <FileText className="size-4" />;

  const typeLabelMap: Record<string, string> = {
    news: "Berita",
    digital_publication: "Buku Digital",
    infographic: "Infografis",
  };
  const typeLabel = typeLabelMap[formData.type] ?? formData.type;

  // ─── Upload zone renderers ───────────────────────────────────────────────────

  function renderPDFUpload() {
    const hasPDF = pdfFileObj || formData.fileUrl;
    const pdfSrc = pdfFileObj?.previewUrl || formData.fileUrl;
    return (
      <div className="flex flex-col gap-3">
        {!hasPDF ? (
          <label
            htmlFor="pub-pdf-upload"
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d6ddeb] bg-gray-50/50 p-8 text-center transition cursor-pointer hover:bg-gray-50 hover:border-[#4b7fe0]/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Upload className="size-5 text-[#4b7fe0]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Klik untuk unggah dokumen PDF
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Format: PDF · Maks. {formData.type === "digital_publication" ? "50 MB" : "25 MB"}
              </p>
            </div>
            <input
              id="pub-pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "fileUrl")}
            />
          </label>
        ) : (
          <div className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-sm">
                  {pdfFileObj?.name || formData.fileUrl.split("/").pop()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {pdfSrc && (
                  <a
                    href={pdfSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Eye className="size-3.5" /> Pratinjau
                  </a>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={() => {
                    if (pdfFileObj?.previewUrl) URL.revokeObjectURL(pdfFileObj.previewUrl);
                    setPdfFileObj(null);
                    setFormData((prev) => ({ ...prev, fileUrl: "" }));
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="h-96 w-full bg-gray-100">
              <object
                data={pdfSrc}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-gray-500">
                  <FileText className="size-8 text-gray-300" />
                  <span>Pratinjau PDF tidak tersedia di browser ini.</span>
                  <a
                    href={pdfSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                  >
                    Buka di tab baru
                  </a>
                </div>
              </object>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderImageUpload(labelText: string, acceptHint: string, uploadId: string) {
    const hasImage = imageFileObj || formData.imageUrl;
    return (
      <div className="flex flex-col gap-3">
        {!hasImage ? (
          <label
            htmlFor={uploadId}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d6ddeb] bg-gray-50/50 p-8 text-center transition cursor-pointer hover:bg-gray-50 hover:border-[#4b7fe0]/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <ImageIcon className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{labelText}</p>
              <p className="text-xs text-gray-400 mt-0.5">{acceptHint}</p>
            </div>
            <input
              id={uploadId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "imageUrl")}
            />
          </label>
        ) : (
          <div className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-sm">
                  {imageFileObj?.name || formData.imageUrl.split("/").pop()}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => {
                  if (imageFileObj?.previewUrl) URL.revokeObjectURL(imageFileObj.previewUrl);
                  setImageFileObj(null);
                  setFormData((prev) => ({ ...prev, imageUrl: "" }));
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center bg-gray-100 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageFileObj?.previewUrl || formData.imageUrl}
                alt="Preview"
                className="max-h-80 object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 w-full">

      {/* ── BERITA FORM ─────────────────────────────────────────── */}
      {formData.type === "news" && (
        <>
          {/* Section 1: Info Utama */}
          <SectionCard
            icon={<Newspaper className="size-4" />}
            stepLabel="Langkah 1 dari 3"
            title="Informasi Berita"
            description="Isi judul, konten berita, tanggal, dan sumber OPD."
            iconBgClass="bg-[#b91c1c]"
            gradientFrom="from-[#fef2f2]"
          >
            {/* Judul Berita */}
            <Field label="Judul Berita" required error={errors.title} hint="Tuliskan judul berita yang singkat, jelas, dan informatif.">
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Bupati Bulungan Resmikan Gedung DKIP Baru"
                className={`h-11 rounded-xl ${errors.title ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Isi Berita */}
            <Field label="Isi Berita" required error={errors.content} hint="Tuliskan isi berita secara lengkap dan informatif.">
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Tuliskan isi berita di sini..."
                rows={8}
                className={`rounded-xl resize-none ${errors.content ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Tanggal Berita */}
            <Field label="Tanggal Berita" required error={errors.publishDate} hint="Format: DD/MM/YYYY — Contoh: 21/05/2026">
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                <Input
                  id="publishDate"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={(e) => {
                    // Allow only digits and slashes, auto-insert slashes
                    let raw = e.target.value.replace(/[^\d/]/g, "");
                    // Auto-format: add slash after DD and MM
                    const digits = raw.replace(/\//g, "");
                    let formatted = digits;
                    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
                    if (digits.length > 4) formatted = formatted.slice(0, 5) + "/" + digits.slice(4, 8);
                    setFormData((prev) => ({ ...prev, publishDate: formatted }));
                    if (errors.publishDate) setErrors((prev) => ({ ...prev, publishDate: "" }));
                  }}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className={`h-11 rounded-xl pl-10 ${errors.publishDate ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
                />
              </div>
            </Field>

            {/* OPD Sumber */}
            <Field label="OPD Sumber" required error={errors.organizationId} hint="Pilih Organisasi Perangkat Daerah sumber berita ini.">
              <SearchableOPDSelect
                value={formData.organizationId}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, organizationId: val }));
                  if (errors.organizationId) setErrors((prev) => ({ ...prev, organizationId: "" }));
                }}
                options={opdOptions}
                disabled={isProdusen}
                hasError={!!errors.organizationId}
              />
            </Field>
          </SectionCard>

          {/* Section 2: Thumbnail */}
          <SectionCard
            icon={<ImageIcon className="size-4" />}
            stepLabel="Langkah 2 dari 3"
            title="Dokumentasi Kegiatan / Thumbnail"
            description="Unggah foto atau gambar utama sebagai thumbnail berita."
            iconBgClass="bg-emerald-600"
            gradientFrom="from-[#edfaf3]"
          >
            <Field label="Dokumentasi Kegiatan / Thumbnail" required error={errors.imageUrl}>
              {renderImageUpload(
                "Klik untuk unggah gambar thumbnail",
                "Format: JPG, PNG, WebP, GIF · Maks. 10 MB",
                "news-img-upload",
              )}
            </Field>
          </SectionCard>
        </>
      )}

      {/* ── BUKU DIGITAL FORM ────────────────────────────────────── */}
      {formData.type === "digital_publication" && (
        <>
          {/* Section 1: Info */}
          <SectionCard
            icon={<BookOpen className="size-4" />}
            stepLabel="Langkah 1 dari 3"
            title="Informasi Buku Digital"
            description="Isi judul, ringkasan, tahun, dan sumber OPD buku digital."
            iconBgClass="bg-[#1e2f52]"
            gradientFrom="from-[#eef3fb]"
          >
            {/* Judul Buku */}
            <Field label="Judul Buku" required error={errors.title} hint="Tuliskan judul lengkap buku digital.">
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Kabupaten Bulungan Dalam Angka 2025"
                className={`h-11 rounded-xl ${errors.title ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Deskripsi */}
            <Field label="Deskripsi Singkat / Ringkasan" required error={errors.description} hint="Tuliskan ringkasan singkat isi buku digital.">
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi singkat atau ringkasan isi buku..."
                rows={4}
                className={`rounded-xl resize-none ${errors.description ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Tahun Publikasi */}
            <Field label="Tahun Publikasi" required error={errors.year} hint="Contoh: 2025">
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="2025"
                maxLength={4}
                className={`h-11 rounded-xl max-w-[180px] ${errors.year ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* OPD Sumber */}
            <Field label="OPD Sumber" required error={errors.organizationId} hint="Pilih Organisasi Perangkat Daerah penerbit buku digital ini.">
              <SearchableOPDSelect
                value={formData.organizationId}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, organizationId: val }));
                  if (errors.organizationId) setErrors((prev) => ({ ...prev, organizationId: "" }));
                }}
                options={opdOptions}
                disabled={isProdusen}
                hasError={!!errors.organizationId}
              />
            </Field>
          </SectionCard>

          {/* Section 2: Dokumen PDF */}
          <SectionCard
            icon={<FileText className="size-4" />}
            stepLabel="Langkah 2 dari 3"
            title="Dokumen Buku Digital"
            description="Unggah berkas PDF buku digital (maks. 50 MB)."
            iconBgClass="bg-blue-600"
            gradientFrom="from-[#eff6ff]"
          >
            <Field label="Dokumen Buku Digital (.pdf)" required error={errors.fileUrl}>
              {renderPDFUpload()}
            </Field>
          </SectionCard>
        </>
      )}

      {/* ── INFOGRAFIS FORM ──────────────────────────────────────── */}
      {formData.type === "infographic" && (
        <>
          {/* Section 1: Info */}
          <SectionCard
            icon={<LayoutTemplate className="size-4" />}
            stepLabel="Langkah 1 dari 3"
            title="Informasi Infografis"
            description="Isi judul, ringkasan, tahun, dan sumber OPD infografis."
            iconBgClass="bg-violet-600"
            gradientFrom="from-[#f5f3ff]"
          >
            {/* Judul */}
            <Field label="Judul Infografis" required error={errors.title} hint="Tuliskan judul infografis yang ringkas dan deskriptif.">
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Statistik Penduduk Kabupaten Bulungan 2025"
                className={`h-11 rounded-xl ${errors.title ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Deskripsi */}
            <Field label="Deskripsi Singkat / Ringkasan" required error={errors.description} hint="Jelaskan secara singkat apa yang divisualisasikan dalam infografis ini.">
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi singkat atau ringkasan infografis..."
                rows={4}
                className={`rounded-xl resize-none ${errors.description ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* Tahun Publikasi */}
            <Field label="Tahun Publikasi" required error={errors.year} hint="Contoh: 2025">
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="2025"
                maxLength={4}
                className={`h-11 rounded-xl max-w-[180px] ${errors.year ? "border-red-400 focus-visible:ring-red-400" : "border-[#d6ddeb]"}`}
              />
            </Field>

            {/* OPD Sumber */}
            <Field label="OPD Sumber" required error={errors.organizationId} hint="Pilih Organisasi Perangkat Daerah penyedia infografis ini.">
              <SearchableOPDSelect
                value={formData.organizationId}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, organizationId: val }));
                  if (errors.organizationId) setErrors((prev) => ({ ...prev, organizationId: "" }));
                }}
                options={opdOptions}
                disabled={isProdusen}
                hasError={!!errors.organizationId}
              />
            </Field>
          </SectionCard>

          {/* Section 2: Dokumen Infografis */}
          <SectionCard
            icon={<ImageIcon className="size-4" />}
            stepLabel="Langkah 2 dari 3"
            title="Dokumen Infografis"
            description="Unggah berkas gambar infografis (JPG, PNG, WebP, GIF — maks. 15 MB)."
            iconBgClass="bg-emerald-600"
            gradientFrom="from-[#edfaf3]"
          >
            <Field label="Dokumen Infografis (.jpg, .png, dll)" required error={errors.imageUrl}>
              {renderImageUpload(
                "Klik untuk unggah gambar infografis",
                "Format: JPG, PNG, WebP, GIF · Maks. 15 MB",
                "infographic-img-upload",
              )}
            </Field>
          </SectionCard>
        </>
      )}

      {/* ── Other types (regulation, technical_guide) ─────────── */}
      {!["news", "digital_publication", "infographic"].includes(formData.type) && (
        <SectionCard
          icon={typeIcon}
          stepLabel="Informasi Konten"
          title={`Tambah ${typeLabel}`}
          description="Lengkapi informasi konten yang akan dipublikasikan."
          iconBgClass="bg-[#1e2f52]"
          gradientFrom="from-[#eef3fb]"
        >
          <Field label="Judul" required error={errors.title}>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Masukkan judul..."
              className={`h-11 rounded-xl ${errors.title ? "border-red-400" : "border-[#d6ddeb]"}`}
            />
          </Field>
          <Field label="OPD Sumber" required error={errors.organizationId}>
            <SearchableOPDSelect
              value={formData.organizationId}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, organizationId: val }));
                if (errors.organizationId) setErrors((prev) => ({ ...prev, organizationId: "" }));
              }}
              options={opdOptions}
              disabled={isProdusen}
              hasError={!!errors.organizationId}
            />
          </Field>
        </SectionCard>
      )}

      {/* ── Summary Section (Step 3 label) ────────────────────── */}
      <SectionCard
        icon={<CheckCircle2 className="size-4" />}
        stepLabel="Langkah 3 dari 3"
        title="Konfirmasi & Simpan"
        description="Pastikan semua informasi sudah benar sebelum menyimpan atau mempublikasikan."
        iconBgClass="bg-gray-700"
        gradientFrom="from-[#f9fafb]"
      >
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800 mb-2">Ringkasan</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">Jenis</span>
            <span className="font-medium text-gray-800">{typeLabel}</span>
            <span className="text-gray-400 uppercase tracking-wide font-semibold">Judul</span>
            <span className="font-medium text-gray-800 truncate">{formData.title || "—"}</span>
            <span className="text-gray-400 uppercase tracking-wide font-semibold">OPD</span>
            <span className="font-medium text-gray-800 truncate">
              {opdOptions.find((o) => o.value === formData.organizationId)?.label?.split(" — ")[0] || "—"}
            </span>
            {formData.type === "news" && (
              <>
                <span className="text-gray-400 uppercase tracking-wide font-semibold">Tanggal</span>
                <span className="font-medium text-gray-800">{formData.publishDate || "—"}</span>
              </>
            )}
            {(formData.type === "digital_publication" || formData.type === "infographic") && (
              <>
                <span className="text-gray-400 uppercase tracking-wide font-semibold">Tahun</span>
                <span className="font-medium text-gray-800">{formData.year || "—"}</span>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full px-6 h-11 font-semibold cursor-pointer border-gray-200"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>

        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6 h-11 font-semibold cursor-pointer border-gray-200 gap-1.5"
          onClick={() => requestSubmit("draft")}
          disabled={isSubmitting}
        >
          <Save className="size-4" />
          Simpan Draft
        </Button>

        {isProdusen && (
          <Button
            type="button"
            className="rounded-full px-6 h-11 font-semibold cursor-pointer bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={() => requestSubmit("submit_review")}
            disabled={isSubmitting}
          >
            <Send className="size-4" />
            Ajukan ke Walidata
          </Button>
        )}

        {canManageAll && (
          <Button
            type="button"
            className="rounded-full px-7 h-11 bg-[var(--color-primary)] font-bold text-white transition-all hover:bg-[#8f1717] active:scale-[0.98] cursor-pointer gap-1.5"
            onClick={() => requestSubmit("publish")}
            disabled={isSubmitting}
          >
            <CheckCircle2 className="size-4" />
            {isSubmitting ? "Menyimpan..." : "Publish Sekarang"}
          </Button>
        )}
      </div>

      {/* ── Toast Notifications ────────────────────────────────── */}
      <ToastNotification
        message={errorMessage}
        type="error"
        onClose={() => setErrorMessage(null)}
      />
      <ToastNotification
        message={successMessage}
        type="success"
        onClose={() => setSuccessMessage(null)}
      />

      {/* ── Confirmation Dialogs ───────────────────────────────── */}
      <ConfirmationDialog
        open={confirmAction === "draft"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Simpan sebagai Draft?"
        description={`Konten "${formData.title || typeLabel}" akan disimpan sebagai draft dan belum dipublikasikan ke portal publik.`}
        confirmLabel="Ya, Simpan Draft"
        cancelLabel="Batal"
        onConfirm={() => handleConfirmSubmit("draft")}
      />

      <ConfirmationDialog
        open={confirmAction === "submit_review"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Ajukan ke Walidata?"
        description={`Konten "${formData.title || typeLabel}" akan diajukan untuk ditinjau oleh Walidata. Pastikan semua data sudah lengkap dan benar.`}
        confirmLabel="Ya, Ajukan Sekarang"
        cancelLabel="Batal"
        onConfirm={() => handleConfirmSubmit("submit_review")}
      />

      <ConfirmationDialog
        open={confirmAction === "publish"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Publish Konten Sekarang?"
        description={`Konten "${formData.title || typeLabel}" akan langsung dipublikasikan ke portal publik. Pastikan semua data sudah benar.`}
        confirmLabel="Ya, Publish Sekarang"
        cancelLabel="Batal"
        onConfirm={() => handleConfirmSubmit("publish")}
      />
    </div>
  );
}
