export function validateResourceUrl(value: string): { valid: true } | { valid: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Field 'resourceUrl' wajib diisi.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: "Field 'resourceUrl' harus berupa URL yang valid (http/https).",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      valid: false,
      error: "Field 'resourceUrl' hanya mendukung protokol http:// atau https://.",
    };
  }

  if (!parsed.hostname) {
    return {
      valid: false,
      error: "Field 'resourceUrl' harus memiliki hostname yang valid.",
    };
  }

  return { valid: true };
}

