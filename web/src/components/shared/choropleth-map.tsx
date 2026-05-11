"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import bulunganDistricts from "@/lib/data/bulungan-districts.json";

// Import Leaflet secara dinamis karena butuh akses window/DOM
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

type ChoroplethMapProps = {
  data: any[]; // Array of objects from CSV/JSON
  valueKey?: string; // Kolom yang ingin divisualisasikan (misal: "jumlah_penduduk")
  className?: string;
};

export default function ChoroplethMap({ data, valueKey, className }: ChoroplethMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memetakan data dari dataset ke GeoJSON
  const mapData = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const lookup: Record<string, number> = {};
    const targetKey = valueKey || Object.keys(data[0]).find(k => k.toLowerCase().includes("total") || k.toLowerCase().includes("jumlah") || typeof data[0][k] === "number");

    if (!targetKey) return {};

    data.forEach(row => {
      // Cari nama kecamatan di kolom mana pun
      const districtName = row.kecamatan || row.Kecamatan || row.wilayah || row.Wilayah || row.area || row.Area;
      if (districtName) {
        lookup[districtName.toLowerCase()] = Number(row[targetKey] || row.total || row.Total || 0);
      }
    });

    return { lookup, targetKey };
  }, [data, valueKey]);

  if (!isMounted) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl" />;

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties.name;
    const value = mapData.lookup?.[name.toLowerCase()];
    
    layer.bindTooltip(
      `<strong>${name}</strong><br/>${mapData.targetKey}: ${value?.toLocaleString() || "Data tidak tersedia"}`,
      { sticky: true }
    );
  };

  const style = (feature: any) => {
    const name = feature.properties.name;
    const value = mapData.lookup?.[name.toLowerCase()];
    
    // Logika warna (Choropleth)
    const getColor = (v?: number) => {
      if (!v) return "#cbd5e1"; // gray
      if (v > 50000) return "#15803d"; // dark green
      if (v > 20000) return "#22c55e"; // green
      if (v > 10000) return "#86efac"; // light green
      return "#dcfce7"; // very light green
    };

    return {
      fillColor: getColor(value),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  return (
    <div className={className}>
      <MapContainer
        center={[2.9, 117.3]} // Center Bulungan
        zoom={9}
        className="h-full w-full rounded-xl z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON 
          data={bulunganDistricts as any} 
          style={style} 
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
