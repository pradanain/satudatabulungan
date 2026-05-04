import { basename, resolve } from "node:path";

const loggedPaths = new Set<string>();

export function getProjectRoot(cwd = process.cwd()): string {
  const normalizedBase = basename(cwd).toLowerCase();
  if (normalizedBase === "web" || normalizedBase === "app") {
    return resolve(cwd, "..");
  }

  return cwd;
}

export function resolveLocalStorePath(filename: string, contextLabel?: string): string {
  const path = resolve(getProjectRoot(), ".local", filename);
  const logKey = `${contextLabel ?? "local-store"}:${path}`;

  if (!loggedPaths.has(logKey)) {
    loggedPaths.add(logKey);
    console.info(`[local-store] ${contextLabel ?? "store"} => ${path}`);
  }

  return path;
}

