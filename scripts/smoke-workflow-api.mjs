#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = resolve(rootDir, "web");
const ckanBaseUrl = process.env.CKAN_BASE_URL ?? "http://localhost:5000";
const internalAuthUser = process.env.INTERNAL_BASIC_AUTH_USER ?? "admin";
const internalAuthPassword = process.env.INTERNAL_BASIC_AUTH_PASSWORD ?? "bulungan123";
const testPort = Number(process.env.SMOKE_WORKFLOW_API_PORT ?? 3325);
const testSlug = process.env.SMOKE_WORKFLOW_API_SLUG ?? "jumlah-penduduk-bulungan-2023-2025";
const basicAuthHeader = ""; // Removed basic auth

const transitions = {
  Draft: "Submitted",
  Submitted: "Approved",
  "Need Revision": "Submitted",
  Approved: "Published",
  Published: "Archived",
  Archived: "",
};

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
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
    // ignore
  }
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

async function fetchWithTimeout(url, timeoutMs = 15000, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json,text/html",
        ...extraHeaders,
      },
      signal: controller.signal,
      redirect: "manual",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function waitServerReady(baseUrl, timeoutMs, logs) {
  const start = Date.now();
  const readinessPath = process.env.SMOKE_READY_PATH ?? "/api/internal/workflow/transition";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${readinessPath}`, 10000);
      if (response.status < 500) {
        return;
      }
    } catch {
      // retry
    }

    await sleep(700);
  }

  throw new Error(`Server tidak ready.\n${logs.slice(-20).join("\n")}`);
}

async function fetchCkanStatus(slug) {
  const response = await fetchWithTimeout(
    `${ckanBaseUrl}/api/3/action/package_show?id=${encodeURIComponent(slug)}`,
    15000,
  );
  if (!response.ok) {
    throw new Error(`package_show gagal: ${response.status}`);
  }

  const data = await response.json();
  const extras = data?.result?.extras ?? [];
  const status = extras.find((item) => String(item?.key).toLowerCase() === "status")?.value;
  return String(status ?? "");
}

async function run() {
  const logs = [];
  const env = {
    ...process.env,
    DATA_SOURCE_MODE: "ckan",
    CKAN_BASE_URL: ckanBaseUrl,
    INTERNAL_BASIC_AUTH_USER: internalAuthUser,
    INTERNAL_BASIC_AUTH_PASSWORD: internalAuthPassword,
  };

  const child = spawnNpm(
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(testPort)],
    webDir,
    env,
  );
  child.stdout.on("data", (chunk) => logs.push(chunk.toString("utf8").trim()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString("utf8").trim()));

  try {
    const baseUrl = `http://127.0.0.1:${testPort}`;
    await waitServerReady(baseUrl, 35000, logs);

    const loginRes = await fetch(`${baseUrl}/api/internal/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: internalAuthUser, password: internalAuthPassword }),
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    const setCookie = loginRes.headers.get("set-cookie");
    const authCookie = setCookie ? setCookie.split(";")[0] : "";

    const unauthorized = await fetchWithTimeout(`${baseUrl}/api/internal/workflow/transition`, 10000, {
      "Content-Type": "application/json",
    });
    if (unauthorized.status !== 401) {
      throw new Error(`Expected 401 without auth, got ${unauthorized.status}`);
    }

    const auditUnauthorized = await fetchWithTimeout(
      `${baseUrl}/internal/workflow/${encodeURIComponent(testSlug)}/audit`,
      10000,
    );
    if (auditUnauthorized.status !== 401 && auditUnauthorized.status !== 307) {
      throw new Error(
        `Expected 401 or 307 for audit page without auth, got ${auditUnauthorized.status}`,
      );
    }

    const auditExportUnauthorized = await fetchWithTimeout(
      `${baseUrl}/api/internal/workflow/${encodeURIComponent(testSlug)}/audit/export?format=json`,
      10000,
    );
    if (auditExportUnauthorized.status !== 401) {
      throw new Error(
        `Expected 401 for audit export without auth, got ${auditExportUnauthorized.status}`,
      );
    }

    const fromStatus = await fetchCkanStatus(testSlug);
    const nextStatus = transitions[fromStatus];
    if (!nextStatus) {
      throw new Error(`Tidak ada transisi lanjutan valid dari status '${fromStatus}'.`);
    }

    const payload = JSON.stringify({
      slug: testSlug,
      fromStatus,
      toStatus: nextStatus,
    });

    const transitionPost = await fetch(`${baseUrl}/api/internal/workflow/transition`, {
      method: "POST",
      headers: {
        Cookie: authCookie,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const transitionJson = await transitionPost.json();
    if (!transitionPost.ok || !transitionJson?.success) {
      throw new Error(
        `Transition API gagal: ${transitionJson?.error ?? transitionPost.statusText}`,
      );
    }

    const afterStatus = await fetchCkanStatus(testSlug);
    if (afterStatus !== nextStatus) {
      throw new Error(`Status CKAN tidak berubah. Expected ${nextStatus}, got ${afterStatus}`);
    }

    const auditAuthorized = await fetchWithTimeout(
      `${baseUrl}/internal/workflow/${encodeURIComponent(
        testSlug,
      )}/audit?actor=${encodeURIComponent(internalAuthUser)}&status=${encodeURIComponent(
        nextStatus,
      )}`,
      15000,
      {
        Cookie: authCookie,
      },
    );
    if (auditAuthorized.status !== 200) {
      throw new Error(`Audit page dengan auth gagal: ${auditAuthorized.status}`);
    }

    const auditExportJson = await fetchWithTimeout(
      `${baseUrl}/api/internal/workflow/${encodeURIComponent(
        testSlug,
      )}/audit/export?format=json&actor=${encodeURIComponent(internalAuthUser)}&status=${encodeURIComponent(
        nextStatus,
      )}`,
      15000,
      {
        Cookie: authCookie,
      },
    );
    if (auditExportJson.status !== 200) {
      throw new Error(`Audit export json dengan auth gagal: ${auditExportJson.status}`);
    }

    const exportJsonPayload = await auditExportJson.json();
    if (!exportJsonPayload?.success || !Array.isArray(exportJsonPayload?.entries)) {
      throw new Error("Payload audit export json tidak valid.");
    }

    const auditExportCsv = await fetchWithTimeout(
      `${baseUrl}/api/internal/workflow/${encodeURIComponent(
        testSlug,
      )}/audit/export?format=csv&actor=${encodeURIComponent(internalAuthUser)}`,
      15000,
      {
        Cookie: authCookie,
      },
    );
    if (auditExportCsv.status !== 200) {
      throw new Error(`Audit export csv dengan auth gagal: ${auditExportCsv.status}`);
    }

    const exportCsvBody = await auditExportCsv.text();
    if (!exportCsvBody.includes("slug,actor,at,fromStatus,toStatus,persistedTo,reviewNote")) {
      throw new Error("Header CSV audit export tidak sesuai.");
    }
    if (!exportCsvBody.includes(testSlug)) {
      throw new Error("CSV audit export tidak memuat slug target.");
    }

    console.log("Workflow API smoke: PASS");
    console.log(`slug=${testSlug}; from=${fromStatus}; to=${afterStatus}`);
  } finally {
    killProcessTree(child);
  }
}

run().catch((error) => {
  console.error("Workflow API smoke: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
