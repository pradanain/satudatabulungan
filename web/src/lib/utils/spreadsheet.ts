export function spreadsheetCellToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value).trim();
}

export function spreadsheetCellToRecordValue(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return spreadsheetCellToText(value);
}

export function normalizeSpreadsheetRows(rows: ReadonlyArray<ReadonlyArray<unknown>>): string[][] {
  return rows.map((row) => row.map((cell) => spreadsheetCellToText(cell)));
}
