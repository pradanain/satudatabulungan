#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.argv[2] || process.env.CKAN_BASE_URL || "http://localhost:5000";
const scriptDir = dirname(fileURLToPath(import.meta.url));

function resolveApiKey() {
  const fromEnv = process.env.CKAN_API_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const helperScript = resolve(scriptDir, "ensure-ckan-token.mjs");
  const created = execFileSync(process.execPath, [helperScript, "--format", "token"], {
    encoding: "utf8",
  }).trim();

  if (!created) {
    throw new Error("Gagal mendapatkan CKAN_API_KEY otomatis.");
  }

  return created;
}

const apiKey = resolveApiKey();

async function callAction(action, payload = {}) {
  const response = await fetch(`${baseUrl}/api/3/action/${action}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success !== true) {
    const reason = data?.error ? JSON.stringify(data.error) : `${response.status} ${response.statusText}`;
    throw new Error(`${action} failed: ${reason}`);
  }

  return data.result;
}

async function ensureOrganization(org) {
  try {
    return await callAction("organization_show", { id: org.name });
  } catch {
    return callAction("organization_create", org);
  }
}

async function ensureDataset(dataset) {
  try {
    const existing = await callAction("package_show", { id: dataset.name });
    return callAction("package_patch", {
      id: existing.id,
      ...dataset,
    });
  } catch {
    return callAction("package_create", dataset);
  }
}

const organization = {
  name: "bappeda-kabupaten-bulungan",
  title: "Bappeda Kabupaten Bulungan",
  description: "Organisasi contoh untuk bootstrap data awal Portal Satu Data Bulungan.",
};

const datasets = [
  {
    name: "jumlah-penduduk-per-kecamatan-2025",
    title: "Jumlah Penduduk per Kecamatan 2025",
    notes: "Data jumlah penduduk Bulungan per kecamatan untuk tahun 2025 (sample bootstrap).",
    owner_org: organization.name,
    private: false,
    tags: [{ name: "kependudukan" }, { name: "demografi" }],
    extras: [
      { key: "frekuensi", value: "Tahunan" },
      { key: "periode", value: "2025" },
      { key: "satuan", value: "Jiwa" },
      { key: "status", value: "Draft" },
    ],
    resources: [
      {
        name: "penduduk-2025.csv",
        format: "CSV",
        url: "https://example.com/penduduk-2025.csv",
        description: "Contoh resource CSV bootstrap.",
      },
      {
        name: "penduduk-2025-api",
        format: "API",
        url: "https://example.com/api/penduduk-2025",
        description: "Contoh endpoint API bootstrap.",
      },
    ],
  },
  {
    name: "produksi-pangan-dan-hortikultura",
    title: "Produksi Pangan dan Hortikultura",
    notes: "Data produksi pangan dan hortikultura Bulungan (sample bootstrap).",
    owner_org: organization.name,
    private: false,
    tags: [{ name: "pertanian" }, { name: "pangan" }],
    extras: [
      { key: "frekuensi", value: "Semesteran" },
      { key: "periode", value: "2025-S1" },
      { key: "satuan", value: "Ton" },
      { key: "status", value: "Submitted" },
    ],
    resources: [
      {
        name: "produksi-pangan-s1-2025.xlsx",
        format: "XLSX",
        url: "https://example.com/produksi-pangan-s1-2025.xlsx",
        description: "Contoh resource XLSX bootstrap.",
      },
    ],
  },
];

try {
  const org = await ensureOrganization(organization);
  const results = [];

  for (const dataset of datasets) {
    const item = await ensureDataset(dataset);
    results.push(item.name);
  }

  const search = await callAction("package_search", { rows: 1, start: 0 });

  console.log("CKAN sample seed: OK");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Organization: ${org.name}`);
  console.log(`Datasets upserted: ${results.join(", ")}`);
  console.log(`Dataset count now: ${Number(search?.count ?? 0)}`);
} catch (error) {
  console.error("CKAN sample seed: FAILED");
  console.error(`Base URL: ${baseUrl}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
