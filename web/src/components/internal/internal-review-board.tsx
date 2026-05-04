"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import type { InternalRole } from "@/lib/types/internal";
import type { DatasetStatus } from "@/lib/types/dataset";
import {
  getNextStatuses,
  type WorkflowItem,
  workflowLaneOrder,
} from "@/lib/types/workflow";
import { formatIndonesianDate } from "@/lib/utils/formatters";

type InternalReviewBoardProps = {
  items: WorkflowItem[];
  role: InternalRole;
};

const statusActionLabel: Record<DatasetStatus, string> = {
  Draft: "Ajukan Review",
  Submitted: "Kirim",
  "Need Revision": "Ajukan Ulang",
  Approved: "Publikasikan",
  Published: "Arsipkan",
  Archived: "Selesai",
};

function isTransitionVisible(role: InternalRole, from: DatasetStatus, to: DatasetStatus): boolean {
  if (role === "admin") {
    return true;
  }

  if (role === "operator_opd") {
    return (from === "Draft" && to === "Submitted") || (from === "Need Revision" && to === "Submitted");
  }

  return (
    (from === "Submitted" && (to === "Need Revision" || to === "Approved")) ||
    (from === "Approved" && to === "Published") ||
    (from === "Published" && to === "Archived")
  );
}

export function InternalReviewBoard({ items, role }: InternalReviewBoardProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleTransition(item: WorkflowItem, nextStatus: DatasetStatus) {
    setPendingId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const reviewNote =
      nextStatus === "Need Revision"
        ? "Perlu perapihan metadata, tags, dan deskripsi resource."
        : nextStatus === "Published"
          ? "Dataset dipublikasikan ke portal publik."
          : undefined;

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
          reviewNote,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Transisi workflow gagal diproses.");
      }

      setSuccessMessage(`${item.title} berhasil dipindahkan ke status ${nextStatus}.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memperbarui workflow.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-4">
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

      <div className="grid gap-4 xl:grid-cols-3">
        {workflowLaneOrder.map((lane) => {
          const laneItems = items.filter((item) => item.status === lane);
          return (
            <Card key={lane} className="internal-surface overflow-hidden border-transparent shadow-none">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                <InternalStatusBadge status={lane} />
                <span className="text-sm font-semibold text-[var(--color-muted)]">{laneItems.length}</span>
              </div>
              <div className="grid gap-3 p-4">
                {laneItems.length === 0 ? (
                  <p className="m-0 text-sm text-[var(--color-muted)]">Belum ada dataset pada status ini.</p>
                ) : (
                  laneItems.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div>
                        <h3 className="m-0 text-base font-semibold">{item.title}</h3>
                        <p className="mb-0 mt-1 text-sm text-[var(--color-muted)]">{item.organization}</p>
                        <p className="mb-0 mt-2 text-xs text-[var(--color-muted)]">
                          Update {formatIndonesianDate(item.lastUpdated)} - {item.resourceCount} resource
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="secondary" size="sm" className="rounded-full">
                          <Link href={`/internal/datasets/${item.slug}`}>Buka Form</Link>
                        </Button>
                        {item.status === "Published" ? (
                          <Button asChild variant="secondary" size="sm" className="rounded-full">
                            <Link href={`/dataset/${item.slug}`}>Lihat Publik</Link>
                          </Button>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getNextStatuses(item.status)
                          .filter((nextStatus) => isTransitionVisible(role, item.status, nextStatus))
                          .map((nextStatus) => (
                            <Button
                              key={`${item.slug}-${nextStatus}`}
                              type="button"
                              size="sm"
                              className="rounded-full"
                              disabled={pendingId === item.id}
                              onClick={() => handleTransition(item, nextStatus)}
                            >
                              {pendingId === item.id ? "Menyimpan..." : statusActionLabel[nextStatus]}
                            </Button>
                          ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

