"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { hasPermission } from "@/lib/utils/internal-auth";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  ExternalLink,
  FileText,
  ImageIcon,
  Send,
  ShieldCheck,
  RotateCcw,
  Globe,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { InternalPublication, InternalSession, ContentType } from "@/lib/types/internal";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";

const typeLabelMap: Record<ContentType, string> = {
  news: "Berita",
  digital_publication: "Buku Digital",
  infographic: "Infografis",
  regulation: "Regulasi",
  technical_guide: "Petunjuk Teknis",
};

interface PublicationDetailProps {
  publication: InternalPublication;
  session: InternalSession;
  backHref: string;
  backLabel: string;
  editHref: string;
}

export function InternalPublicationDetail({
  publication: pub,
  session,
  backHref,
  backLabel,
  editHref,
}: PublicationDetailProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageAll = hasPermission(session, "content.manage_all");
  const isOwner = pub.organizationId === session.organizationId || pub.createdByUserId === session.userId;
  const canEdit =
    canManageAll ||
    (hasPermission(session, "content.edit_own_draft") && isOwner && ["Draft", "Need Revision"].includes(pub.status));

  const canSubmit = isOwner && ["Draft", "Need Revision"].includes(pub.status);
  const canApprove = canManageAll && pub.status === "Submitted";
  const canRevise = canManageAll && pub.status === "Submitted";
  const canPublish = canManageAll && ["Submitted", "Approved"].includes(pub.status);

  async function handleTransition(action: string) {
    setIsTransitioning(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/internal/publications/${pub.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengubah status.");
      }
      setSuccessMessage(data.message || "Status berhasil diubah.");
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsTransitioning(false);
      setConfirmAction(null);
    }
  }

  const statusSteps = ["Draft", "Submitted", "Approved", "Published"];
  const currentIdx = statusSteps.indexOf(pub.status === "Need Revision" ? "Draft" : pub.status);

  return (
    <>
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />

      {/* Back button */}
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
          <Link href={backHref}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-gray-500">{backLabel}</span>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">{pub.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabelMap[pub.type] || pub.type}</Badge>
            <InternalStatusBadge status={pub.status} />
            {pub.status === "Need Revision" && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Perlu Revisi</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Dikelola oleh {pub.organizationName} • Dibuat pada {formatIndonesianDate(pub.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canEdit && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={editHref}>
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </Button>
          )}
          {canSubmit && (
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setConfirmAction("submit")} disabled={isTransitioning}>
              <Send className="w-4 h-4" />
              Ajukan ke Walidata
            </Button>
          )}
          {canApprove && (
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmAction("approve")} disabled={isTransitioning}>
              <ShieldCheck className="w-4 h-4" />
              Setujui
            </Button>
          )}
          {canRevise && (
            <Button variant="outline" className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50" onClick={() => setConfirmAction("revise")} disabled={isTransitioning}>
              <RotateCcw className="w-4 h-4" />
              Minta Revisi
            </Button>
          )}
          {canPublish && (
            <Button className="gap-2 bg-[var(--color-primary)] hover:bg-[#8f1717]" onClick={() => setConfirmAction("publish")} disabled={isTransitioning}>
              <Globe className="w-4 h-4" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <Card className="border-[var(--color-border)] shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs font-bold transition-colors ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  } ${isCurrent ? "ring-2 ring-emerald-300 ring-offset-2" : ""}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCompleted ? "text-emerald-700" : "text-gray-400"}`}>
                    {step}
                  </span>
                  {i < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted && i < currentIdx ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[var(--color-border)] shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {/* Description */}
              {pub.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Deskripsi</h3>
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{pub.description}</p>
                </div>
              )}

              {/* News content */}
              {pub.type === "news" && pub.content && (
                <div className="space-y-2 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Isi Berita</h3>
                  <div className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">{pub.content}</div>
                </div>
              )}

              {/* PDF Preview */}
              {pub.type === "digital_publication" && pub.fileUrl && (
                <div className="space-y-3 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Pratinjau Dokumen</h3>
                  <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50 p-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">{pub.fileUrl.split("/").pop()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="gap-1.5 h-8">
                          <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> Buka PDF
                          </a>
                        </Button>
                        <Button asChild size="sm" className="gap-1.5 h-8">
                          <a href={pub.fileUrl} download>
                            <Download className="w-3.5 h-3.5" /> Unduh
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="h-[550px] w-full bg-gray-100">
                      <object data={pub.fileUrl} type="application/pdf" className="w-full h-full">
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-sm text-gray-500 space-y-4">
                          <FileText className="w-16 h-16 text-gray-400" />
                          <p className="font-semibold text-gray-800">Pratinjau PDF tidak tersedia.</p>
                        </div>
                      </object>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {(pub.type === "infographic" || pub.imageUrl) && pub.imageUrl && (
                <div className="space-y-3 border-t pt-4 border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    {pub.type === "infographic" ? "Gambar Infografis" : "Gambar / Thumbnail"}
                  </h3>
                  <div className="flex justify-center bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pub.imageUrl}
                      alt={pub.title}
                      className={`max-h-[500px] rounded-lg shadow-sm ${
                        pub.type === "infographic" ? "object-contain w-full" : "object-cover"
                      }`}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-[var(--color-border)] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Informasi Metadata</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Building className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Organisasi / OPD</p>
                    <p className="text-sm font-medium text-gray-800">{pub.organizationName}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">
                      {pub.type === "news" ? "Tanggal Berita" : "Tahun Publikasi"}
                    </p>
                    <p className="text-sm font-medium text-gray-800">{pub.year || "Tidak ditentukan"}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
                <p>Status: <strong className="text-gray-700">{pub.status}</strong></p>
                <p>Terakhir diperbarui: <strong className="text-gray-700">{formatIndonesianDate(pub.updatedAt)}</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={confirmAction === "submit"}
        onOpenChange={() => setConfirmAction(null)}
        title="Ajukan ke Walidata?"
        description="Konten ini akan diajukan untuk diperiksa dan diverifikasi oleh Walidata/DKIP."
        confirmLabel="Ya, Ajukan"
        cancelLabel="Batal"
        onConfirm={() => handleTransition("submit")}
      />
      <ConfirmationDialog
        open={confirmAction === "approve"}
        onOpenChange={() => setConfirmAction(null)}
        title="Setujui Konten?"
        description="Konten ini akan disetujui dan siap untuk dipublikasikan."
        confirmLabel="Setujui"
        cancelLabel="Batal"
        onConfirm={() => handleTransition("approve")}
      />
      <ConfirmationDialog
        open={confirmAction === "revise"}
        onOpenChange={() => setConfirmAction(null)}
        title="Minta Revisi?"
        description="Konten akan dikembalikan ke produsen untuk direvisi."
        confirmLabel="Minta Revisi"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={() => handleTransition("revise")}
      />
      <ConfirmationDialog
        open={confirmAction === "publish"}
        onOpenChange={() => setConfirmAction(null)}
        title="Terbitkan Konten?"
        description="Konten ini akan dipublikasikan dan dapat diakses oleh publik."
        confirmLabel="Ya, Terbitkan"
        cancelLabel="Batal"
        onConfirm={() => handleTransition("publish")}
      />
    </>
  );
}
