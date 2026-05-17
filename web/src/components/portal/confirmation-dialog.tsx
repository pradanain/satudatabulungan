import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md rounded-[28px] p-6">
        <AlertDialogHeader className="flex flex-col items-center gap-3 text-center">
          <div
            className={`flex size-14 items-center justify-center rounded-2xl ${
              variant === "destructive" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            <AlertTriangle className="size-7" />
          </div>
          <div className="space-y-1.5 text-center">
            <AlertDialogTitle className="text-xl font-bold text-[#2d2826]">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#5f5957]">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 flex flex-col gap-2 sm:flex-row">
          <AlertDialogCancel asChild>
            <Button
              variant="secondary"
              className="h-11 flex-1 rounded-2xl border-[#d1d9e6] font-bold text-[#5f5957]"
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild onClick={onConfirm}>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              className="h-11 flex-1 rounded-2xl font-bold shadow-lg"
            >
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
