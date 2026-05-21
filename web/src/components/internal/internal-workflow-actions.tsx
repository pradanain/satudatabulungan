"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";
import { getNextStatuses, getStatusLabel, type WorkflowItem } from "@/lib/types/workflow";
import type { DatasetStatus } from "@/lib/types/dataset";
import type { InternalRole, InternalSession, InternalDataset } from "@/lib/types/internal";
import { hasPermission } from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";
import { Trash2 } from "lucide-react";

type InternalWorkflowActionsProps = {
  dataset: InternalDataset;
  session: InternalSession;
  variant?: "card" | "inline";
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

function getTransitionPermission(to: DatasetStatus): string | null {
  switch (to) {
    case "Submitted": return "dataset.submit";
    case "Under Review": return "dataset.review";
    case "Need Revision": return "dataset.request_revision";
    case "Approved": return "dataset.approve";
    case "Published": return "dataset.publish";
    case "Archived": return "dataset.archive";
    default: return null;
  }
}

function isTransitionVisible(role: InternalRole, from: DatasetStatus, to: DatasetStatus): boolean {
  const perm = getTransitionPermission(to);
  if (!perm) return false;
  return hasPermission(role, perm as any);
}

function getActionLabel(from: DatasetStatus, to: DatasetStatus): string {
  if (from === "Need Revision" && to === "Submitted") return "Ajukan Ulang ke Walidata";
  if (from === "Archived" && to === "Published") return "Pulihkan Publikasi";
  return statusActionLabel[to] || to;
}

export function InternalWorkflowActions({ dataset, session, variant = "card" }: InternalWorkflowActionsProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showConfirmTransition, setShowConfirmTransition] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<DatasetStatus | null>(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine delete permission
  const canDeletePermanent = hasPermission(session, "dataset.delete_permanent"); // walidata
  const canDeleteDraft = hasPermission(session, "dataset.delete_draft_own_opd"); // produsen
  const isOwnOrg = dataset.organizationId === session.organizationId ||
    session.role === "walidata";

  const showDeleteButton =
    (canDeletePermanent) ||
    (canDeleteDraft && dataset.status === "Draft" && isOwnOrg);

  async function handleTransition(nextStatus: DatasetStatus) {
    setPendingId(dataset.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const reviewNote =
      nextStatus === "Need Revision"
        ? "Perlu perapihan metadata, tags, dan deskripsi resource."
        : nextStatus === "Published"
          ? "Dataset dipublikasikan ke portal publik."
          : nextStatus === "Under Review"
            ? "Walidata mulai memeriksa dataset."
            : nextStatus === "Approved"
              ? "Dataset dinilai layak untuk dipublikasikan."
              : undefined;

    try {
      const response = await fetch("/api/internal/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: dataset.slug,
          fromStatus: dataset.status,
          toStatus: nextStatus,
          reviewNote,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Transisi workflow gagal diproses.");
      }

      setSuccessMessage(`Dataset berhasil dipindahkan ke status ${getStatusLabel(nextStatus)}.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memperbarui workflow.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/internal/datasets/${dataset.slug}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Gagal menghapus dataset.");
      }
      router.push("/internal/datasets");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus dataset.");
      setIsDeleting(false);
    }
  }

  const nextStatuses = getNextStatuses(dataset.status).filter((nextStatus) =>
    isTransitionVisible(session.role, dataset.status, nextStatus)
  );

  if (nextStatuses.length === 0 && !showDeleteButton) {
    return null; // No actions available for current role/status
  }

  const deleteTooltip = canDeletePermanent
    ? "Hapus dataset secara permanen dari sistem dan CKAN."
    : "Hapus dataset yang masih berstatus Draft sebelum dikirim ke Walidata.";

  const innerContent = (
    <>
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />

      {variant === "card" && (
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Aksi Workflow</h3>
      )}
      <div className={cn("flex gap-2", variant === "card" ? "flex-col" : "flex-row flex-wrap")}>
        {nextStatuses.map((nextStatus) => {
          const isRevision = nextStatus === "Need Revision";
          const label = getActionLabel(dataset.status, nextStatus);
          return (
            <Button
              key={nextStatus}
              type="button"
              className={cn(
                "w-full text-xs h-10 font-semibold rounded-xl transition-all",
                variant === "inline" && "w-auto px-6 h-9 rounded-full",
                isRevision
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200"
                  : "bg-[var(--color-primary)] hover:bg-[#8f1717] text-white shadow-sm"
              )}
              variant={isRevision ? "outline" : "default"}
              disabled={pendingId === dataset.id}
              onClick={() => {
                setTransitionTarget(nextStatus);
                setShowConfirmTransition(true);
              }}
            >
              {pendingId === dataset.id && transitionTarget === nextStatus ? "Memproses..." : label}
            </Button>
          );
        })}

        {/* Delete Button */}
        {showDeleteButton && (
          <Button
            type="button"
            className={cn(
              "w-full text-xs h-10 font-semibold rounded-xl transition-all border",
              variant === "inline" && "w-auto px-5 h-9 rounded-full",
              "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
            )}
            variant="outline"
            disabled={isDeleting}
            title={deleteTooltip}
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="size-3.5 mr-1.5 shrink-0" />
            {isDeleting ? "Menghapus..." : "Hapus Dataset"}
          </Button>
        )}
      </div>

      {transitionTarget && (
        <ConfirmationDialog
          open={showConfirmTransition}
          onOpenChange={setShowConfirmTransition}
          title={`Ubah Status Dataset?`}
          description={`Apakah Anda yakin ingin memindahkan dataset ini ke status "${getStatusLabel(transitionTarget)}"?`}
          confirmLabel="Ya, Ubah Status"
          cancelLabel="Batal"
          variant={transitionTarget === "Need Revision" ? "destructive" : "default"}
          onConfirm={() => {
            handleTransition(transitionTarget);
          }}
        />
      )}

      <ConfirmationDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title="Hapus Dataset?"
        description={
          canDeletePermanent
            ? `Dataset "${dataset.title}" akan dihapus secara permanen dari sistem dan portal CKAN. Tindakan ini tidak dapat dibatalkan.`
            : `Dataset "${dataset.title}" akan dihapus. Dataset yang belum dikirim ke Walidata dapat dihapus oleh Operator OPD. Tindakan ini tidak dapat dibatalkan.`
        }
        confirmLabel="Ya, Hapus Sekarang"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );

  if (variant === "inline") {
    return innerContent;
  }

  return (
    <Card className="p-4 shadow-sm border border-slate-200">
      {innerContent}
    </Card>
  );
}

