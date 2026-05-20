"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Check, AlertCircle, Calendar, User, Shield, Info, CornerDownRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DatasetNote, DatasetNoteCategory, DatasetNoteType, InternalRole, InternalSession } from "@/lib/types/internal";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { hasPermission } from "@/lib/utils/internal-auth";

type DatasetNotesSectionProps = {
  slug: string;
  notes: DatasetNote[];
  session: InternalSession;
  organizationId: string; // The dataset's OPD ID to check ownership
};

const categoryLabels: Record<DatasetNoteCategory, string> = {
  quality_note: "Catatan Kualitas Data",
  standard_note: "Catatan Standar Data",
  metadata_note: "Catatan Metadata",
  statistic_recommendation: "Rekomendasi Statistik",
  general_recommendation: "Rekomendasi Umum",
  evaluation_note: "Catatan Evaluasi / Tanggapan",
  issue_note: "Catatan Masalah Data",
  coordination_note: "Catatan Koordinasi",
  follow_up_assignment: "Tugas Tindak Lanjut",
};

const typeLabels: Record<DatasetNoteType, string> = {
  pembina_recommendation: "Rekomendasi Pembina",
  sekretariat_monitoring: "Catatan Monitoring Sekretariat",
  walidata_review: "Pemeriksaan Walidata",
  produsen_follow_up: "Tindak Lanjut Produsen",
};

const typeColors: Record<DatasetNoteType, string> = {
  pembina_recommendation: "border-purple-200 bg-purple-50 text-purple-700",
  sekretariat_monitoring: "border-blue-200 bg-blue-50 text-blue-700",
  walidata_review: "border-amber-200 bg-amber-50 text-amber-700",
  produsen_follow_up: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function DatasetNotesSection({ slug, notes = [], session, organizationId }: DatasetNotesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<"all" | DatasetNoteType>("all");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<DatasetNoteCategory>("general_recommendation");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwnOpd = session.organizationId === organizationId;

  // Determine if active user can write notes and what types they can write
  const canWritePembina = hasPermission(session, "dataset.add_review_note") || hasPermission(session, "standard_data.recommend");
  const canWriteSekretariat = hasPermission(session, "monitoring.create_evaluation_note") || hasPermission(session, "monitoring.create_issue_note");
  const canWriteWalidata = hasPermission(session, "dataset.add_review_note") && session.role === "walidata";
  const canWriteProdusen = session.role === "produsen" && isOwnOpd;

  const showNoteForm = (session.role === "pembina" && canWritePembina) ||
                       (session.role === "sekretariat" && canWriteSekretariat) ||
                       (session.role === "walidata" && canWriteWalidata) ||
                       (session.role === "produsen" && canWriteProdusen);

  // Set default category when role loads
  useState(() => {
    if (session.role === "pembina") {
      setCategory("quality_note");
    } else if (session.role === "sekretariat") {
      setCategory("evaluation_note");
    } else if (session.role === "walidata") {
      setCategory("standard_note");
    } else if (session.role === "produsen") {
      setCategory("coordination_note");
    }
  });

  const filteredNotes = notes.filter((n) => {
    if (activeFilter === "all") return true;
    return n.type === activeFilter;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!message.trim()) {
      setErrorMsg("Pesan catatan wajib diisi.");
      return;
    }

    let type: DatasetNoteType;
    if (session.role === "pembina") {
      type = "pembina_recommendation";
    } else if (session.role === "sekretariat") {
      type = "sekretariat_monitoring";
    } else if (session.role === "walidata") {
      type = "walidata_review";
    } else {
      type = "produsen_follow_up";
    }

    try {
      const response = await fetch(`/api/internal/datasets/${slug}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, message }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan catatan.");
      }

      setMessage("");
      setErrorMsg(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleResolve(noteId: string) {
    try {
      const response = await fetch(`/api/internal/datasets/${slug}/notes/${noteId}/resolve`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses penyelesaian catatan.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyelesaikan catatan.");
    }
  }

  return (
    <Card className="overflow-hidden border-transparent bg-white/50 shadow-sm backdrop-blur-xl p-5 sm:p-6 grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="size-5 text-[var(--color-primary)]" />
            Catatan & Rekomendasi
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Wadah koordinasi Pembina, Sekretariat, Walidata, dan Produsen terkait kesesuaian data.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "walidata_review", "pembina_recommendation", "sekretariat_monitoring", "produsen_follow_up"] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full text-xs font-semibold h-8"
            >
              {filter === "all" ? "Semua" : filter === "walidata_review" ? "Walidata" : filter === "pembina_recommendation" ? "Pembina" : filter === "sekretariat_monitoring" ? "Sekretariat" : "Produsen"}
            </Button>
          ))}
        </div>
      </div>

      {/* Note Lists */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-muted)] text-sm">
            Belum ada catatan untuk filter ini.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const canResolve =
              (note.type === "pembina_recommendation" && (session.role === "pembina" || session.role === "walidata")) ||
              (note.type === "sekretariat_monitoring" && (session.role === "sekretariat" || session.role === "walidata")) ||
              (note.type === "walidata_review" && (session.role === "walidata" || session.role === "produsen"));

            return (
              <div
                key={note.id}
                className={`p-4 rounded-xl border bg-white/70 shadow-sm flex flex-col gap-3 relative transition-all ${
                  note.isResolved ? "opacity-60 border-slate-100 bg-slate-50/50" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Badge variant="outline" className={`rounded-full font-bold text-[10px] ${typeColors[note.type]}`}>
                      {typeLabels[note.type]}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {categoryLabels[note.category]}
                    </Badge>
                    {note.isResolved && (
                      <Badge className="rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border-emerald-200">
                        Selesai ditindaklanjuti
                      </Badge>
                    )}
                  </div>

                  {!note.isResolved && canResolve && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(note.id)}
                      className="h-7 px-2.5 rounded-full text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 shrink-0"
                    >
                      <Check className="size-3.5 mr-1" />
                      Tandai Selesai
                    </Button>
                  )}
                </div>

                <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                  {note.message}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-muted)] font-medium mt-1">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {note.createdByUserName} ({note.createdByRole === "produsen" ? "Produsen" : note.createdByRole === "walidata" ? "Walidata" : note.createdByRole === "pembina" ? "Pembina" : "Sekretariat"})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatIndonesianDate(note.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Write Note Form */}
      {showNoteForm && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--color-border)] pt-4 grid gap-3">
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-bold text-[var(--color-text)]">
              {session.role === "pembina"
                ? "Beri Rekomendasi / Catatan Pembina"
                : session.role === "sekretariat"
                ? "Tambah Catatan Monitoring"
                : session.role === "walidata"
                ? "Beri Catatan Pemeriksaan Walidata"
                : "Beri Tanggapan / Tindak Lanjut Produsen"}
            </h4>
            <p className="text-xs text-[var(--color-muted)]">
              {session.role === "pembina"
                ? "Rekomendasi Anda akan tampil bagi Walidata dan Produsen sebagai saran kualitas data."
                : session.role === "sekretariat"
                ? "Catatan Anda akan tampil dalam monitoring portal dan riwayat audit."
                : session.role === "walidata"
                ? "Catatan pemeriksaan Anda dikirimkan ke produsen untuk perbaikan."
                : "Tanggapan Anda atas perbaikan atau klarifikasi dataset."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 items-start">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Kategori</label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as DatasetNoteCategory)}
              >
                <SelectTrigger className="h-10 rounded-xl border-[var(--color-border)] bg-white text-xs">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {session.role === "pembina" && (
                    <>
                      <SelectItem value="quality_note">Catatan Kualitas Data</SelectItem>
                      <SelectItem value="standard_note">Catatan Standar Data</SelectItem>
                      <SelectItem value="metadata_note">Catatan Metadata</SelectItem>
                      <SelectItem value="statistic_recommendation">Rekomendasi Statistik</SelectItem>
                      <SelectItem value="general_recommendation">Rekomendasi Umum</SelectItem>
                    </>
                  )}
                  {session.role === "sekretariat" && (
                    <>
                      <SelectItem value="evaluation_note">Catatan Evaluasi</SelectItem>
                      <SelectItem value="issue_note">Catatan Masalah Data</SelectItem>
                      <SelectItem value="coordination_note">Catatan Koordinasi</SelectItem>
                      <SelectItem value="follow_up_assignment">Tugas Tindak Lanjut</SelectItem>
                    </>
                  )}
                  {session.role === "walidata" && (
                    <>
                      <SelectItem value="quality_note">Catatan Kualitas Data</SelectItem>
                      <SelectItem value="standard_note">Catatan Standar Data</SelectItem>
                      <SelectItem value="metadata_note">Catatan Metadata</SelectItem>
                    </>
                  )}
                  {session.role === "produsen" && (
                    <>
                      <SelectItem value="evaluation_note">Tanggapan Evaluasi</SelectItem>
                      <SelectItem value="coordination_note">Koordinasi Tindak Lanjut</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Isi Catatan</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis catatan, saran perbaikan, atau rekomendasi di sini..."
                rows={3}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)]"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 m-0">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end mt-1">
            <Button
              type="submit"
              disabled={isPending || !message.trim()}
              className="rounded-xl px-5 text-sm h-10 shrink-0 font-semibold"
            >
              {isPending ? "Menyimpan..." : "Kirim Catatan"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
