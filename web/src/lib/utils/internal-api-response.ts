const validationPatterns = [
  "wajib",
  "tidak valid",
  "payload",
  "tidak dikenali",
  "tidak diperbolehkan",
  "protokol",
  "harus berupa url",
  "hostname",
];
const forbiddenPatterns = ["tidak memiliki akses", "tidak memiliki izin", "hanya walidata", "hanya boleh"];
const notFoundPatterns = ["tidak ditemukan"];

export function inferInternalApiErrorStatus(message: string): number {
  const normalized = message.toLowerCase();

  if (forbiddenPatterns.some((pattern) => normalized.includes(pattern))) {
    return 403;
  }

  if (validationPatterns.some((pattern) => normalized.includes(pattern))) {
    return 400;
  }

  if (notFoundPatterns.some((pattern) => normalized.includes(pattern))) {
    return 404;
  }

  return 500;
}
