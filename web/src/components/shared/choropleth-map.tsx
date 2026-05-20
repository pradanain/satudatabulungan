"use client";

/**
 * ChoroplethMap — Peta Choropleth Kabupaten Bulungan
 *
 * - Menggunakan GeoJSON polygon asli dari /geo/bulungan-kecamatan.geojson
 * - TIDAK menggunakan rectangle, grid, atau kotak
 * - Join dataset ke GeoJSON berdasarkan kode atau nama wilayah
 * - Warna berdasarkan nilai data (skala biru)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  normalizeRegionName,
  getGeoRegionCode,
  getGeoRegionName,
  getChoroplethColor,
  formatNumber,
  formatMetricLabel,
} from "@/lib/utils/dataset-schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegionValue {
  value: number;
  regionName: string;
}

export interface ChoroplethMapProps {
  /** Map dari regionKey → { value, regionName } */
  valuesByRegion: Map<string, RegionValue>;
  /** Label indikator aktif */
  metricLabel?: string;
  /** Label periode aktif */
  periodLabel?: string;
  /** Label satuan */
  unitLabel?: string;
  className?: string;
}

// ─── GeoJSON Feature type (minimal) ──────────────────────────────────────────

interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChoroplethMap({
  valuesByRegion,
  metricLabel,
  periodLabel,
  unitLabel,
  className,
}: ChoroplethMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Hitung skala nilai untuk warna
  const allValues = [...valuesByRegion.values()].map((d) => d.value);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;

  // ── Helper join: cocokkan GeoJSON feature ke dataset ─────────────────────

  const getMatchedValue = useCallback(
    (feature: GeoFeature): RegionValue | null => {
      // 1. Coba kode wilayah
      const geoCode = getGeoRegionCode(feature);
      if (geoCode) {
        const hit = valuesByRegion.get(String(geoCode));
        if (hit) return hit;
      }

      // 2. Coba nama wilayah (normalized)
      const geoName = getGeoRegionName(feature);
      if (geoName) {
        const normGeo = normalizeRegionName(geoName);
        for (const [key, val] of valuesByRegion) {
          if (normalizeRegionName(key) === normGeo) return val;
          if (normalizeRegionName(val.regionName) === normGeo) return val;
        }
      }

      return null;
    },
    [valuesByRegion],
  );

  // ── Inisialisasi Leaflet ──────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      // Buat map jika belum ada
      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
        });

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
          },
        ).addTo(map);

        leafletMapRef.current = map;
      }

      // Fetch GeoJSON dari public URL
      let geojson: GeoFeatureCollection;
      try {
        const res = await fetch("/geo/bulungan-kecamatan.geojson");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        geojson = await res.json();
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Data batas wilayah belum tersedia.");
        }
        return;
      }

      if (cancelled) return;

      // Debug log
      const matchCount = geojson.features.filter((f) => getMatchedValue(f) !== null).length;
      const totalGeo = geojson.features.length;
      console.debug(
        `[ChoroplethMap] GeoJSON: ${totalGeo} fitur | Dataset join: ${matchCount} match | ${totalGeo - matchCount} unmatch`,
      );

      // Hapus layer lama
      if (geoLayerRef.current) {
        geoLayerRef.current.remove();
      }

      const map = leafletMapRef.current!;

      // Buat layer GeoJSON baru
      const geoLayer = L.geoJSON(geojson as unknown as GeoJSON.GeoJsonObject, {
        style(feature) {
          if (!feature) return {};
          const matched = getMatchedValue(feature as GeoFeature);
          const fillColor = matched
            ? getChoroplethColor(matched.value, minVal, maxVal)
            : "#e2e8f0";

          return {
            fillColor,
            weight: 1.5,
            opacity: 1,
            color: "#ffffff",
            fillOpacity: matched ? 0.65 : 0.35,
          };
        },
        onEachFeature(feature, layer) {
          if (!feature) return;
          const matched = getMatchedValue(feature as GeoFeature);
          const geoName =
            getGeoRegionName(feature as GeoFeature) ?? "Wilayah";

          const tooltip = matched
            ? `<div style="font-family:system-ui,sans-serif;min-width:160px">
                <p style="margin:0 0 4px;font-weight:700;font-size:13px">${geoName}</p>
                ${metricLabel ? `<p style="margin:0 0 2px;font-size:11px;color:#6b7280">Indikator: ${metricLabel}</p>` : ""}
                ${periodLabel ? `<p style="margin:0 0 2px;font-size:11px;color:#6b7280">Periode: ${periodLabel}</p>` : ""}
                <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8">
                  ${formatNumber(matched.value)}${unitLabel ? " " + unitLabel : ""}
                </p>
              </div>`
            : `<div style="font-family:system-ui,sans-serif">
                <p style="margin:0 0 4px;font-weight:700;font-size:13px">${geoName}</p>
                <p style="margin:0;font-size:11px;color:#9ca3af">Data tidak tersedia.</p>
              </div>`;

          layer.bindTooltip(tooltip, {
            sticky: true,
            opacity: 0.97,
          });

          // Hover effect
          layer.on("mouseover", function (this: L.Layer & { setStyle?: (s: object) => void }) {
            this.setStyle?.({
              weight: 2.5,
              color: "#1d4ed8",
              fillOpacity: matched ? 0.8 : 0.5,
            });
          });
          layer.on("mouseout", function (this: L.Layer & { setStyle?: (s: object) => void; options?: { style?: () => object }; feature?: GeoFeature }) {
            geoLayer.resetStyle(layer as L.Path);
          });
        },
      }).addTo(map);

      geoLayerRef.current = geoLayer;

      // fitBounds ke seluruh wilayah Bulungan
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      // Pastikan ukuran map dihitung ulang (karena bisa muncul di tab tersembunyi)
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      setStatus("ready");
    }

    init();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layer warna saat data berubah (tanpa reinisialisasi map)
  useEffect(() => {
    const layer = geoLayerRef.current;
    if (!layer || status !== "ready") return;

    layer.setStyle((feature) => {
      if (!feature) return {};
      const matched = getMatchedValue(feature as GeoFeature);
      return {
        fillColor: matched
          ? getChoroplethColor(matched.value, minVal, maxVal)
          : "#e2e8f0",
        weight: 1.5,
        opacity: 1,
        color: "#ffffff",
        fillOpacity: matched ? 0.65 : 0.35,
      };
    });

    // Update tooltip
    layer.eachLayer((l) => {
      const path = l as L.Path & { feature?: GeoFeature };
      if (!path.feature) return;
      const matched = getMatchedValue(path.feature);
      const geoName = getGeoRegionName(path.feature) ?? "Wilayah";

      const tooltip = matched
        ? `<div style="font-family:system-ui,sans-serif;min-width:160px">
            <p style="margin:0 0 4px;font-weight:700;font-size:13px">${geoName}</p>
            ${metricLabel ? `<p style="margin:0 0 2px;font-size:11px;color:#6b7280">Indikator: ${metricLabel}</p>` : ""}
            ${periodLabel ? `<p style="margin:0 0 2px;font-size:11px;color:#6b7280">Periode: ${periodLabel}</p>` : ""}
            <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8">
              ${formatNumber(matched.value)}${unitLabel ? " " + unitLabel : ""}
            </p>
          </div>`
        : `<div style="font-family:system-ui,sans-serif">
            <p style="margin:0 0 4px;font-weight:700;font-size:13px">${geoName}</p>
            <p style="margin:0;font-size:11px;color:#9ca3af">Data tidak tersedia.</p>
          </div>`;

      (l as L.Layer & { bindTooltip?: (content: string, opts?: object) => void }).bindTooltip?.(tooltip, { sticky: true, opacity: 0.97 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesByRegion, minVal, maxVal, metricLabel, periodLabel, unitLabel, status]);

  // Invalidate size saat komponen visible
  useEffect(() => {
    const timer = setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      {/* Peta */}
      <div
        ref={mapRef}
        className="h-full w-full"
        style={{ minHeight: "340px" }}
        aria-label="Peta choropleth Kabupaten Bulungan"
      />

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            Memuat peta…
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
