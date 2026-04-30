export function getPrimaryDatasetDescription(text: string): string {
  const clean = text.trim();
  if (!clean) return "Belum tersedia";

  const firstSentence = clean.match(/^.+?[.!?](\s|$)/)?.[0]?.trim();
  return firstSentence ?? clean;
}
