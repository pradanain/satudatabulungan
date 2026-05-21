/**
 * Dataset Schema Detection & Helper Utilities
 *
 * Generic helpers untuk mendeteksi struktur dataset secara otomatis
 * dan menyiapkan data untuk tabel, eksplorasi, dan peta choropleth.
 */

// ─── Kolom yang dikenali ─────────────────────────────────────────────────────

const REGION_KEYS = new Set([
  "kode_wilayah", "kode_kecamatan", "kode_desa", "kode_bps", "idkec",
  "nama_wilayah", "nama_kecamatan", "nama_desa", "wilayah", "kecamatan",
  "desa", "area",
]);

const REGION_CODE_KEYS = new Set([
  "kode_wilayah", "kode_kecamatan", "kode_desa", "kode_bps", "idkec",
]);

const REGION_NAME_KEYS = new Set([
  "nama_wilayah", "nama_kecamatan", "nama_desa", "wilayah", "kecamatan",
  "desa", "area",
]);

const PERIOD_KEYS = new Set([
  "tahun", "bulan", "tanggal", "periode", "semester", "triwulan", "year",
]);

const INDICATOR_KEYS = new Set([
  "indikator", "variabel", "kategori", "komponen", "jenis", "nama_indikator",
  "indicator",
]);

const VALUE_KEYS = new Set([
  "nilai", "value", "jumlah", "total", "angka",
]);

const UNIT_KEYS = new Set(["satuan", "unit"]);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatasetSchema {
  /** Format dataset */
  format: "long" | "wide" | "unknown";
  /** Kunci kolom wilayah (kode), jika ada */
  regionCodeKey: string | null;
  /** Kunci kolom nama wilayah, jika ada */
  regionNameKey: string | null;
  /** Kunci kolom periode, jika ada */
  periodKey: string | null;
  /** Kunci kolom indikator (long format), jika ada */
  indicatorKey: string | null;
  /** Kunci kolom nilai (long format), jika ada */
  valueKey: string | null;
  /** Kunci kolom satuan, jika ada */
  unitKey: string | null;
  /** Semua kolom numerik (wide format metrics) */
  numericKeys: string[];
  /** Apakah dataset memiliki kolom wilayah */
  hasRegion: boolean;
  /** Apakah dataset memiliki kolom periode */
  hasPeriod: boolean;
  /** Apakah dataset memiliki multiple indikator atau multiple numerik kolom */
  hasMultipleMetrics: boolean;
}

export interface AggregatedRegionData {
  regionKey: string;   // kode atau nama wilayah (normalized)
  regionName: string;  // nama wilayah yang ditampilkan
  value: number;
  rawValues: number[];
}

const BULUNGAN_DISTRICT_NAMES = new Set([
  "tanjung selor",
  "tanjung palas",
  "tanjung palas barat",
  "tanjung palas utara",
  "tanjung palas timur",
  "tanjung palas tengah",
  "sekatak",
  "peso",
  "peso hilir",
  "bunyu",
]);

const AGGREGATE_REGION_PREFIXES = [
  "kabupaten ",
  "kota ",
  "provinsi ",
];

const AGGREGATE_REGION_TOKENS = [
  "total",
  "jumlah",
  "semua",
  "overall",
  "grand total",
  "all",
  "bulungan",
];

const INDONESIAN_MONTH_ORDER = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalisasi nama wilayah untuk join (lowercase, tanpa prefix, tanpa spasi ekstra) */
export function normalizeRegionName(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .replace(/^kecamatan\s+/i, "")
    .replace(/^kabupaten\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBulunganDistrictName(name: string): boolean {
  const normalized = normalizeRegionName(name);
  return BULUNGAN_DISTRICT_NAMES.has(normalized);
}

export function isAggregateRegionName(name: string): boolean {
  const normalized = normalizeRegionName(name);
  if (!normalized) {
    return false;
  }

  if (AGGREGATE_REGION_TOKENS.includes(normalized)) {
    return true;
  }

  if (AGGREGATE_REGION_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  if (normalized.includes("total") || normalized.includes("jumlah")) {
    return true;
  }

  return false;
}

/** Format angka dengan locale Indonesia */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return "-";
  return value.toLocaleString("id-ID");
}

/** Format label kolom menjadi lebih manusiawi */
export function formatMetricLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Cek apakah nilai adalah angka */
function isNumericValue(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return false;
  return !isNaN(Number(v));
}

/** Ambil kunci kode wilayah dari baris dataset */
export function getDatasetRegionCode(row: Record<string, unknown>): string | null {
  for (const key of REGION_CODE_KEYS) {
    if (key in row && row[key] != null && row[key] !== "") {
      return String(row[key]);
    }
  }
  return null;
}

/** Ambil kunci nama wilayah dari baris dataset */
export function getDatasetRegionName(row: Record<string, unknown>): string | null {
  for (const key of REGION_NAME_KEYS) {
    if (key in row && row[key] != null && row[key] !== "") {
      return String(row[key]);
    }
  }
  return null;
}

/** Ambil kode wilayah dari GeoJSON feature */
export function getGeoRegionCode(feature: {
  properties: Record<string, unknown>;
}): string | null {
  const p = feature.properties;
  return (
    (p.kode_wilayah as string) ??
    (p.kode_kecamatan as string) ??
    (p.idkec as string) ??
    null
  );
}

/** Ambil nama wilayah dari GeoJSON feature */
export function getGeoRegionName(feature: {
  properties: Record<string, unknown>;
}): string | null {
  const p = feature.properties;
  return (
    (p.nama_wilayah as string) ??
    (p.nama_kecamatan as string) ??
    (p.nmkec as string) ??
    null
  );
}

// ─── Schema Detection ─────────────────────────────────────────────────────────

/**
 * Deteksi schema dataset secara otomatis dari array rows.
 * Mendukung long format, wide format, dan unknown.
 */
export function detectDatasetSchema(
  data: Record<string, unknown>[],
): DatasetSchema {
  if (!data || data.length === 0) {
    return {
      format: "unknown",
      regionCodeKey: null,
      regionNameKey: null,
      periodKey: null,
      indicatorKey: null,
      valueKey: null,
      unitKey: null,
      numericKeys: [],
      hasRegion: false,
      hasPeriod: false,
      hasMultipleMetrics: false,
    };
  }

  const sample = data[0];
  const allKeys = Object.keys(sample);

  // Cari kolom-kolom khusus
  const regionCodeKey =
    allKeys.find((k) => REGION_CODE_KEYS.has(k.toLowerCase())) ?? null;
  const regionNameKey =
    allKeys.find((k) => REGION_NAME_KEYS.has(k.toLowerCase())) ?? null;
  const periodKey =
    allKeys.find((k) => PERIOD_KEYS.has(k.toLowerCase())) ?? null;
  const indicatorKey =
    allKeys.find((k) => INDICATOR_KEYS.has(k.toLowerCase())) ?? null;
  const valueKey =
    allKeys.find((k) => VALUE_KEYS.has(k.toLowerCase())) ?? null;
  const unitKey =
    allKeys.find((k) => UNIT_KEYS.has(k.toLowerCase())) ?? null;

  // Kolom numerik: semua kolom yang nilainya angka, bukan kode/periode/unit/indicator
  const excludeFromMetrics = new Set([
    ...(regionCodeKey ? [regionCodeKey] : []),
    ...(regionNameKey ? [regionNameKey] : []),
    ...(periodKey ? [periodKey] : []),
    ...(indicatorKey ? [indicatorKey] : []),
    ...(unitKey ? [unitKey] : []),
  ]);

  const numericKeys = allKeys.filter((k) => {
    if (excludeFromMetrics.has(k)) return false;
    // Cek apakah mayoritas baris memiliki nilai numerik di kolom ini
    const sample5 = data.slice(0, Math.min(5, data.length));
    return sample5.every((row) => isNumericValue(row[k]));
  });

  // Tentukan format: long jika ada kolom indikator + nilai, sinon wide
  const isLongFormat = !!(indicatorKey && valueKey);

  // Hitung jumlah metric unik
  let hasMultipleMetrics = false;
  if (isLongFormat && indicatorKey) {
    const uniqueIndicators = new Set(data.map((r) => String(r[indicatorKey] ?? "")));
    hasMultipleMetrics = uniqueIndicators.size > 1;
  } else {
    hasMultipleMetrics = numericKeys.length > 1;
  }

  return {
    format: isLongFormat ? "long" : numericKeys.length > 0 ? "wide" : "unknown",
    regionCodeKey,
    regionNameKey,
    periodKey,
    indicatorKey,
    valueKey,
    unitKey,
    numericKeys,
    hasRegion: !!(regionCodeKey || regionNameKey),
    hasPeriod: !!periodKey,
    hasMultipleMetrics,
  };
}

// ─── Extract Available Metrics ────────────────────────────────────────────────

export function extractAvailableMetrics(
  data: Record<string, unknown>[],
  schema: DatasetSchema,
): string[] {
  if (schema.format === "long" && schema.indicatorKey) {
    return [
      ...new Set(data.map((r) => String(r[schema.indicatorKey!] ?? "")).filter(Boolean)),
    ];
  }
  return schema.numericKeys;
}

export function extractAvailablePeriods(
  data: Record<string, unknown>[],
  schema: DatasetSchema,
): string[] {
  if (!schema.periodKey) return [];

  const unique = [
    ...new Set(data.map((r) => String(r[schema.periodKey!] ?? "")).filter(Boolean)),
  ];

  const monthIndex = (value: string): number => {
    const normalized = value.trim().toLowerCase();
    const idx = INDONESIAN_MONTH_ORDER.indexOf(normalized);
    if (idx >= 0) return idx;

    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 12) {
      return parsed - 1;
    }

    return -1;
  };

  return unique.sort((a, b) => {
    const aMonth = monthIndex(a);
    const bMonth = monthIndex(b);
    if (aMonth >= 0 && bMonth >= 0) {
      return aMonth - bMonth;
    }

    const aYear = Number(a);
    const bYear = Number(b);
    if (Number.isFinite(aYear) && Number.isFinite(bYear)) {
      return aYear - bYear;
    }

    return a.localeCompare(b, "id-ID");
  });
}

// ─── Filter Dataset ───────────────────────────────────────────────────────────

export function getFilteredDataset(
  data: Record<string, unknown>[],
  schema: DatasetSchema,
  options: {
    selectedMetric?: string;
    selectedPeriod?: string;
  },
): Record<string, unknown>[] {
  let rows = data;

  if (options.selectedPeriod && schema.periodKey) {
    rows = rows.filter(
      (r) => String(r[schema.periodKey!]) === options.selectedPeriod,
    );
  }

  if (options.selectedMetric && schema.format === "long" && schema.indicatorKey) {
    rows = rows.filter(
      (r) => String(r[schema.indicatorKey!]) === options.selectedMetric,
    );
  }

  return rows;
}

// ─── Aggregate Dataset per Region ─────────────────────────────────────────────

export type AggregationMethod = "latest" | "sum" | "average" | "min" | "max";

export function aggregateByRegion(
  data: Record<string, unknown>[],
  schema: DatasetSchema,
  selectedMetric: string,
  method: AggregationMethod = "latest",
): Map<string, AggregatedRegionData> {
  const result = new Map<string, AggregatedRegionData>();

  for (const row of data) {
    const regionCode = schema.regionCodeKey ? String(row[schema.regionCodeKey] ?? "") : "";
    const regionName = schema.regionNameKey
      ? String(row[schema.regionNameKey] ?? "")
      : "";

    if (regionName && isAggregateRegionName(regionName)) {
      continue;
    }

    const key = regionCode || normalizeRegionName(regionName);
    if (!key) continue;

    let value: number = NaN;

    if (schema.format === "long" && schema.indicatorKey && schema.valueKey) {
      if (String(row[schema.indicatorKey]) !== selectedMetric) continue;
      value = Number(row[schema.valueKey]);
    } else {
      value = Number(row[selectedMetric]);
    }

    if (!isFinite(value)) continue;

    const existing = result.get(key);
    if (!existing) {
      result.set(key, {
        regionKey: key,
        regionName: regionName || regionCode,
        value,
        rawValues: [value],
      });
    } else {
      existing.rawValues.push(value);
      switch (method) {
        case "sum":
          existing.value = existing.rawValues.reduce((a, b) => a + b, 0);
          break;
        case "average":
          existing.value =
            existing.rawValues.reduce((a, b) => a + b, 0) /
            existing.rawValues.length;
          break;
        case "min":
          existing.value = Math.min(...existing.rawValues);
          break;
        case "max":
          existing.value = Math.max(...existing.rawValues);
          break;
        default: // latest
          existing.value = value;
      }
    }
  }

  return result;
}

// ─── Choropleth Color Scale ────────────────────────────────────────────────────

export function getChoroplethColor(
  value: number | undefined,
  min: number,
  max: number,
): string {
  if (value === undefined || !isFinite(value) || max === min) return "#cbd5e1";

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Skema warna biru: sangat terang → sangat gelap
  const stops = [
    "#dbeafe", // 0%
    "#93c5fd", // 25%
    "#3b82f6", // 50%
    "#1d4ed8", // 75%
    "#1e3a8a", // 100%
  ];

  const idx = ratio * (stops.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return stops[lo];

  // Interpolasi sederhana (hex → rgb)
  const t = idx - lo;
  const parseHex = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  };

  const [r1, g1, b1] = parseHex(stops[lo]);
  const [r2, g2, b2] = parseHex(stops[hi]);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r},${g},${b})`;
}
