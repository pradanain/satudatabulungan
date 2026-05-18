#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = resolve(rootDir, "web");
const host = "127.0.0.1";
const mockPort = Number(process.env.SMOKE_MOCK_PORT ?? 3300);
const ckanPort = Number(process.env.SMOKE_CKAN_PORT ?? 3301);
const ckanBaseUrl = process.env.CKAN_BASE_URL ?? "http://localhost:5000";
const internalAuthUser = process.env.INTERNAL_BASIC_AUTH_USER ?? "admin";
const internalAuthPassword = process.env.INTERNAL_BASIC_AUTH_PASSWORD ?? "bulungan123";
const skipBuild = process.argv.includes("--skip-build");
const internalAuthHeader = `Basic ${Buffer.from(
  `${internalAuthUser}:${internalAuthPassword}`,
  "utf8",
).toString("base64")}`;

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchWithTimeout(url, timeoutMs = 15000, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        Accept: "text/html,application/json",
        ...extraHeaders,
      },
      signal: controller.signal,
      redirect: "manual",
    });
  } finally {
    clearTimeout(timer);
  }
}

function killProcessTree(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      return;
    }

    child.kill("SIGTERM");
  } catch {
    // no-op
  }
}

function runNpmSync(args, cwd) {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
      cwd,
      stdio: "inherit",
    });
    return;
  }

  execFileSync("npm", args, { cwd, stdio: "inherit" });
}

function spawnNpm(args, cwd, env) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  return spawn("npm", args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitUntilReady(baseUrl, timeoutMs, logs) {
  const start = Date.now();
  const readinessPath = process.env.SMOKE_READY_PATH ?? "/api/internal/workflow/transition";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${readinessPath}`, 10000);
      if (response.status < 500) {
        return;
      }
    } catch {
      // continue waiting
    }
    await sleep(700);
  }

  const output = logs.slice(-15).join("\n");
  throw new Error(`Server tidak ready dalam ${timeoutMs}ms.\n${output}`);
}

async function runServer(mode, port, runChecks) {
  const logs = [];
  const env = {
    ...process.env,
    DATA_SOURCE_MODE: mode,
    CKAN_BASE_URL: ckanBaseUrl,
  };

  const child = spawnNpm(
    ["run", "start", "--", "--hostname", host, "--port", String(port)],
    webDir,
    env,
  );

  child.stdout.on("data", (chunk) => logs.push(chunk.toString("utf8").trim()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString("utf8").trim()));

  try {
    await waitUntilReady(`http://${host}:${port}`, 35000, logs);
    await runChecks(`http://${host}:${port}`);
  } finally {
    killProcessTree(child);
  }
}

async function assertRoute(baseUrl, path, expectedStatus = 200, headers = {}) {
  const response = await fetchWithTimeout(`${baseUrl}${path}`, 15000, headers);
  const statusMatch = Array.isArray(expectedStatus)
    ? expectedStatus.includes(response.status)
    : response.status === expectedStatus;
    
  if (!statusMatch) {
    throw new Error(`Route ${path} expected ${expectedStatus}, got ${response.status}`);
  }
  return response.text();
}

async function ensureCkanOnline() {
  const response = await fetchWithTimeout(`${ckanBaseUrl}/api/3/action/status_show`, 15000);
  if (!response.ok) {
    throw new Error(`CKAN status_show gagal: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error("CKAN status_show tidak sukses.");
  }
}

async function getFirstCkanSlug() {
  const response = await fetchWithTimeout(
    `${ckanBaseUrl}/api/3/action/package_search?rows=1&start=0`,
    15000,
  );
  if (!response.ok) {
    throw new Error(`CKAN package_search gagal: ${response.status}`);
  }

  const data = await response.json();
  const first = data?.result?.results?.[0]?.name;
  return typeof first === "string" ? first : "";
}

async function run() {
  if (!skipBuild) {
    runNpmSync(["run", "build"], webDir);
  }

  console.log("Smoke mock mode...");
  await runServer("mock", mockPort, async (baseUrl) => {
    await assertRoute(baseUrl, "/");
    await assertRoute(baseUrl, "/dataset");
    await assertRoute(baseUrl, "/dataset/jumlah-penduduk-per-kecamatan-2025");
    await assertRoute(baseUrl, "/topik");
    await assertRoute(baseUrl, "/organisasi");
    await assertRoute(baseUrl, "/metadata");
    await assertRoute(baseUrl, "/api");
    await assertRoute(baseUrl, "/internal/workflow", [401, 307]);
    await assertRoute(baseUrl, "/internal/workflow", 200, {
      Authorization: internalAuthHeader,
    });
    await assertRoute(baseUrl, "/internal/workflow/jumlah-penduduk-per-kecamatan-2025/audit", [401, 307]);
    await assertRoute(baseUrl, "/internal/workflow/jumlah-penduduk-per-kecamatan-2025/audit", 200, {
      Authorization: internalAuthHeader,
    });
    await assertRoute(
      baseUrl,
      "/api/internal/workflow/jumlah-penduduk-per-kecamatan-2025/audit/export?format=json",
      401,
    );
    await assertRoute(
      baseUrl,
      "/api/internal/workflow/jumlah-penduduk-per-kecamatan-2025/audit/export?format=csv&actor=admin",
      200,
      {
        Authorization: internalAuthHeader,
      },
    );
  });
  console.log("Mock mode: PASS");

  console.log("Smoke ckan mode...");
  await ensureCkanOnline();
  const firstSlug = await getFirstCkanSlug();

  await runServer("ckan", ckanPort, async (baseUrl) => {
    const datasetHtml = await assertRoute(baseUrl, "/dataset");
    await assertRoute(baseUrl, "/api");
    await assertRoute(baseUrl, "/internal/workflow", [401, 307]);
    await assertRoute(baseUrl, "/internal/workflow", 200, {
      Authorization: internalAuthHeader,
    });

    if (firstSlug) {
      await assertRoute(baseUrl, `/dataset/${encodeURIComponent(firstSlug)}`);
      await assertRoute(baseUrl, `/internal/workflow/${encodeURIComponent(firstSlug)}/audit`, [401, 307]);
      await assertRoute(
        baseUrl,
        `/internal/workflow/${encodeURIComponent(firstSlug)}/audit?actor=admin`,
        200,
        {
          Authorization: internalAuthHeader,
        },
      );
      await assertRoute(
        baseUrl,
        `/api/internal/workflow/${encodeURIComponent(firstSlug)}/audit/export?format=json`,
        401,
      );
      await assertRoute(
        baseUrl,
        `/api/internal/workflow/${encodeURIComponent(firstSlug)}/audit/export?format=csv&actor=admin`,
        200,
        {
          Authorization: internalAuthHeader,
        },
      );
    } else if (!datasetHtml.includes("Tidak ada dataset yang cocok")) {
      throw new Error("CKAN mode tanpa dataset tidak menampilkan empty state.");
    }
  });
  console.log("CKAN mode: PASS");
  console.log("Dual mode smoke: PASS");
}

run().catch((error) => {
  console.error("Dual mode smoke: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
