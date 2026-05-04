import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { InternalPortalStore } from "@/lib/types/internal";
import { getProjectRoot } from "@/lib/utils/local-store-path";

const SESSION_COOKIE = "satudata_internal_session";
const ROOT_STORE_PATH = resolve(process.cwd(), "..", ".local", "internal-portal-store.json");

function extractCookie(headerValue: string, cookieName: string): string | null {
  const [firstPart] = headerValue.split(";");
  const [name, value] = firstPart.split("=");
  if (name?.trim() !== cookieName || !value) {
    return null;
  }

  return value;
}

function mutateToken(token: string): string {
  const index = token.length - 1;
  const lastChar = token[index];
  const replacement = lastChar === "a" ? "b" : "a";
  return `${token.slice(0, index)}${replacement}`;
}

async function loginAndGetCookie(request: APIRequestContext, username: string, password: string) {
  const response = await request.post("/api/internal/auth/login", {
    data: { username, password },
  });

  const body = await response.json();
  const setCookie = response
    .headersArray()
    .find((header: { name: string }) => header.name.toLowerCase() === "set-cookie")?.value;

  const sessionCookie = setCookie ? extractCookie(setCookie, SESSION_COOKIE) : null;
  return { response, body, sessionCookie, setCookie };
}

async function readRootStore(): Promise<InternalPortalStore> {
  const raw = await readFile(ROOT_STORE_PATH, "utf8");
  return JSON.parse(raw) as InternalPortalStore;
}

function buildDraftPayload(slug: string) {
  return {
    title: `Draft Audit ${slug}`,
    slug,
    summary: `Ringkasan ${slug}`,
    description: `Deskripsi ${slug}`,
    organization: "Disdukcapil",
    ownerOrgSlug: "disdukcapil",
    topic: "Kependudukan",
    frequency: "Bulanan",
    period: "2026",
    walidata: "Walidata Bulungan",
    coverage: "Kabupaten Bulungan",
    resourceName: `Resource ${slug}`,
    resourceFormat: "CSV",
    resourceUrl: "https://example.com/data.csv",
  };
}

test.describe("Security and Remediation Regression", () => {
  test("login fallback local tetap jalan saat CKAN tidak tersedia", async ({ request }) => {
    const valid = await loginAndGetCookie(request, "admin", "bulungan123");
    expect(valid.response.status()).toBe(200);
    expect(valid.body.success).toBeTruthy();
    expect(valid.sessionCookie).toBeTruthy();

    const invalid = await loginAndGetCookie(request, "admin", "salah-total");
    expect(invalid.response.status()).toBe(401);
    expect(invalid.body.success).toBeFalsy();
    expect(`${invalid.body.error ?? ""}`.toLowerCase()).not.toContain("fetch failed");
  });

  test("session signed: valid diterima, token tamper/forged ditolak, logout clear cookie", async ({ request }) => {
    const login = await loginAndGetCookie(request, "admin", "bulungan123");
    expect(login.response.status()).toBe(200);
    expect(login.sessionCookie).toBeTruthy();

    const validPatch = await request.patch("/api/internal/settings", {
      headers: {
        cookie: `${SESSION_COOKIE}=${login.sessionCookie}`,
      },
      data: {
        portalName: "Satu Data Bulungan",
      },
    });
    expect(validPatch.status()).toBe(200);

    const tampered = await request.patch("/api/internal/settings", {
      headers: {
        cookie: `${SESSION_COOKIE}=${mutateToken(login.sessionCookie!)}`,
      },
      data: {
        portalName: "Percobaan Tampered",
      },
    });
    expect(tampered.status()).toBe(401);

    const forgedPlainSession = {
      userId: "forged-admin",
      username: "attacker",
      name: "Attacker",
      email: "attacker@example.com",
      title: "Attacker",
      role: "admin",
      organizationId: "opd-walidata",
      organizationName: "Walidata",
    };
    const forgedCookie = Buffer.from(JSON.stringify(forgedPlainSession), "utf8").toString("base64");

    const forgedResponse = await request.patch("/api/internal/settings", {
      headers: {
        cookie: `${SESSION_COOKIE}=${forgedCookie}`,
      },
      data: {
        portalName: "Percobaan Forged",
      },
    });
    expect(forgedResponse.status()).toBe(401);

    const logout = await request.post("/api/internal/auth/logout", {
      headers: {
        cookie: `${SESSION_COOKIE}=${login.sessionCookie}`,
      },
    });
    expect(logout.status()).toBe(200);
    const logoutSetCookie = logout
      .headersArray()
      .find((header: { name: string }) => header.name.toLowerCase() === "set-cookie")?.value;
    expect(logoutSetCookie).toContain(`${SESSION_COOKIE}=`);
    expect(logoutSetCookie?.toLowerCase()).toContain("expires=thu, 01 jan 1970");
  });

  test("API internal tanpa sesi => 401 JSON, role tidak berhak => 403 JSON", async ({ request }) => {
    const noSession = await request.patch("/api/internal/settings", {
      data: { portalName: "No Session" },
    });
    expect(noSession.status()).toBe(401);
    expect(noSession.headers()["content-type"]).toContain("application/json");

    const operatorLogin = await loginAndGetCookie(request, "operator.disdukcapil", "operator123");
    expect(operatorLogin.response.status()).toBe(200);

    const forbidden = await request.patch("/api/internal/settings", {
      headers: {
        cookie: `${SESSION_COOKIE}=${operatorLogin.sessionCookie}`,
      },
      data: { portalName: "Operator Tidak Boleh" },
    });
    expect(forbidden.status()).toBe(403);
  });

  test("operator tidak bisa draft lintas OPD, URL non-http ditolak, dan payload XSS tidak tersimpan mentah", async ({ request }) => {
    const operatorLogin = await loginAndGetCookie(request, "operator.disdukcapil", "operator123");
    expect(operatorLogin.response.status()).toBe(200);

    const crossOrgPayload = {
      ...buildDraftPayload(`cross-org-${Date.now()}`),
      organization: "Dinas Kesehatan",
      ownerOrgSlug: "dinas-kesehatan",
    };

    const crossOrg = await request.post("/api/internal/workflow/draft", {
      headers: {
        cookie: `${SESSION_COOKIE}=${operatorLogin.sessionCookie}`,
      },
      data: crossOrgPayload,
    });
    expect(crossOrg.status()).toBe(403);

    const invalidUrl = await request.post("/api/internal/workflow/draft", {
      headers: {
        cookie: `${SESSION_COOKIE}=${operatorLogin.sessionCookie}`,
      },
      data: {
        ...buildDraftPayload(`invalid-url-${Date.now()}`),
        resourceUrl: "javascript:alert(1)",
      },
    });
    expect(invalidUrl.status()).toBe(400);

    const xssSlug = `xss-${Date.now()}`;
    const xssDraft = await request.post("/api/internal/workflow/draft", {
      headers: {
        cookie: `${SESSION_COOKIE}=${operatorLogin.sessionCookie}`,
      },
      data: {
        ...buildDraftPayload(xssSlug),
        title: "<script>alert(1)</script> Judul Aman",
        summary: "<img src=x onerror=alert(1)> Ringkasan Aman",
        description: "<b>Deskripsi Aman</b>",
      },
    });
    expect(xssDraft.status()).toBe(200);

    const store = await readRootStore();
    const saved = store.datasets.find((item) => item.slug === xssSlug);
    expect(saved).toBeTruthy();
    expect(saved?.title).not.toContain("<script>");
    expect(saved?.summary).not.toContain("<img");
    expect(saved?.description).not.toContain("<b>");
  });

  test("operator hanya bisa transisi dataset organisasinya sendiri", async ({ request }) => {
    const dinkesLogin = await loginAndGetCookie(request, "operator.dinkes", "operator123");
    expect(dinkesLogin.response.status()).toBe(200);

    const slug = `transition-${Date.now()}`;
    const draftCreate = await request.post("/api/internal/workflow/draft", {
      headers: {
        cookie: `${SESSION_COOKIE}=${dinkesLogin.sessionCookie}`,
      },
      data: {
        ...buildDraftPayload(slug),
        organization: "Dinas Kesehatan",
        ownerOrgSlug: "dinas-kesehatan",
      },
    });
    expect(draftCreate.status()).toBe(200);

    const toSubmitted = await request.post("/api/internal/workflow/transition", {
      headers: {
        cookie: `${SESSION_COOKIE}=${dinkesLogin.sessionCookie}`,
      },
      data: {
        slug,
        fromStatus: "Draft",
        toStatus: "Submitted",
      },
    });
    expect(toSubmitted.status()).toBe(200);

    const walidataLogin = await loginAndGetCookie(request, "walidata", "walidata123");
    expect(walidataLogin.response.status()).toBe(200);

    const toNeedRevision = await request.post("/api/internal/workflow/transition", {
      headers: {
        cookie: `${SESSION_COOKIE}=${walidataLogin.sessionCookie}`,
      },
      data: {
        slug,
        fromStatus: "Submitted",
        toStatus: "Need Revision",
        reviewNote: "<script>alert(1)</script> revisi metadata",
      },
    });
    expect(toNeedRevision.status()).toBe(200);

    const disdukcapilLogin = await loginAndGetCookie(request, "operator.disdukcapil", "operator123");
    expect(disdukcapilLogin.response.status()).toBe(200);

    const crossOrgTransition = await request.post("/api/internal/workflow/transition", {
      headers: {
        cookie: `${SESSION_COOKIE}=${disdukcapilLogin.sessionCookie}`,
      },
      data: {
        slug,
        fromStatus: "Need Revision",
        toStatus: "Submitted",
      },
    });
    expect(crossOrgTransition.status()).toBe(403);

    const ownOrgTransition = await request.post("/api/internal/workflow/transition", {
      headers: {
        cookie: `${SESSION_COOKIE}=${dinkesLogin.sessionCookie}`,
      },
      data: {
        slug,
        fromStatus: "Need Revision",
        toStatus: "Submitted",
      },
    });
    expect(ownOrgTransition.status()).toBe(200);

    const operatorApprove = await request.post("/api/internal/workflow/transition", {
      headers: {
        cookie: `${SESSION_COOKIE}=${dinkesLogin.sessionCookie}`,
      },
      data: {
        slug,
        fromStatus: "Submitted",
        toStatus: "Approved",
      },
    });
    expect(operatorApprove.status()).toBe(403);
  });

  test("katalog publik hanya menampilkan status Published", async ({ request }) => {
    const operatorLogin = await loginAndGetCookie(request, "operator.disdukcapil", "operator123");
    expect(operatorLogin.response.status()).toBe(200);

    const slug = `public-filter-${Date.now()}`;
    const draftCreate = await request.post("/api/internal/workflow/draft", {
      headers: {
        cookie: `${SESSION_COOKIE}=${operatorLogin.sessionCookie}`,
      },
      data: buildDraftPayload(slug),
    });
    expect(draftCreate.status()).toBe(200);

    const catalog = await request.get("/dataset");
    expect(catalog.status()).toBe(200);
    const catalogHtml = await catalog.text();
    expect(catalogHtml).not.toContain('value="Submitted"');
    expect(catalogHtml).not.toContain('value="Need Revision"');
    expect(catalogHtml).not.toContain(slug);

    const detail = await request.get(`/dataset/${slug}`);
    expect(detail.status()).toBe(404);
  });

  test("path store lokal menggunakan root repo, bukan web/.local", async () => {
    const cwd = process.cwd();
    const repoRoot = resolve(cwd, "..");

    expect(getProjectRoot(cwd)).toBe(repoRoot);
    expect(getProjectRoot(repoRoot)).toBe(repoRoot);
    expect(ROOT_STORE_PATH.startsWith(resolve(repoRoot, ".local"))).toBeTruthy();
  });
});

