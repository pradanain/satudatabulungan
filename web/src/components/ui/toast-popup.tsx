"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ToastNotificationProps {
  message: string | null;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function ToastNotification({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: "bg-emerald-50/95 border-emerald-200/60 text-emerald-900 shadow-emerald-100/50",
      icon: <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />,
      title: "Sukses",
    },
    error: {
      bg: "bg-rose-50/95 border-rose-200/60 text-rose-950 shadow-rose-100/50",
      icon: <AlertTriangle className="size-5 text-rose-600 shrink-0" />,
      title: "Gagal",
    },
    info: {
      bg: "bg-blue-50/95 border-blue-200/60 text-blue-950 shadow-blue-100/50",
      icon: <Info className="size-5 text-blue-600 shrink-0" />,
      title: "Informasi",
    },
  }[type];

  return (
    <div
      className={cn(
        "fixed top-6 right-6 z-55 max-w-sm w-full transition-all duration-300 ease-out transform",
        "translate-x-0 opacity-100 pointer-events-auto",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3.5 p-4 rounded-[20px] border backdrop-blur-md shadow-xl",
          styles.bg
        )}
      >
        <div className="mt-0.5 shrink-0">{styles.icon}</div>
        <div className="flex-1 flex flex-col gap-0.5 pr-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 opacity-90">
            {styles.title}
          </span>
          <span className="text-xs font-semibold leading-relaxed text-slate-700">
            {message}
          </span>
        </div>
        <button
          onClick={() => {
            onClose();
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-black/5 shrink-0"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
