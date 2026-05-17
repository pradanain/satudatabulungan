const idFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
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

export function parseIndonesianDateText(dateText: string): number {
  if (!dateText) return 0;
  
  const parsed = Date.parse(dateText);
  if (!Number.isNaN(parsed)) return parsed;

  const months: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12",
  };

  const regex = /(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/;
  const match = dateText.toLowerCase().match(regex);
  if (match) {
    const [, day, monthName, year] = match;
    const month = months[monthName];
    if (month) {
      const paddedDay = day.padStart(2, "0");
      return Date.parse(`${year}-${month}-${paddedDay}T00:00:00Z`);
    }
  }

  return 0;
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
