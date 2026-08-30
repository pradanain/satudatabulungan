import type { PortalDataset } from "@/lib/services/ckan-portal-api";

export type ValidationReport = {
  score: number;
  checks: {
    label: string;
    passed: boolean;
    impact: number;
    message: string;
  }[];
};

/**
 * Menghitung skor kualitas berdasarkan metadata dan struktur resource
 */
export function validateDatasetQuality(dataset: PortalDataset): ValidationReport {
  const checks: ValidationReport["checks"] = [];
  let score = 100;

  // 1. Cek Deskripsi (Metadata)
  const words = (dataset.description || "").trim().split(/\s+/).filter(Boolean);
  const hasNotes = words.length >= 5;
  checks.push({
    label: "Kelengkapan Deskripsi",
    passed: !!hasNotes,
    impact: 15,
    message: hasNotes ? "Deskripsi cukup informatif." : "Deskripsi terlalu singkat (minimal 5 kata).",
  });
  if (!hasNotes) score -= 15;

  // 2. Cek Tags
  const hasTags = dataset.tags && dataset.tags.length >= 3;
  checks.push({
    label: "Katalogisasi (Tags)",
    passed: hasTags,
    impact: 10,
    message: hasTags ? "Tag sudah memadai untuk pencarian." : "Gunakan minimal 3 tag agar data mudah dicari.",
  });
  if (!hasTags) score -= 10;

  // 3. Cek Format Terbuka (CSV/JSON vs PDF)
  const hasMachineReadable = dataset.resources.some(r => 
    ["CSV", "JSON", "XLSX"].includes(r.format.toUpperCase())
  );
  checks.push({
    label: "Format Terbuka",
    passed: hasMachineReadable,
    impact: 25,
    message: hasMachineReadable ? "Data menggunakan format standar olah data." : "Data hanya tersedia dalam format non-mesin (seperti PDF).",
  });
  if (!hasMachineReadable) score -= 25;

  // 4. Cek Kelengkapan Resource
  const hasMultipleResources = dataset.resources.length >= 2;
  checks.push({
    label: "Variasi Resource",
    passed: hasMultipleResources,
    impact: 10,
    message: hasMultipleResources ? "Tersedia lebih dari satu format akses." : "Sediakan format alternatif (misal JSON untuk developer).",
  });
  if (!hasMultipleResources) score -= 10;

  // 5. Cek Kesesuaian Judul
  const goodTitle = !!(dataset.title && dataset.title.length > 10 && dataset.title.length < 100);
  checks.push({
    label: "Standarisasi Judul",
    passed: goodTitle,
    impact: 10,
    message: goodTitle ? "Judul sesuai standar." : "Judul terlalu pendek atau terlalu panjang.",
  });
  if (!goodTitle) score -= 10;

  return {
    score: Math.max(score, 0),
    checks,
  };
}
