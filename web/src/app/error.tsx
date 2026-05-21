"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/portal/status-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Terjadi Kesalahan"
      description="Maaf, terjadi kesalahan internal pada server kami. Silakan coba beberapa saat lagi."
      note="Jika masalah berlanjut, silakan hubungi administrator sistem."
      primaryAction={{ href: "/", label: "Kembali ke Beranda" }}
      secondaryAction={{ href: "/dataset", label: "Telusuri Dataset" }}
    />
  );
}
