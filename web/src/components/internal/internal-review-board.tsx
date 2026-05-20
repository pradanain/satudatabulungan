"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Inbox, CheckCircle2, Search, SlidersHorizontal, MessageSquare, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import type { InternalRole, DatasetNoteType } from "@/lib/types/internal";
import type { DatasetStatus } from "@/lib/types/dataset";
import { getNextStatuses, getStatusLabel, type WorkflowItem } from "@/lib/types/workflow";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { hasPermission } from "@/lib/utils/internal-auth";
import { cn } from "@/lib/utils/cn";
import { ClientDataTable, type ColumnDef } from "@/components/internal/client-data-table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/portal/confirmation-dialog";
import { ToastNotification } from "@/components/ui/toast-popup";

type InternalReviewBoardProps = {
  items: WorkflowItem[];
  role: InternalRole;
};

/** Indonesian action labels per target status */
const statusActionLabel: Record<DatasetStatus, string> = {
  Draft: "Draft",
  Submitted: "Ajukan ke Walidata",
  "Under Review": "Mulai Pemeriksaan",
  "Need Revision": "Minta Revisi",
  Approved: "Tandai Layak Publikasi",
  Published: "Publikasikan",
  Archived: "Arsipkan",
};

/** Map target status to required permission */
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
  // Special cases for resubmit and restore
  if (from === "Need Revision" && to === "Submitted") return "Ajukan Ulang ke Walidata";
  if (from === "Archived" && to === "Published") return "Pulihkan Publikasi";
  return statusActionLabel[to] || to;
}

const TABS = [
  { id: "semua", label: "Semua", statuses: [] as string[] },
  { id: "submitted", label: "Diajukan", statuses: ["Submitted"] },
  { id: "under-review", label: "Pemeriksaan", statuses: ["Under Review"] },
  { id: "need-revision", label: "Perlu Revisi", statuses: ["Need Revision"] },
  { id: "approved", label: "Layak Publikasi", statuses: ["Approved"] },
  { id: "published", label: "Dipublikasikan", statuses: ["Published"] },
];

export function InternalReviewBoard({ items, role }: InternalReviewBoardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("semua");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showConfirmTransition, setShowConfirmTransition] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<{ item: WorkflowItem; nextStatus: DatasetStatus } | null>(null);

  const [showInlineNoteForm, setShowInlineNoteForm] = useState(false);
  const [inlineMessage, setInlineMessage] = useState("");
  const [inlineCategory, setInlineCategory] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleOpenInlineNoteForm = () => {
    setShowInlineNoteForm(true);
    setInlineMessage("");
    if (role === "pembina") {
      setInlineCategory("quality_note");
    } else if (role === "sekretariat") {
      setInlineCategory("evaluation_note");
    } else {
      setInlineCategory("standard_note");
    }
  };

  const handleCloseInlineNoteForm = () => {
    setShowInlineNoteForm(false);
    setInlineMessage("");
  };

  const handleSubmitInlineNote = async (slug: string) => {
    if (!inlineMessage.trim()) return;
    setIsSubmittingNote(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    let type: DatasetNoteType;
    if (role === "pembina") {
      type = "pembina_recommendation";
    } else if (role === "sekretariat") {
      type = "sekretariat_monitoring";
    } else if (role === "walidata") {
      type = "walidata_review";
    } else {
      type = "produsen_follow_up";
    }

    try {
      const response = await fetch(`/api/internal/datasets/${slug}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category: inlineCategory,
          message: inlineMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan catatan.");
      }

      setSuccessMessage("Catatan berhasil ditambahkan.");
      setShowInlineNoteForm(false);
      setInlineMessage("");
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const activeTabDef = TABS.find(t => t.id === activeTab) || TABS[0];
  
  const filteredItems = items.filter(item => {
    if (activeTabDef.statuses.length > 0 && !activeTabDef.statuses.includes(item.status)) return false;
    return true;
  });

  const selectedItem = items.find(item => item.id === selectedItemId);

  async function handleTransition(item: WorkflowItem, nextStatus: DatasetStatus) {
    setPendingId(item.id);
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

      setSuccessMessage(`${item.title} berhasil dipindahkan ke status ${getStatusLabel(nextStatus)}.`);
      setSelectedItemId(null); // Close the dialog
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memperbarui workflow.");
    } finally {
      setPendingId(null);
    }
  }

  const columns: ColumnDef<WorkflowItem>[] = [
    {
      key: "title",
      header: "Dataset",
      render: (item) => (
        <div className="min-w-[280px] py-1">
          <button
            onClick={() => setSelectedItemId(item.id)}
            className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] text-left hover:underline transition-all block"
          >
            {item.title}
          </button>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.organization}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <div className="whitespace-nowrap">
          <InternalStatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: "resourceCount",
      header: "Resource",
      render: (item) => (
        <div className="whitespace-nowrap font-semibold text-slate-700">
          {item.resourceCount} File
        </div>
      ),
    },
    {
      key: "notes",
      header: "Catatan",
      render: (item) => {
        const hasPembina = item.notes?.some(n => n.type === "pembina_recommendation");
        const hasSekretariat = item.notes?.some(n => n.type === "sekretariat_monitoring");
        const hasWalidata = item.notes?.some(n => n.type === "walidata_review");
        const hasUnresolved = item.notes?.some(n => !n.isResolved);

        if (!hasPembina && !hasSekretariat && !hasWalidata) {
          return <span className="text-xs text-[var(--color-muted)]">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {hasPembina && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 py-0 px-2 font-semibold">
                Pembina
              </Badge>
            )}
            {hasSekretariat && (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 py-0 px-2 font-semibold">
                Sekretariat
              </Badge>
            )}
            {hasWalidata && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0 px-2 font-semibold">
                Walidata
              </Badge>
            )}
            {hasUnresolved && (
              <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200 py-0 px-2 font-extrabold animate-pulse">
                Ada Tindak Lanjut
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "lastUpdated",
      header: "Tanggal Masuk",
      render: (item) => (
        <div className="whitespace-nowrap text-[var(--color-muted)] font-medium">
          {formatIndonesianDate(item.lastUpdated)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      sortable: false,
      className: "text-right",
      render: (item) => (
        <Button
          onClick={() => setSelectedItemId(item.id)}
          variant="outline"
          size="sm"
          className="h-8 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          Review Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <ToastNotification message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      <ToastNotification message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />

      <div className="flex border-b border-[var(--color-border)] overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItemId(null); }}
            className={cn(
              "px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="shadow-sm border-[var(--color-border)] overflow-hidden bg-white">
        <ClientDataTable
          data={filteredItems}
          columns={columns}
          searchable={true}
          searchFn={(item, query) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.organization.toLowerCase().includes(query.toLowerCase())
          }
          emptyMessage="Tidak ada antrean review ditemukan."
        />
      </Card>

      <Dialog open={selectedItemId !== null} onOpenChange={(open) => { if (!open) setSelectedItemId(null); }}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
          {selectedItem && (
            <div className="flex flex-col">
              {/* Dialog Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <InternalStatusBadge status={selectedItem.status} className="bg-white/10 text-white border-white/20" />
                    </div>
                    <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                      {selectedItem.title}
                    </DialogTitle>
                    <p className="text-slate-300 text-sm mt-1 font-medium">{selectedItem.organization}</p>
                  </div>
                </div>
              </div>

              {/* Dialog Body */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6 overflow-y-auto max-h-[70vh]">
                {/* Left Column (3/5) - Info & Notes */}
                <div className="md:col-span-3 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                        <SlidersHorizontal className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Masuk</p>
                        <p className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">{formatIndonesianDate(selectedItem.lastUpdated)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resource</p>
                        <p className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">{selectedItem.resourceCount} File</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Recommendations */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <MessageSquare className="size-4 text-[var(--color-primary)]" />
                      Catatan & Rekomendasi ({selectedItem.notes?.length || 0})
                    </p>
                    {selectedItem.notes && selectedItem.notes.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 divide-y divide-slate-100">
                        {selectedItem.notes.map((note) => {
                          const roleColors = {
                            pembina: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", tag: "Pembina" },
                            sekretariat: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", tag: "Sekretariat" },
                            walidata: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", tag: "Walidata" },
                            produsen: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", tag: "Produsen" },
                          }[note.createdByRole as "pembina" | "sekretariat" | "walidata" | "produsen"] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", tag: note.createdByRole };

                          return (
                            <div key={note.id} className="pt-3 first:pt-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full border", roleColors.bg, roleColors.text, roleColors.border)}>
                                  {roleColors.tag}
                                </span>
                                <span className="text-[10px] text-slate-400">{formatIndonesianDate(note.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">{note.message}</p>
                              {note.isResolved && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold pl-1">
                                  <CheckCircle2 className="size-3 shrink-0" />
                                  <span>Selesai ditindaklanjuti</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-50/55 p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        Belum ada catatan atau rekomendasi untuk dataset ini.
                      </div>
                    )}
                  </div>

                  {/* Short History */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Riwayat Singkat</p>
                    <div className="space-y-3 text-xs">
                      <div className="flex gap-3">
                        <div className="mt-1 size-2 rounded-full bg-slate-300 shrink-0" />
                        <div>
                          <p className="text-slate-600 font-medium">Dataset diajukan untuk review</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatIndonesianDate(selectedItem.lastUpdated)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (2/5) - Actions & Form */}
                <div className="md:col-span-2 flex flex-col justify-between space-y-6 bg-slate-50/60 p-4 rounded-xl border border-slate-100/80">
                  <div className="space-y-4">
                    {showInlineNoteForm ? (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">
                            {role === "pembina" ? "Tambah Rekomendasi Pembina" : "Tambah Catatan Monitoring"}
                          </span>
                          <Button type="button" variant="ghost" className="h-6 px-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={handleCloseInlineNoteForm}>
                            Batal
                          </Button>
                        </div>
                        
                        <Select value={inlineCategory} onValueChange={setInlineCategory}>
                          <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {role === "pembina" && (
                              <>
                                <SelectItem value="quality_note">Catatan Kualitas Data</SelectItem>
                                <SelectItem value="standard_note">Catatan Standar Data</SelectItem>
                                <SelectItem value="metadata_note">Catatan Metadata</SelectItem>
                                <SelectItem value="statistic_recommendation">Rekomendasi Statistik</SelectItem>
                                <SelectItem value="general_recommendation">Rekomendasi Umum</SelectItem>
                              </>
                            )}
                            {role === "sekretariat" && (
                              <>
                                <SelectItem value="evaluation_note">Catatan Evaluasi</SelectItem>
                                <SelectItem value="issue_note">Catatan Masalah Data</SelectItem>
                                <SelectItem value="coordination_note">Catatan Koordinasi</SelectItem>
                                <SelectItem value="follow_up_assignment">Tugas Tindak Lanjut</SelectItem>
                              </>
                            )}
                            {role === "walidata" && (
                              <>
                                <SelectItem value="quality_note">Catatan Kualitas Data</SelectItem>
                                <SelectItem value="standard_note">Catatan Standar Data</SelectItem>
                                <SelectItem value="metadata_note">Catatan Metadata</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>

                        <textarea
                          value={inlineMessage}
                          onChange={(e) => setInlineMessage(e.target.value)}
                          placeholder="Tulis pesan..."
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                        />

                        <Button
                          type="button"
                          size="sm"
                          className="w-full h-8 text-xs font-bold"
                          disabled={isSubmittingNote || !inlineMessage.trim()}
                          onClick={() => handleSubmitInlineNote(selectedItem.slug)}
                        >
                          {isSubmittingNote ? "Menyimpan..." : "Kirim Catatan"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {role === "pembina" && (
                          <Button type="button" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 rounded-xl font-bold transition-all shadow-sm" onClick={handleOpenInlineNoteForm}>
                            Beri Rekomendasi
                          </Button>
                        )}
                        {role === "sekretariat" && (
                          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-xl font-bold transition-all shadow-sm" onClick={handleOpenInlineNoteForm}>
                            Tambah Catatan Monitoring
                          </Button>
                        )}
                      </div>
                    )}

                    {!showInlineNoteForm && (
                      <div className="space-y-2 border-t border-slate-200/60 pt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aksi Alur Kerja</p>
                        <div className="flex flex-col gap-2">
                          {getNextStatuses(selectedItem.status)
                            .filter((nextStatus) => isTransitionVisible(role, selectedItem.status, nextStatus))
                            .map((nextStatus) => {
                              const isRevision = nextStatus === "Need Revision";
                              const label = getActionLabel(selectedItem.status, nextStatus);
                              return (
                                <Button
                                  key={`${selectedItem.slug}-${nextStatus}`}
                                  type="button"
                                  className={cn(
                                    "w-full text-xs h-9 font-semibold rounded-xl transition-all",
                                    isRevision 
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200" 
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  )}
                                  variant={isRevision ? "outline" : "default"}
                                  disabled={pendingId === selectedItem.id}
                                  onClick={() => {
                                    setTransitionTarget({ item: selectedItem, nextStatus });
                                    setShowConfirmTransition(true);
                                  }}
                                >
                                  {pendingId === selectedItem.id ? "Menyimpan..." : label}
                                </Button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 w-full">
                    <Button asChild variant="outline" className="w-full h-9 text-xs rounded-xl hover:bg-slate-50 transition-colors">
                      <Link href={`/internal/datasets/${selectedItem.slug}`}>
                        Buka Halaman Detail
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {transitionTarget && (
        <ConfirmationDialog
          open={showConfirmTransition}
          onOpenChange={setShowConfirmTransition}
          title={`Ubah Status Dataset?`}
          description={`Apakah Anda yakin ingin memindahkan "${transitionTarget.item.title}" ke status "${getStatusLabel(transitionTarget.nextStatus)}"?`}
          confirmLabel="Ya, Ubah Status"
          cancelLabel="Batal"
          variant={transitionTarget.nextStatus === "Need Revision" ? "destructive" : "default"}
          onConfirm={() => {
            handleTransition(transitionTarget.item, transitionTarget.nextStatus);
          }}
        />
      )}
    </div>
  );
}
