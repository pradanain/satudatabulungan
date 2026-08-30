"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Database, Eye, FileWarning, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { InternalAuditLog, InternalDataset, DatasetNote } from "@/lib/types/internal";

type NoteWithDataset = DatasetNote & { datasetTitle: string; datasetSlug: string };
type IssueDataset = InternalDataset & { masalah: string; severity: "Critical" | "High" | "Medium" | "Low" };

type MonitoringTabsProps = {
  issueDatasets: IssueDataset[];
  auditLogs: InternalAuditLog[];
  unresolvedNotes: NoteWithDataset[];
  totalDatasets: number;
};

const TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "monitoring", label: "Tabel Monitoring" },
  { id: "log", label: "Log Aktivitas" },
  { id: "catatan", label: "Catatan" },
] as const;

export function MonitoringTabs({ issueDatasets, auditLogs, unresolvedNotes, totalDatasets }: MonitoringTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("ringkasan");
  const [showAllLogs, setShowAllLogs] = useState(false);

  const visibleLogs = showAllLogs ? auditLogs : auditLogs.slice(0, 8);

  return (
    <div className="grid gap-6">
      {/* Tab Bar */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
            )}
          >
            {tab.label}
            {tab.id === "catatan" && unresolvedNotes.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">{unresolvedNotes.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Ringkasan */}
      {activeTab === "ringkasan" && (
        <div className="grid gap-6">
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Database className="size-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Total Dataset</p>
              </div>
              <p className="text-2xl font-extrabold">{totalDatasets}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <AlertTriangle className="size-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Bermasalah</p>
              </div>
              <p className="text-2xl font-extrabold">{issueDatasets.length}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <FileWarning className="size-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Catatan Terbuka</p>
              </div>
              <p className="text-2xl font-extrabold">{unresolvedNotes.length}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Clock className="size-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Log Aktivitas</p>
              </div>
              <p className="text-2xl font-extrabold">{auditLogs.length}</p>
            </Card>
          </section>

          {issueDatasets.length === 0 && unresolvedNotes.length === 0 ? (
            <Card className="p-8 text-center shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-400">
                  <Database className="size-7" />
                </div>
                <p className="text-sm text-[var(--color-muted)]">Semua dataset dalam kondisi baik. Tidak ada masalah yang terdeteksi.</p>
              </div>
            </Card>
          ) : (
            <Card className="p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-3">Dataset Perlu Perhatian</h3>
              <div className="space-y-2">
                {issueDatasets.slice(0, 5).map((ds) => (
                  <div key={ds.slug} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{ds.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{ds.organization}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "shrink-0",
                      ds.severity === "Critical" && "border-red-200 bg-red-50 text-red-700",
                      ds.severity === "High" && "border-orange-200 bg-orange-50 text-orange-700",
                      ds.severity === "Medium" && "border-yellow-200 bg-yellow-50 text-yellow-700",
                      ds.severity === "Low" && "border-blue-200 bg-blue-50 text-blue-700",
                    )}>
                      {ds.masalah}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tabel Monitoring */}
      {activeTab === "monitoring" && (
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)]/50 text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-3 font-bold">Dataset</th>
                  <th className="px-5 py-3 font-bold">OPD</th>
                  <th className="px-5 py-3 font-bold">Masalah</th>
                  <th className="px-5 py-3 font-bold">Severity</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {issueDatasets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="size-8 text-slate-300" />
                        <p className="text-sm text-[var(--color-muted)]">Tidak ada masalah terdeteksi saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  issueDatasets.map((ds) => (
                    <tr key={ds.slug} className="hover:bg-[var(--color-surface-soft)]/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold text-[var(--color-text)] truncate max-w-[250px]">{ds.title}</p>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-muted)]">{ds.organization}</td>
                      <td className="px-5 py-3 font-medium">{ds.masalah}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cn(
                          ds.severity === "Critical" && "border-red-200 bg-red-50 text-red-700",
                          ds.severity === "High" && "border-orange-200 bg-orange-50 text-orange-700",
                          ds.severity === "Medium" && "border-yellow-200 bg-yellow-50 text-yellow-700",
                          ds.severity === "Low" && "border-blue-200 bg-blue-50 text-blue-700",
                        )}>
                          {ds.severity}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <InternalStatusBadge status={ds.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                          <Link href={`/internal/datasets/${ds.slug}`} title="Lihat Detail">
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Log Aktivitas */}
      {activeTab === "log" && (
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)]/50 text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-3 font-bold">Waktu</th>
                  <th className="px-5 py-3 font-bold">Aktor</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Aksi</th>
                  <th className="px-5 py-3 font-bold">Ringkasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {visibleLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="size-8 text-slate-300" />
                        <p className="text-sm text-[var(--color-muted)]">Belum ada log aktivitas.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--color-surface-soft)]/30 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-[var(--color-muted)] font-medium text-xs">
                        {formatIndonesianDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-medium">{log.actorName}</td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className="text-[10px] capitalize">{log.actorRole}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-[var(--color-muted)]">{log.action}</td>
                      <td className="px-5 py-3 text-[var(--color-text)] max-w-[300px] truncate">{log.summary}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!showAllLogs && auditLogs.length > 8 && (
            <div className="border-t border-[var(--color-border)] px-5 py-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAllLogs(true)} className="text-xs font-semibold text-[var(--color-primary)]">
                Lihat Semua ({auditLogs.length} log)
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Catatan / Tindak Lanjut */}
      {activeTab === "catatan" && (
        <Card className="flex flex-col shadow-sm border-[var(--color-border)] overflow-hidden">
          <div className="p-5">
            {unresolvedNotes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Inbox className="size-10 text-slate-300" />
                <p className="text-sm text-[var(--color-muted)]">Tidak ada catatan atau tindak lanjut yang terbuka.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolvedNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {note.category === "issue_note" ? "Masalah Data" : note.category === "follow_up_assignment" ? "Tindak Lanjut" : "Catatan"}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {formatIndonesianDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">{note.message}</p>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-[10px] text-[var(--color-muted)]">
                        Oleh: {note.createdByUserName} ({note.createdByRole})
                      </span>
                      <Link href={`/internal/datasets/${note.datasetSlug}`} className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                        {note.datasetTitle} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
