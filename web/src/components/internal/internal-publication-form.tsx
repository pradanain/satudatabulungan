"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InternalOrganization, InternalSession, InternalPublication, ContentType } from "@/lib/types/internal";
import { hasPermission } from "@/lib/utils/internal-auth";
import { AlertCircle, CheckCircle2, Upload, FileText, ImageIcon, X } from "lucide-react";

interface InternalPublicationFormProps {
  mode: "create" | "edit";
  session: InternalSession;
  organizations: InternalOrganization[];
  initialData?: InternalPublication;
  fixedType?: ContentType;
}

export function InternalPublicationForm({ mode, session, organizations, initialData, fixedType }: InternalPublicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProdusen = session.role === "produsen";
  const canManageAll = hasPermission(session, "content.manage_all");

  const defaultType = fixedType || initialData?.type || (isProdusen ? "digital_publication" : "news") as ContentType;

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: defaultType,
    description: initialData?.description || "",
    content: initialData?.content || "",
    fileUrl: initialData?.fileUrl || "",
    imageUrl: initialData?.imageUrl || "",
    organizationId: isProdusen ? session.organizationId : (initialData?.organizationId || ""),
    year: initialData?.year || new Date().getFullYear().toString(),
    regulationNumber: initialData?.regulationNumber || "",
  });

  const [pdfFileObj, setPdfFileObj] = useState<{ name: string; base64: string } | null>(null);
  const [imageFileObj, setImageFileObj] = useState<{ name: string; base64: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "fileUrl" | "imageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    // PDF Validation
    if (field === "fileUrl") {
      if (file.type !== "application/pdf" || ext !== "pdf") {
        return setErrorMessage("Format file tidak didukung. Gunakan PDF.");
      }

      let maxSize = 25 * 1024 * 1024;
      let maxSizeLabel = "25 MB";
      if (formData.type === "digital_publication") {
        maxSize = 50 * 1024 * 1024;
        maxSizeLabel = "50 MB";
      }

      if (file.size > maxSize) {
        return setErrorMessage(`Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.`);
      }
    }

    // Image Validation
    if (field === "imageUrl") {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        return setErrorMessage("Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.");
      }

      let maxSize = 10 * 1024 * 1024;
      let maxSizeLabel = "10 MB";
      if (formData.type === "infographic") {
        maxSize = 15 * 1024 * 1024;
        maxSizeLabel = "15 MB";
      }

      if (file.size > maxSize) {
        return setErrorMessage(`Ukuran file terlalu besar. Maksimum ${maxSizeLabel}.`);
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (field === "fileUrl") {
        setPdfFileObj({ name: file.name, base64 });
      } else {
        setImageFileObj({ name: file.name, base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent, submitType: "draft" | "publish" | "submit_review") => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.title) return setErrorMessage("Judul wajib diisi.");
    if (!formData.type) return setErrorMessage("Jenis konten wajib dipilih.");
    if (!formData.organizationId) return setErrorMessage("OPD/Sumber wajib dipilih.");

    const finalFileUrl = pdfFileObj?.base64 || formData.fileUrl;
    const finalImageUrl = imageFileObj?.base64 || formData.imageUrl;

    if (["digital_publication", "regulation", "technical_guide"].includes(formData.type) && !finalFileUrl) {
      return setErrorMessage("Dokumen PDF wajib diunggah untuk jenis konten ini.");
    }
    if (formData.type === "infographic" && !finalImageUrl) {
      return setErrorMessage("Gambar wajib diunggah untuk Infografis.");
    }
    if (formData.type === "news" && !formData.content) {
      return setErrorMessage("Konten berita wajib diisi.");
    }

    setIsSubmitting(true);

    try {
      let finalStatus = "Draft";
      if (submitType === "publish") finalStatus = "Published";
      if (submitType === "submit_review") finalStatus = "Submitted";

      // Upload file PDF if exists
      let uploadedFileUrl = formData.fileUrl;
      if (pdfFileObj) {
        const uploadRes = await fetch("/api/internal/uploads/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: pdfFileObj.name,
            fileContent: pdfFileObj.base64,
            contentType: formData.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Gagal mengunggah berkas PDF.");
        }
        uploadedFileUrl = uploadData.url;
      }

      // Upload image if exists
      let uploadedImageUrl = formData.imageUrl;
      if (imageFileObj) {
        const uploadRes = await fetch("/api/internal/uploads/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: imageFileObj.name,
            fileContent: imageFileObj.base64,
            contentType: formData.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Gagal mengunggah berkas Gambar.");
        }
        uploadedImageUrl = uploadData.url;
      }

      const payload = {
        ...formData,
        fileUrl: uploadedFileUrl,
        imageUrl: uploadedImageUrl,
        status: finalStatus,
      };

      const endpoint = mode === "create" ? `/api/internal/publications` : `/api/internal/publications/${initialData?.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan konten.");
      }

      setSuccessMessage(mode === "create" ? "Konten berhasil ditambahkan." : "Konten berhasil diperbarui.");
      setTimeout(() => {
        router.push("/internal/publications");
        router.refresh();
      }, 1000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl border-[var(--color-border)]">
      <CardContent className="p-6">
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200/50">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200/50">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
        )}

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="title" className="text-sm font-medium leading-none">Judul <span className="text-red-500">*</span></label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Masukkan judul konten..."
                required
              />
            </div>

            {!fixedType && (
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium leading-none">Jenis Konten <span className="text-red-500">*</span></label>
              <Select value={formData.type} onValueChange={(val) => handleSelectChange("type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis konten" />
                </SelectTrigger>
                <SelectContent>
                  {isProdusen ? (
                    <>
                      <SelectItem value="news">Berita</SelectItem>
                      <SelectItem value="digital_publication">Publikasi Digital</SelectItem>
                      <SelectItem value="infographic">Infografis</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="news">Berita</SelectItem>
                      <SelectItem value="digital_publication">Publikasi Digital</SelectItem>
                      <SelectItem value="infographic">Infografis</SelectItem>
                      <SelectItem value="regulation">Regulasi</SelectItem>
                      <SelectItem value="technical_guide">Petunjuk Teknis</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            )}

            <div className="space-y-2">
              <label htmlFor="organizationId" className="text-sm font-medium leading-none">OPD / Sumber <span className="text-red-500">*</span></label>
              <Select
                value={formData.organizationId}
                onValueChange={(val) => handleSelectChange("organizationId", val)}
                disabled={isProdusen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih OPD sumber" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">Deskripsi Singkat / Ringkasan</label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi singkat atau ringkasan..."
                rows={3}
              />
            </div>

            {formData.type === "news" && (
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="content" className="text-sm font-medium leading-none">Isi Berita <span className="text-red-500">*</span></label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Tuliskan isi berita di sini..."
                  rows={8}
                />
              </div>
            )}

            {["digital_publication", "regulation", "technical_guide"].includes(formData.type) && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium leading-none">Dokumen PDF <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-3">
                  {!pdfFileObj && !formData.fileUrl ? (
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> atau seret dokumen</p>
                          <p className="text-xs text-gray-500">Format: PDF (Maks. {formData.type === "digital_publication" ? "50 MB" : "25 MB"})</p>
                        </div>
                        <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, "fileUrl")} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">{pdfFileObj?.name || formData.fileUrl.split("/").pop()}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => { setPdfFileObj(null); setFormData((prev) => ({ ...prev, fileUrl: "" })); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="h-96 w-full bg-gray-100">
                        <object data={pdfFileObj?.base64 || formData.fileUrl} type="application/pdf" className="w-full h-full">
                          <div className="flex items-center justify-center h-full text-sm text-gray-500">Pratinjau PDF tidak tersedia di browser ini.</div>
                        </object>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {["news", "infographic", "digital_publication"].includes(formData.type) && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium leading-none">Gambar / Thumbnail {formData.type === "infographic" && <span className="text-red-500">*</span>}</label>
                <div className="flex flex-col gap-3">
                  {!imageFileObj && !formData.imageUrl ? (
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> atau seret gambar</p>
                          <p className="text-xs text-gray-500">Format: JPG, PNG, WebP (Maks. {formData.type === "infographic" ? "15 MB" : "10 MB"})</p>
                        </div>
                        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "imageUrl")} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-emerald-500" />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">{imageFileObj?.name || formData.imageUrl.split("/").pop()}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => { setImageFileObj(null); setFormData((prev) => ({ ...prev, imageUrl: "" })); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-center bg-gray-100 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageFileObj?.base64 || formData.imageUrl} alt="Preview" className="max-h-80 object-contain rounded-md shadow-sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {["digital_publication", "regulation", "technical_guide"].includes(formData.type) && (
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium leading-none">Tahun Dokumen</label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2026"
                />
              </div>
            )}

            {formData.type === "regulation" && (
              <div className="space-y-2">
                <label htmlFor="regulationNumber" className="text-sm font-medium leading-none">Nomor Regulasi</label>
                <Input
                  id="regulationNumber"
                  name="regulationNumber"
                  value={formData.regulationNumber}
                  onChange={handleChange}
                  placeholder="Contoh: No. 12 Tahun 2026"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={isSubmitting}
            >
              Simpan Draft
            </Button>

            {isProdusen && (
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "submit_review")}
                disabled={isSubmitting}
              >
                Ajukan ke Walidata
              </Button>
            )}

            {canManageAll && (
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "publish")}
                disabled={isSubmitting}
              >
                Publish Sekarang
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

