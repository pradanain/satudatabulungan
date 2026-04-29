#!/usr/bin/env node

const baseUrl = process.argv[2] || process.env.CKAN_BASE_URL || "http://localhost:5000";

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${path}`);
  }

  return response.json();
}

try {
  const status = await fetchJson("/api/3/action/status_show");
  const search = await fetchJson("/api/3/action/package_search?rows=1&start=0");
  const total = Number(search?.result?.count ?? 0);
  const firstDataset = search?.result?.results?.[0]?.name ?? "-";

  console.log("CKAN connection: OK");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`status_show.success: ${status?.success === true}`);
  console.log(`dataset_count: ${total}`);
  console.log(`sample_dataset: ${firstDataset}`);
} catch (error) {
  console.error("CKAN connection: FAILED");
  console.error(`Base URL: ${baseUrl}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
