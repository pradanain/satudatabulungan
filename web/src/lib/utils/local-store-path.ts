import { basename, resolve } from "node:path";
import { existsSync } from "node:fs";

const loggedPaths = new Set<string>();

export function getProjectRoot(cwd = process.cwd()): string {
  const normalizedBase = basename(cwd).toLowerCase();
  if (normalizedBase === "web") {
    return resolve(cwd, "..");
  }

  if (normalizedBase === "app") {
    // In local repo runs, `cwd` can be `<repo>/app` and needs one-level up.
    // In Docker production, `cwd` is usually `/app`, and going up would become `/`.
    const candidateRoot = resolve(cwd, "..");
    const looksLikeWorkspaceRoot =
      existsSync(resolve(candidateRoot, ".git")) ||
      existsSync(resolve(candidateRoot, "web")) ||
      existsSync(resolve(candidateRoot, "services"));

    if (looksLikeWorkspaceRoot) {
      return candidateRoot;
    }
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
