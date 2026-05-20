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

type InternalWorkflowActionsProps = {
  dataset: InternalDataset;
  session: InternalSession;
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

export function InternalWorkflowActions({ dataset, session }: InternalWorkflowActionsProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showConfirmTransition, setShowConfirmTransition] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<DatasetStatus | null>(null);

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

  const nextStatuses = getNextStatuses(dataset.status).filter((nextStatus) =>
    isTransitionVisible(session.role, dataset.status, nextStatus)
  );

  if (nextStatuses.length === 0) {
    return null; // No actions available for current role/status
  }

  return (
    <Card className="p-4 shadow-sm border border-slate-200">
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />

      <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Aksi Workflow</h3>
      <div className="flex flex-col gap-2">
        {nextStatuses.map((nextStatus) => {
          const isRevision = nextStatus === "Need Revision";
          const label = getActionLabel(dataset.status, nextStatus);
          return (
            <Button
              key={nextStatus}
              type="button"
              className={cn(
                "w-full text-xs h-10 font-semibold rounded-xl transition-all",
                isRevision 
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
    </Card>
  );
}
