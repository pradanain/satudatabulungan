"use client";

import { formatIndonesianDate } from "@/lib/utils/formatters";
import { CheckCircle2, History, AlertCircle, FileText, CornerDownRight, ShieldCheck, Check } from "lucide-react";
import type { InternalWorkflowEvent } from "@/lib/types/internal";
import { getStatusLabel } from "@/lib/types/workflow";
import { cn } from "@/lib/utils/cn";

type InternalActivityTimelineProps = {
  events: InternalWorkflowEvent[];
};

export function InternalActivityTimeline({ events }: InternalActivityTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <History className="w-8 h-8 text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">Belum ada aktivitas</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Riwayat perubahan status dan catatan alur kerja akan muncul di sini.
        </p>
      </div>
    );
  }

  // Sort events from newest to oldest
  const sortedEvents = [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="space-y-6">
      <div className="relative pl-6">
        {/* Timeline Line */}
        <div className="absolute top-2 bottom-2 left-[11px] w-px bg-slate-200" />
        
        <div className="space-y-8">
          {sortedEvents.map((event, index) => {
            const isRevision = event.toStatus === "Need Revision";
            const isApproved = event.toStatus === "Approved" || event.toStatus === "Published";
            const isSubmission = event.toStatus === "Submitted" || event.toStatus === "Under Review";
            const isDraft = event.toStatus === "Draft";

            return (
              <div key={event.id || index} className="relative group">
                {/* Timeline Node */}
                <div 
                  className={cn(
                    "absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center z-10 transition-colors shadow-sm",
                    isRevision ? "border-amber-400 text-amber-500" :
                    isApproved ? "border-emerald-500 text-emerald-500" :
                    isSubmission ? "border-blue-400 text-blue-500" :
                    "border-slate-300 text-slate-400"
                  )}
                >
                  {isRevision ? <AlertCircle className="w-3 h-3" /> :
                   isApproved ? <CheckCircle2 className="w-3 h-3" /> :
                   isSubmission ? <CornerDownRight className="w-3 h-3" /> :
                   <FileText className="w-3 h-3" />}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{event.actorName}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {event.actorRole}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 tabular-nums">
                      {formatIndonesianDate(event.at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-medium">
                    <span>Mengubah status menjadi</span>
                    <span 
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold border",
                        isRevision ? "bg-amber-50 text-amber-700 border-amber-200" :
                        isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isSubmission ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {getStatusLabel(event.toStatus)}
                    </span>
                  </div>

                  {event.reviewNote && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed shadow-inner">
                      <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1 block opacity-70">
                        Catatan
                      </span>
                      {event.reviewNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
