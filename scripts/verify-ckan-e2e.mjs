#!/usr/bin/env node

/**
 * End-to-End Verification: CKAN → Web App Data Pipeline
 * 
 * Tests that the seeded data in CKAN is accessible via the same API patterns
 * used by the Next.js portal (ckan-portal-api.ts).
 */

const baseUrl = process.argv[2] || process.env.CKAN_BASE_URL || "http://localhost:5000";
const apiBase = `${baseUrl.replace(/\/+$/, "")}/api/3/action`;

let passed = 0;
let failed = 0;

async function ckanAction(action, payload = {}) {
  const response = await fetch(`${apiBase}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${action}`);
  const data = await response.json();
  if (!data.success) throw new Error(`${action} returned success=false`);
  return data.result;
}

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ""}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function testStatusShow() {
  console.log("\n🔌 1. CKAN Status");
  const result = await ckanAction("status_show");
  assert("status_show returns valid", !!result);
  assert("CKAN version detected", !!result.ckan_version, `v${result.ckan_version}`);
}

async function testOrganizations() {
  console.log("\n🏛️  2. Organizations (getOrganizations)");
  const names = await ckanAction("organization_list", { all_fields: false });
  assert("organization_list returns array", Array.isArray(names), `${names.length} organizations`);
  assert("At least 10 organizations exist", names.length >= 10);

  // Test individual org show (same as getOrganizationById)
  const orgDetail = await ckanAction("organization_show", {
    id: names[0],
    include_datasets: false,
    include_dataset_count: true,
    include_extras: true,
  });
  assert("organization_show works", !!orgDetail.id, `${orgDetail.title}`);
  assert("Org has extras (email/website)", Array.isArray(orgDetail.extras) && orgDetail.extras.length > 0);
}

async function testDatasets() {
  console.log("\n📊 3. Datasets (getDatasets)");
  const search = await ckanAction("package_search", {
    q: "*:*",
    rows: 1000,
    start: 0,
    include_private: true,
  });
  const total = search.count;
  const results = search.results;
  assert("package_search returns results", total > 0, `${total} total packages`);
  assert("At least 37 datasets seeded", total >= 37);

  // Verify content_type classification
  const extrasMap = (extras) => Object.fromEntries((extras || []).map(e => [e.key, e.value]));
  
  const datasets = results.filter(p => {
    const ct = extrasMap(p.extras).content_type || "dataset";
    return ct === "dataset";
  });
  const infografis = results.filter(p => {
    const ct = extrasMap(p.extras).content_type || "";
    return ct === "infografis";
  });
  const publikasi = results.filter(p => {
    const ct = extrasMap(p.extras).content_type || "";
    return ct === "publikasi";
  });

  assert("Dataset content_type filter works", datasets.length >= 37, `${datasets.length} datasets`);
  assert("Infografis content_type filter works", infografis.length >= 9, `${infografis.length} infografis`);
  assert("Publikasi content_type filter works", publikasi.length >= 7, `${publikasi.length} publikasi`);
}

async function testDatasetDetail() {
  console.log("\n📋 4. Dataset Detail (getDatasetById)");
  const pkg = await ckanAction("package_show", { id: "jumlah-penduduk-bulungan-2023-2025" });
  assert("package_show works by slug", !!pkg.id);
  assert("Dataset has title", !!pkg.title, pkg.title);
  assert("Dataset has notes/description", !!pkg.notes);
  assert("Dataset has organization", !!pkg.organization?.title, pkg.organization?.title);
  assert("Dataset has tags", Array.isArray(pkg.tags) && pkg.tags.length > 0, `${pkg.tags.length} tags`);
  assert("Dataset has extras (topik, tahun, etc.)", Array.isArray(pkg.extras) && pkg.extras.length > 0);

  // Check extras contain portal-required fields
  const extras = Object.fromEntries((pkg.extras || []).map(e => [e.key, e.value]));
  assert("Extra: content_type present", !!extras.content_type, extras.content_type);
  assert("Extra: topik present", !!extras.topik, extras.topik);
  assert("Extra: tahun_data present", !!extras.tahun_data, extras.tahun_data);
  assert("Extra: periode present", !!extras.periode, extras.periode);
}

async function testResources() {
  console.log("\n📁 5. Resources (download capability)");
  const pkg = await ckanAction("package_show", { id: "jumlah-penduduk-bulungan-2023-2025" });
  const resources = pkg.resources || [];
  assert("Dataset has resources", resources.length > 0, `${resources.length} resources`);

  const formats = resources.map(r => r.format);
  assert("Has CSV resource", formats.includes("CSV"));
  assert("Has JSON resource", formats.includes("JSON"));
  assert("Has PDF resource", formats.includes("PDF"));

  // Actually download a resource to verify it's accessible
  const csvResource = resources.find(r => r.format === "CSV");
  if (csvResource?.url) {
    try {
      const dlResp = await fetch(csvResource.url);
      assert("CSV resource is downloadable", dlResp.ok, `HTTP ${dlResp.status}`);
      const text = await dlResp.text();
      assert("CSV has content", text.length > 10, `${text.length} chars`);
      assert("CSV has header row", text.includes("kecamatan") || text.includes(","));
    } catch (e) {
      assert("CSV resource download", false, e.message);
    }
  }
}

async function testTopicFiltering() {
  console.log("\n🏷️  6. Topic/Tag Filtering");
  const search = await ckanAction("package_search", {
    q: "*:*",
    rows: 1000,
    start: 0,
  });
  const extrasMap = (extras) => Object.fromEntries((extras || []).map(e => [e.key, e.value]));
  
  const topicSet = new Set();
  for (const pkg of search.results) {
    const extras = extrasMap(pkg.extras);
    if (extras.topik) topicSet.add(extras.topik);
  }
  assert("Multiple topics/topik detected", topicSet.size >= 5, `Topics: ${[...topicSet].join(", ")}`);
}

async function testOrgFiltering() {
  console.log("\n🏢 7. Organization Filtering (getDatasetsByOrganization)");
  const orgs = await ckanAction("organization_list", { all_fields: true });
  const withDatasets = orgs.filter(o => (o.package_count || 0) > 0);
  assert("Organizations with datasets exist", withDatasets.length > 0, `${withDatasets.length} orgs with data`);

  // Test querying by organization
  if (withDatasets.length > 0) {
    const orgName = withDatasets[0].name;
    const search = await ckanAction("package_search", {
      q: `owner_org:${withDatasets[0].id}`,
      rows: 100,
    });
    assert(`Org filter returns data for ${orgName}`, search.count > 0, `${search.count} datasets`);
  }
}

async function testInfografisSpecific() {
  console.log("\n🖼️  8. Infografis (getInfographics)");
  const pkg = await ckanAction("package_show", {
    id: "infografis-bulungan-01-statistik-penduduk-kabupaten-bulungan-2025"
  });
  assert("Infografis package accessible", !!pkg.id);
  const extras = Object.fromEntries((pkg.extras || []).map(e => [e.key, e.value]));
  assert("Infografis has content_type=infografis", extras.content_type === "infografis");
  assert("Infografis has thumbnail_url", !!extras.thumbnail_url);
}

async function testPublikasiSpecific() {
  console.log("\n📚 9. Publikasi (getBooks)");
  const pkg = await ckanAction("package_show", {
    id: "publikasi-bulungan-01-kabupaten-bulungan-dalam-angka-2025"
  });
  assert("Publikasi package accessible", !!pkg.id);
  const extras = Object.fromEntries((pkg.extras || []).map(e => [e.key, e.value]));
  assert("Publikasi has content_type=publikasi", extras.content_type === "publikasi");
}

async function run() {
  console.log("═══════════════════════════════════════════════════════");
  console.log(" 🧪 Satu Data Bulungan — CKAN E2E Verification");
  console.log(`    Base URL: ${baseUrl}`);
  console.log("═══════════════════════════════════════════════════════");

  try {
    await testStatusShow();
    await testOrganizations();
    await testDatasets();
    await testDatasetDetail();
    await testResources();
    await testTopicFiltering();
    await testOrgFiltering();
    await testInfografisSpecific();
    await testPublikasiSpecific();
  } catch (err) {
    console.error(`\n💥 Fatal error: ${err.message}`);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(` 📊 Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log("═══════════════════════════════════════════════════════");
  
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
