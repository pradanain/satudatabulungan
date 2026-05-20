"use client";

import { useState } from "react";
import { FileText, BarChart3, Map, MessageSquare, Pencil } from "lucide-react";
import type { InternalRole, InternalSession, InternalOrganization, InternalTopicReference, InternalDataset } from "@/lib/types/internal";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";
import { InternalDatasetForm } from "@/components/internal/internal-dataset-form";
import type { DatasetUpdateInput } from "@/lib/types/internal";

type Tab = "form" | "geospatial" | "quality" | "notes";

type InternalDatasetDetailTabsProps = {
  readOnlyContent: React.ReactNode;
  qualityContent: React.ReactNode;
  geospatialContent: React.ReactNode | null;
  notesContent: React.ReactNode;
  metaSummaryContent: React.ReactNode;
  role: InternalRole;
  canEdit: boolean;
  
  // Form props
  session: InternalSession;
  dataset: InternalDataset;
  organizations: InternalOrganization[];
  topics: InternalTopicReference[];
};

const allTabs: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "form", label: "Dataset", icon: FileText },
  { key: "geospatial", label: "Geospasial", icon: Map },
  { key: "quality", label: "Skor Kualitas", icon: BarChart3 },
  { key: "notes", label: "Catatan", icon: MessageSquare },
];

export function InternalDatasetDetailTabs({
  readOnlyContent,
  qualityContent,
  geospatialContent,
  notesContent,
  metaSummaryContent,
  role,
  canEdit,
  session,
  dataset,
  organizations,
  topics,
}: InternalDatasetDetailTabsProps) {
  const [active, setActive] = useState<Tab>("form");
  const [isEditing, setIsEditing] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter out geospatial tab if no geospatial content
  let visibleTabs = allTabs;
  if (!geospatialContent) {
    visibleTabs = visibleTabs.filter((t) => t.key !== "geospatial");
  }

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl border border-[var(--color-border)] bg-white/60 p-1.5 backdrop-blur-sm overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (isEditing && tab.key !== "form") {
                  // Don't allow switching tabs while editing
                  return;
                }
                setActive(tab.key);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : isEditing && tab.key !== "form"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-text)]"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {active === "form" && (
          <div className="space-y-4">
            {isEditing ? (
              <InternalDatasetForm
                mode="edit"
                session={session}
                dataset={dataset}
                organizations={organizations}
                topics={topics}
                onCancel={() => setShowCancelConfirm(true)}
                onSuccess={(msg) => {
                  setSuccessMessage(msg || "Berhasil disimpan.");
                  setIsEditing(false);
                }}
              />
            ) : (
              <>
                {readOnlyContent}
                {metaSummaryContent}
                {canEdit && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={() => setShowEditConfirm(true)}
                      className="rounded-full px-6 h-11 bg-[var(--color-primary)] font-bold text-white transition-all hover:bg-[#8f1717] active:scale-[0.98] cursor-pointer"
                    >
                      <Pencil className="size-4 mr-2" />
                      Edit Dataset
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {active === "quality" && qualityContent}
        {active === "geospatial" && geospatialContent}
        {active === "notes" && notesContent}
      </div>

      {/* Confirm Edit Dialog */}
      <ConfirmationDialog
        open={showEditConfirm}
        onOpenChange={setShowEditConfirm}
        title="Edit Dataset?"
        description="Anda akan masuk ke mode edit untuk mengubah informasi dataset ini. Pastikan perubahan yang dilakukan sudah benar sebelum menyimpan."
        confirmLabel="Ya, Edit"
        cancelLabel="Batal"
        onConfirm={() => setIsEditing(true)}
      />

      {/* Confirm Cancel Edit Dialog */}
      <ConfirmationDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Batalkan Perubahan?"
        description="Perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin keluar dari mode edit?"
        confirmLabel="Ya, Batalkan"
        cancelLabel="Lanjut Edit"
        variant="destructive"
        onConfirm={() => setIsEditing(false)}
      />

      <ToastNotification 
        message={successMessage} 
        type="success" 
        onClose={() => setSuccessMessage(null)} 
      />
    </div>
  );
}
