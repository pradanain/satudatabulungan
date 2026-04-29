const idFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const compactNumberFormatter = new Intl.NumberFormat("id-ID");

export function formatIndonesianDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return idFormatter.format(date);
}

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function getTopicAccentColor(topic: string): string {
  const normalized = topic.toLowerCase();

  if (normalized.includes("kependudukan")) return "#2f66d2";
  if (normalized.includes("kesehatan")) return "#1f9f4f";
  if (normalized.includes("pendidikan")) return "#c32121";
  if (normalized.includes("ekonomi")) return "#ed8a1d";
  if (normalized.includes("infrastruktur")) return "#2b4aa2";
  if (normalized.includes("lingkungan")) return "#14984e";

  return "#2f2525";
}
