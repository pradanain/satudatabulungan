import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { NextResponse } from "next/server";
import { walidataTargets } from "@/lib/data/layanan-data";
import { resolveLocalStorePath } from "@/lib/utils/local-store-path";

type DataRequestPayload = {
  requesterName?: string;
  requesterEmail?: string;
  requesterInstitution?: string;
  requesterPhone?: string;
  targetWalidataId?: string;
  requestPurpose?: string;
  requestedDataDescription?: string;
  usagePurpose?: string;
  periodStart?: string;
  periodEnd?: string;
  preferredFormat?: string;
  additionalNotes?: string;
  company?: string;
};

type RateLimitState = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitStore = new Map<string, RateLimitState>();

function getStorePath(): string {
  return resolveLocalStorePath("public-data-requests.jsonl", "public-data-requests");
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown-ip";
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  return `${ip}:${userAgent.slice(0, 100)}`;
}

function checkRateLimit(request: Request): { limited: boolean; retryAfterSec?: number } {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now - current.windowStart > WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { limited: false };
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1000));
    return { limited: true, retryAfterSec };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { limited: false };
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

function getValidationError(payload: DataRequestPayload): string | null {
  if (cleanText(payload.company).length > 0) {
    return "Permintaan terdeteksi tidak valid.";
  }

  const requesterName = cleanText(payload.requesterName);
  const requesterEmail = cleanText(payload.requesterEmail).toLowerCase();
  const requesterInstitution = cleanText(payload.requesterInstitution);
  const requesterPhone = cleanText(payload.requesterPhone);
  const targetWalidataId = cleanText(payload.targetWalidataId);
  const requestPurpose = cleanText(payload.requestPurpose);
  const requestedDataDescription = cleanText(payload.requestedDataDescription);
  const usagePurpose = cleanText(payload.usagePurpose);
  const periodStart = cleanText(payload.periodStart);
  const periodEnd = cleanText(payload.periodEnd);
  const preferredFormat = cleanText(payload.preferredFormat);
  const additionalNotes = cleanText(payload.additionalNotes);

  if (!requesterName || requesterName.length < 3 || requesterName.length > 120) {
    return "Nama pemohon tidak valid.";
  }

  if (!validateEmail(requesterEmail) || requesterEmail.length > 160) {
    return "Email pemohon tidak valid.";
  }

  if (!requesterInstitution || requesterInstitution.length > 160) {
    return "Instansi pemohon tidak valid.";
  }

  if (!requesterPhone || requesterPhone.length < 8 || requesterPhone.length > 40) {
    return "Nomor kontak tidak valid.";
  }

  if (!targetWalidataId) {
    return "Tujuan walidata harus dipilih.";
  }

  const knownTarget = walidataTargets.find((item) => item.id === targetWalidataId);
  if (!knownTarget) {
    return "Tujuan walidata tidak ditemukan.";
  }

  if (!requestPurpose || requestPurpose.length > 120) {
    return "Tujuan permintaan tidak valid.";
  }

  if (!requestedDataDescription || requestedDataDescription.length < 20 || requestedDataDescription.length > 2500) {
    return "Deskripsi data yang diminta belum cukup lengkap.";
  }

  if (!usagePurpose || usagePurpose.length < 20 || usagePurpose.length > 2000) {
    return "Tujuan pemanfaatan data belum cukup lengkap.";
  }

  if (!validateDate(periodStart) || !validateDate(periodEnd)) {
    return "Periode permintaan tidak valid.";
  }

  if (periodStart > periodEnd) {
    return "Periode mulai tidak boleh lebih besar dari periode akhir.";
  }

  if (!preferredFormat || preferredFormat.length > 40) {
    return "Format data prioritas tidak valid.";
  }

  if (additionalNotes.length > 1200) {
    return "Catatan tambahan terlalu panjang.";
  }

  return null;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Asal permintaan tidak diizinkan.",
      },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(request);
  if (limit.limited) {
    return NextResponse.json(
      {
        success: false,
        message: "Terlalu banyak permintaan. Silakan ulangi beberapa saat lagi.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec ?? 60),
        },
      },
    );
  }

  let payload: DataRequestPayload;
  try {
    payload = (await request.json()) as DataRequestPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Payload JSON tidak valid.",
      },
      { status: 400 },
    );
  }

  const validationError = getValidationError(payload);
  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 },
    );
  }

  const target = walidataTargets.find((item) => item.id === cleanText(payload.targetWalidataId));
  if (!target) {
    return NextResponse.json(
      {
        success: false,
        message: "Tujuan walidata tidak ditemukan.",
      },
      { status: 400 },
    );
  }

  const createdAt = new Date();
  const ticketId = `REQ-${createdAt.toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const record = {
    ticketId,
    createdAt: createdAt.toISOString(),
    requesterName: cleanText(payload.requesterName),
    requesterEmail: cleanText(payload.requesterEmail).toLowerCase(),
    requesterInstitution: cleanText(payload.requesterInstitution),
    requesterPhone: cleanText(payload.requesterPhone),
    targetWalidataId: target.id,
    targetWalidataLabel: target.label,
    targetWalidataEmail: target.email,
    requestPurpose: cleanText(payload.requestPurpose),
    requestedDataDescription: cleanText(payload.requestedDataDescription),
    usagePurpose: cleanText(payload.usagePurpose),
    periodStart: cleanText(payload.periodStart),
    periodEnd: cleanText(payload.periodEnd),
    preferredFormat: cleanText(payload.preferredFormat),
    additionalNotes: cleanText(payload.additionalNotes),
    sourceIp: (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") ?? null,
  };

  try {
    const storePath = getStorePath();
    await mkdir(dirname(storePath), { recursive: true });
    await appendFile(storePath, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan permintaan. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Permintaan data berhasil diterima dan diteruskan ke walidata tujuan.",
      ticketId,
      targetLabel: target.label,
      targetEmail: target.email,
    },
    { status: 201 },
  );
}
