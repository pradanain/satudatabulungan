import React from "react";
import { Loader2, CheckCircle2, AlertCircle, UploadCloud, FileText, Image } from "lucide-react";

export interface FileProgress {
  name: string;
  type: "document" | "image" | "dataset" | "other";
  progress: number; // 0 to 100
  loaded: number;   // bytes
  total: number;    // bytes
  status: "waiting" | "uploading" | "completed" | "failed";
}

interface UploadProgressModalProps {
  isOpen: boolean;
  title?: string;
  currentStep: string;
  files: FileProgress[];
  error?: string | null;
  onClose?: () => void;
}

export function UploadProgressModal({
  isOpen,
  title = "Sedang Memproses Unggahan",
  currentStep,
  files,
  error,
  onClose,
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  const formatMB = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: FileProgress["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
      case "image":
        return <Image className="h-5 w-5 text-emerald-500 shrink-0" />;
      default:
        return <UploadCloud className="h-5 w-5 text-indigo-500 shrink-0" />;
    }
  };

  // Check if all files are complete
  const allCompleted = files.length > 0 && files.every((f) => f.status === "completed");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm transition-opacity" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${
            error ? "bg-red-50 text-red-500" : allCompleted ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-600"
          }`}>
            {error ? (
              <AlertCircle className="h-5 w-5" />
            ) : allCompleted ? (
              <CheckCircle2 className="h-5 w-5 animate-pulse" />
            ) : (
              <UploadCloud className="h-5 w-5 animate-bounce" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-800 tracking-wide truncate">
              {error ? "Unggahan Gagal" : allCompleted ? "Unggahan Selesai" : title}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
              {currentStep}
            </p>
          </div>
        </div>

        {/* File Progress List */}
        <div className="my-5 space-y-4 max-h-56 overflow-y-auto pr-1">
          {error ? (
            <div className="rounded-xl bg-red-50/50 border border-red-100 p-4 text-xs text-red-600 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-700">Terjadi Kesalahan</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          ) : (
            files.map((file, idx) => (
              <div key={idx} className="space-y-1.5">
                {/* File Meta Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(file.type)}
                    <span className="font-semibold text-gray-700 truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800 tabular-nums shrink-0 ml-3">
                    {file.status === "completed" ? "Selesai" : file.status === "waiting" ? "Menunggu" : `${file.progress}%`}
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r ${
                      file.status === "completed" 
                        ? "from-emerald-500 to-teal-400" 
                        : file.status === "failed" 
                        ? "from-red-500 to-rose-400" 
                        : "from-blue-500 to-indigo-500 animate-pulse"
                    }`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>

                {/* Size stats in bytes / MB */}
                {file.status === "uploading" && file.total > 0 && (
                  <p className="text-[10px] text-gray-400 text-right font-semibold tabular-nums mt-0.5">
                    {formatMB(file.loaded)} dari {formatMB(file.total)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          {error ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition active:scale-[0.98] cursor-pointer"
            >
              Tutup &amp; Coba Lagi
            </button>
          ) : allCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Mengalihkan halaman...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold italic">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4b7fe0]" />
              <span>Harap tunggu, jangan menutup halaman ini...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
