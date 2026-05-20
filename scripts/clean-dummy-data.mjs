#!/usr/bin/env node
/**
 * clean-dummy-data.mjs
 *
 * Menghapus semua data dummy dari CKAN dan local store KECUALI:
 * - Akun/users (portal-akun-role-kabupaten-bulungan)
 * - Publikasi (content_type=publikasi)
 * - Topik (groups di CKAN tetap dipertahankan)
 * - Infografis (content_type=infografis) — juga dipertahankan
 * - Organisasi CKAN — tetap dipertahankan
 *
 * Yang dihapus:
 * - Semua paket CKAN bertipe "dataset" (dummy seed)
 * - File local store (internal-portal-store.json) di-reset agar fresh
 * - File legacy workflow (mock-workflow-*.json, workflow-audit-trail.json) di-reset
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────────────────
const CKAN_BASE_URL =
  process.env.CKAN_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_CKAN_BASE_URL?.trim() ||
  "http://localhost:5000";

const API_KEY = (() => {
  // Try env first
  if (process.env.CKAN_API_KEY?.trim()) return process.env.CKAN_API_KEY.trim();
  // Try .local/ckan-admin.token
  const tokenPath = resolve(PROJECT_ROOT, ".local", "ckan-admin.token");
  if (existsSync(tokenPath)) {
    return readFileSync(tokenPath, "utf8").trim();
  }
  // Try .env
  const envPath = resolve(PROJECT_ROOT, ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf8");
    const match = envContent.match(/^CKAN_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  return "";
})();

const CONTENT_TYPES_TO_KEEP = ["publikasi", "infografis", "accounts", "akun"];

// ── Helpers ─────────────────────────────────────────────────────────────────
async function ckanAction(action, payload = {}, method = "POST") {
  const url = `${CKAN_BASE_URL}/api/3/action/${action}`;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (API_KEY) headers.Authorization = API_KEY;

  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CKAN ${action} gagal (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`CKAN ${action} mengembalikan success=false.`);
  }

  return data.result;
}

function getContentType(pkg) {
  const extras = pkg.extras ?? [];
  const ct = extras.find(
    (e) => e.key === "content_type" || e.key === "tipe_konten"
  );
  const raw = (ct?.value ?? "dataset").toLowerCase();
  if (raw.includes("infografis")) return "infografis";
  if (raw.includes("publikasi") || raw.includes("buku")) return "publikasi";
  if (raw.includes("account") || raw.includes("akun")) return "accounts";
  return "dataset";
}

// ── Step 1: Clean CKAN dummy datasets ───────────────────────────────────────
async function cleanCkanDatasets() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  STEP 1: Menghapus dataset dummy dari CKAN");
  console.log("══════════════════════════════════════════════════════════════\n");

  const search = await ckanAction("package_search", {
    q: "*:*",
    rows: 1000,
    start: 0,
    include_private: true,
  });

  const allPackages = search.results;
  console.log(`Total paket di CKAN: ${allPackages.length}`);

  const toDelete = [];
  const toKeep = [];

  for (const pkg of allPackages) {
    const contentType = getContentType(pkg);
    if (CONTENT_TYPES_TO_KEEP.includes(contentType)) {
      toKeep.push({ name: pkg.name, contentType });
    } else {
      toDelete.push({ name: pkg.name, id: pkg.id, contentType });
    }
  }

  console.log(`\nDipertahankan (${toKeep.length}):`);
  const grouped = {};
  for (const item of toKeep) {
    grouped[item.contentType] = (grouped[item.contentType] || 0) + 1;
  }
  for (const [type, count] of Object.entries(grouped)) {
    console.log(`  ✓ ${type}: ${count} paket`);
  }

  console.log(`\nAkan dihapus (${toDelete.length}):`);
  for (const item of toDelete) {
    console.log(`  ✗ ${item.name} (${item.contentType})`);
  }

  if (toDelete.length === 0) {
    console.log("\n✅ Tidak ada dataset dummy untuk dihapus.");
    return;
  }

  console.log(`\nMenghapus ${toDelete.length} paket...`);

  let deleted = 0;
  let failed = 0;

  for (const item of toDelete) {
    try {
      // First delete (soft delete)
      await ckanAction("package_delete", { id: item.id });
      // Then purge (permanent delete)
      await ckanAction("dataset_purge", { id: item.id });
      deleted++;
      process.stdout.write(`  ✓ [${deleted}/${toDelete.length}] ${item.name}\n`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Gagal hapus ${item.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Selesai. Dihapus: ${deleted}, Gagal: ${failed}`);
}

// ── Step 2: Reset local internal store ──────────────────────────────────────
function resetLocalStore() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  STEP 2: Reset local internal-portal-store");
  console.log("══════════════════════════════════════════════════════════════\n");

  const localDir = resolve(PROJECT_ROOT, ".local");
  const storePath = resolve(localDir, "internal-portal-store.json");

  // Read existing store to preserve users and topics
  let existingStore = null;
  if (existsSync(storePath)) {
    try {
      existingStore = JSON.parse(readFileSync(storePath, "utf8"));
      console.log("  ✓ File store lama ditemukan, mempertahankan akun & topik.");
    } catch {
      console.log("  ⚠ File store lama tidak bisa dibaca, akan buat baru.");
    }
  }

  // Build clean store - keep users, organizations, topics, settings
  // but empty out datasets, notifications, audit logs, workflow
  const cleanStore = {
    version: existingStore?.version ?? 2,
    lastUpdated: new Date().toISOString(),
    datasets: [], // ← dikosongkan
    users: existingStore?.users ?? [],
    organizations: existingStore?.organizations ?? [],
    topics: existingStore?.topics ?? [],
    notifications: [], // ← dikosongkan
    auditLogs: [], // ← dikosongkan
    settings: existingStore?.settings ?? {
      portalName: "Satu Data Bulungan",
      publicEmail: "satudata@bulungankab.go.id",
      publicPhone: "(0552) 22001",
      heroHeadline: "Portal Data Terpadu Kabupaten Bulungan",
      heroSubheadline:
        "Menyatukan dataset sektoral, metadata, dan publikasi lintas OPD dalam satu alur kerja yang terpantau.",
      footerNote:
        "Kelola data lebih cepat, konsisten, dan siap dipublikasikan.",
      highlightDatasetSlugs: [],
      notificationBanner:
        "Perbarui metadata minimum sebelum mengajukan dataset ke walidata.",
      defaultWalidataUserId: "user-walidata",
    },
  };

  writeFileSync(storePath, JSON.stringify(cleanStore, null, 2) + "\n", "utf8");
  console.log(`  ✓ Store di-reset: ${storePath}`);
  console.log(`    - Users dipertahankan: ${cleanStore.users.length}`);
  console.log(`    - Organizations dipertahankan: ${cleanStore.organizations.length}`);
  console.log(`    - Topics dipertahankan: ${cleanStore.topics.length}`);
  console.log(`    - Datasets dikosongkan: 0`);
  console.log(`    - Notifications dikosongkan: 0`);
  console.log(`    - Audit logs dikosongkan: 0`);

  // Reset legacy workflow files
  const legacyFiles = [
    "mock-workflow-overrides.json",
    "mock-workflow-drafts.json",
    "workflow-audit-trail.json",
  ];

  for (const file of legacyFiles) {
    const path = resolve(localDir, file);
    if (existsSync(path)) {
      writeFileSync(path, "{}\n", "utf8");
      console.log(`  ✓ Legacy file di-reset: ${file}`);
    }
  }

  console.log("\n✅ Local store berhasil di-reset.");
}

// ── Step 3: Verify CKAN is ready ────────────────────────────────────────────
async function verifyCkan() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  STEP 3: Verifikasi CKAN siap menerima data");
  console.log("══════════════════════════════════════════════════════════════\n");

  // Check status
  try {
    const status = await ckanAction("status_show", {});
    console.log(`  ✓ CKAN site: ${status.site_title || "OK"}`);
    console.log(`  ✓ CKAN version: ${status.ckan_version || "?"}`);
  } catch (error) {
    console.error(`  ✗ status_show gagal: ${error.message}`);
  }

  // Check organizations are still there
  try {
    const orgs = await ckanAction("organization_list", { all_fields: false });
    console.log(`  ✓ Organisasi tersedia: ${orgs.length}`);
  } catch (error) {
    console.error(`  ✗ organization_list gagal: ${error.message}`);
  }

  // Check remaining packages
  try {
    const search = await ckanAction("package_search", { q: "*:*", rows: 0 });
    console.log(`  ✓ Total paket tersisa: ${search.count}`);
  } catch (error) {
    console.error(`  ✗ package_search gagal: ${error.message}`);
  }

  // Check API key works for create
  if (API_KEY) {
    console.log(`  ✓ API Key tersedia (${API_KEY.slice(0, 20)}...)`);
  } else {
    console.log(`  ⚠ API Key tidak ditemukan — upload dataset mungkin gagal!`);
  }

  // Check datastore
  try {
    const dsStatus = await ckanAction("datastore_search", {
      resource_id: "_table_metadata",
      limit: 0,
    });
    console.log(`  ✓ Datastore aktif`);
  } catch {
    console.log(`  ⚠ Datastore mungkin belum diaktifkan (OK untuk file upload)`);
  }

  console.log("\n✅ CKAN siap untuk menerima dataset baru.");
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     CLEAN DUMMY DATA — SATU DATA BULUNGAN                  ║");
  console.log("║     Menghapus semua data dummy KECUALI akun & publikasi    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nCKAN URL: ${CKAN_BASE_URL}`);
  console.log(`API Key: ${API_KEY ? "✓ tersedia" : "✗ tidak ada"}`);

  try {
    await cleanCkanDatasets();
    resetLocalStore();
    await verifyCkan();
  } catch (error) {
    console.error("\n✗ FATAL ERROR:", error);
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║     ✅ SELESAI — Database siap untuk upload dataset baru   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

main();
