#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultCacheFile = resolve(rootDir, ".local", "ckan-admin.token");

function parseArgs(argv) {
  const args = {
    container: process.env.CKAN_CONTAINER_NAME?.trim() || "portal_ckan",
    user: "admin",
    label: "local-dev",
    cacheFile: defaultCacheFile,
    format: "token",
    forceCreate: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--force-create") {
      args.forceCreate = true;
      continue;
    }

    if (value === "--container" && argv[i + 1]) {
      args.container = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === "--user" && argv[i + 1]) {
      args.user = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === "--label" && argv[i + 1]) {
      args.label = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === "--cache-file" && argv[i + 1]) {
      args.cacheFile = resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }

    if (value === "--format" && argv[i + 1]) {
      args.format = argv[i + 1];
      i += 1;
      continue;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/ensure-ckan-token.mjs [options]

Options:
  --container <name>    Container CKAN (default: portal_ckan or $CKAN_CONTAINER_NAME)
  --user <name>         Username CKAN (default: admin)
  --label <label>       Label token saat create (default: local-dev)
  --cache-file <path>   Lokasi cache token (default: .local/ckan-admin.token)
  --format <type>       token | powershell | cmd | bash | json (default: token)
  --force-create        Abaikan env/cache dan buat token baru
  -h, --help            Tampilkan bantuan
`);
}

function isJwtLike(token) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

function parseCreatedToken(output) {
  const match = output.match(/^\s*([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\s*$/m);
  return match ? match[1] : "";
}

function createToken(container, user, label) {
  const result = spawnSync(
    "docker",
    ["exec", container, "ckan", "-c", "/srv/app/ckan.ini", "user", "token", "add", user, label],
    { encoding: "utf8" },
  );

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();

  if (result.status !== 0) {
    throw new Error(`Gagal membuat token CKAN.\n${output}`);
  }

  const token = parseCreatedToken(output);
  if (!isJwtLike(token)) {
    throw new Error(`Output token tidak valid.\n${output}`);
  }

  return token;
}

function resolveComposeCkanContainer() {
  const composeFile = resolve(rootDir, "services", "ckan", "docker-compose.yml");
  if (!existsSync(composeFile)) return "";
  const result = spawnSync("docker", ["compose", "-f", composeFile, "ps", "-q", "ckan"], { encoding: "utf8" });
  if (result.status !== 0) return "";
  return (result.stdout ?? "").trim();
}

function dedupe(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    output.push(value);
  }
  return output;
}

function createTokenWithFallback(container, user, label) {
  const candidates = dedupe([
    container,
    process.env.CKAN_CONTAINER_NAME?.trim(),
    "portal_ckan",
    resolveComposeCkanContainer(),
    "bulungan-ckan-app",
  ]);

  const failures = [];
  for (const candidate of candidates) {
    try {
      return createToken(candidate, user, label);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`- ${candidate}: ${message}`);
    }
  }

  throw new Error(`Gagal membuat token CKAN pada semua kandidat container.\n${failures.join("\n")}`);
}

function formatOutput(token, format, source, cacheFile) {
  if (format === "powershell") return `$env:CKAN_API_KEY='${token}'`;
  if (format === "cmd") return `set CKAN_API_KEY=${token}`;
  if (format === "bash") return `export CKAN_API_KEY='${token}'`;
  if (format === "json") {
    return JSON.stringify(
      {
        token,
        source,
        cacheFile,
      },
      null,
      2,
    );
  }

  return token;
}

try {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  let token = "";
  let source = "created";

  if (!args.forceCreate) {
    const fromEnv = process.env.CKAN_API_KEY?.trim();
    if (fromEnv && isJwtLike(fromEnv)) {
      token = fromEnv;
      source = "env";
    }
  }

  if (!token && !args.forceCreate && existsSync(args.cacheFile)) {
    const fromCache = readFileSync(args.cacheFile, "utf8").trim();
    if (isJwtLike(fromCache)) {
      token = fromCache;
      source = "cache";
    }
  }

  if (!token) {
    token = createTokenWithFallback(args.container, args.user, args.label);
    source = "created";
  }

  const cacheDir = dirname(args.cacheFile);
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  writeFileSync(args.cacheFile, `${token}\n`, "utf8");

  console.log(formatOutput(token, args.format, source, args.cacheFile));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
