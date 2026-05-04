const DEFAULT_FETCH_TIMEOUT_MS = 3_000;
const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
]);

type AggregateWithErrors = AggregateError & {
  errors?: unknown[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function collectErrorCodes(error: unknown, output: Set<string>): void {
  const record = asRecord(error);
  if (!record) {
    return;
  }

  const code = record.code;
  if (typeof code === "string" && code.trim()) {
    output.add(code.trim().toUpperCase());
  }

  const cause = record.cause;
  if (cause) {
    collectErrorCodes(cause, output);
  }

  if (error instanceof AggregateError) {
    for (const nested of (error as AggregateWithErrors).errors ?? []) {
      collectErrorCodes(nested, output);
    }
  }
}

function collectErrorMessages(error: unknown, output: string[]): void {
  if (error instanceof Error) {
    if (error.message?.trim()) {
      output.push(error.message.trim());
    }

    const cause = asRecord(error)?.cause;
    if (cause) {
      collectErrorMessages(cause, output);
    }
  }

  if (error instanceof AggregateError) {
    for (const nested of (error as AggregateWithErrors).errors ?? []) {
      collectErrorMessages(nested, output);
    }
  }
}

export function getConfiguredFetchTimeoutMs(): number {
  const envValue = Number(process.env.CKAN_FETCH_TIMEOUT_MS ?? DEFAULT_FETCH_TIMEOUT_MS);
  if (!Number.isFinite(envValue) || envValue <= 0) {
    return DEFAULT_FETCH_TIMEOUT_MS;
  }

  return Math.floor(envValue);
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = getConfiguredFetchTimeoutMs(),
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function isUpstreamNetworkError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const codes = new Set<string>();
  collectErrorCodes(error, codes);
  if (codes.size === 0) {
    return false;
  }

  return Array.from(codes).some((code) => NETWORK_ERROR_CODES.has(code));
}

export function summarizeUpstreamError(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "timeout";
  }

  const codes = new Set<string>();
  collectErrorCodes(error, codes);
  if (codes.size > 0) {
    return `network-${Array.from(codes).join(",")}`;
  }

  const messages: string[] = [];
  collectErrorMessages(error, messages);
  const message = messages.find((item) => item.length > 0);
  if (message) {
    return message;
  }

  return "unknown";
}
