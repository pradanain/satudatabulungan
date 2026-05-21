import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repo = 'c:/Projects/satudatabulungan';
const webDir = path.join(repo, 'web');
const baseUrl = 'http://127.0.0.1:3329';
const ckanBase = 'http://localhost:5000';
const storePath = path.join(repo, '.local', 'internal-portal-store.json');

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function startDevServer() {
  const child = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --hostname 127.0.0.1 --port 3329'], {
    cwd: webDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logs = [];
  child.stdout.on('data', (d) => logs.push(String(d).trim()));
  child.stderr.on('data', (d) => logs.push(String(d).trim()));
  return { child, logs };
}

function stopDevServer(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {}
}

async function waitReady(logs, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${baseUrl}/api/internal/auth/login`, { method: 'GET', redirect: 'manual' });
      if (r.status < 500) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error(`Server tidak ready. Last logs:\n${logs.slice(-40).join('\n')}`);
}

function pickSetCookie(res) {
  const raw = res.headers.get('set-cookie') || '';
  if (!raw) return '';
  return raw.split(';')[0];
}

async function login(username, password) {
  const r = await fetch(`${baseUrl}/api/internal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body?.success) {
    throw new Error(`Login gagal ${username}: ${body?.error || r.status}`);
  }
  const cookie = pickSetCookie(r);
  if (!cookie) throw new Error(`Login ${username} tidak mengembalikan cookie sesi.`);
  return { cookie, body };
}

async function api(method, url, cookie, payload) {
  const r = await fetch(`${baseUrl}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, ok: r.ok, json, text };
}

function readStore() {
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function findDataset(store, slug) {
  return store.datasets.find((d) => d.slug === slug);
}

async function waitPublicContains(pathname, needle, timeoutMs = 240000, intervalMs = 6000) {
  const started = Date.now();
  let lastStatus = 0;
  let lastErr = '';
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${baseUrl}${pathname}`, { method: 'GET' });
      lastStatus = r.status;
      const html = await r.text();
      if (r.ok && html.toLowerCase().includes(needle.toLowerCase())) {
        return { ok: true, status: r.status, waitedMs: Date.now() - started };
      }
    } catch (e) {
      lastErr = String(e?.message || e);
    }
    await sleep(intervalMs);
  }
  return { ok: false, status: lastStatus, error: lastErr, waitedMs: Date.now() - started };
}

async function main() {
  const { child, logs } = startDevServer();
  const report = {
    produsenUser: null,
    walidataUser: 'walidata.dkip',
    dataset: {},
    bukuDigital: {},
    publicChecks: {},
    steps: [],
  };

  const step = (msg) => { report.steps.push({ at: new Date().toISOString(), msg }); console.log('[STEP]', msg); };

  try {
    await waitReady(logs);
    step('Server ready');

    const initialStore = readStore();
    const produsen = initialStore.users.find((u) => u.username === 'operator.disdukcapil' && u.status === 'Aktif');
    if (!produsen) throw new Error('Akun operator.disdukcapil tidak ditemukan.');
    const org = initialStore.organizations.find((o) => o.id === produsen.organizationId);
    if (!org) throw new Error('Organisasi produsen tidak ditemukan.');
    report.produsenUser = produsen.username;

    const produsenLogin = await login(produsen.username, 'bulunganbisa');
    const walidataLogin = await login('walidata.dkip', 'bulunganbisa');
    step(`Login produsen (${produsen.username}) + walidata berhasil`);

    const ts = Date.now();

    const datasetSlug = `e2e-dataset-${ts}`;
    const datasetTitle = `E2E Dataset ${ts}`;
    const datasetPayload = {
      title: datasetTitle,
      slug: datasetSlug,
      summary: 'Dataset uji alur end-to-end.',
      description: 'Dataset uji alur produsen ke walidata hingga publish.',
      organization: org.shortName || org.name,
      ownerOrgSlug: org.slug,
      topic: (initialStore.topics?.[0]?.name) || 'Kependudukan',
      frequency: 'Bulanan',
      period: '2026',
      walidata: 'Walidata Bulungan',
      coverage: 'Kabupaten Bulungan',
      resourceName: 'Data Uji E2E',
      resourceFormat: 'CSV',
      resourceUrl: 'https://example.com/e2e-dataset.csv',
      tags: ['e2e', 'uji-alur', 'dataset'],
      unit: 'unit',
      preview: {
        points: [{ label: 'Jan', value: 10 }],
        rows: [{ area: 'Tanjung Selor', total: 10 }],
        insights: [{ label: 'Total', value: '10', description: 'Uji' }],
      },
    };

    const draftRes = await api('POST', '/api/internal/workflow/draft', produsenLogin.cookie, datasetPayload);
    if (!draftRes.ok || !draftRes.json?.success) throw new Error(`Gagal buat draft dataset: ${draftRes.text}`);
    step(`Draft dataset dibuat: ${datasetSlug}`);

    const transitions = [
      ['Draft', 'Submitted', produsenLogin.cookie],
      ['Submitted', 'Under Review', walidataLogin.cookie],
      ['Under Review', 'Approved', walidataLogin.cookie],
      ['Approved', 'Published', walidataLogin.cookie],
    ];

    for (const [fromStatus, toStatus, cookie] of transitions) {
      const tr = await api('POST', '/api/internal/workflow/transition', cookie, { slug: datasetSlug, fromStatus, toStatus });
      if (!tr.ok || !tr.json?.success) throw new Error(`Gagal transisi ${fromStatus}->${toStatus}: ${tr.text}`);
      step(`Transisi dataset ${fromStatus} -> ${toStatus} sukses`);
    }

    const storeAfterDataset = readStore();
    const dataset = findDataset(storeAfterDataset, datasetSlug);
    if (!dataset) throw new Error('Dataset hasil uji tidak ditemukan di store.');
    report.dataset = {
      slug: datasetSlug,
      title: datasetTitle,
      finalStatus: dataset.status,
      submissionCount: dataset.submissionCount,
      workflowCount: Array.isArray(dataset.workflowHistory) ? dataset.workflowHistory.length : 0,
    };
    if (dataset.status !== 'Published') throw new Error(`Status akhir dataset bukan Published, tetapi ${dataset.status}`);

    const datasetPublic = await waitPublicContains(`/dataset/${datasetSlug}`, datasetTitle, 180000, 5000);
    report.publicChecks.datasetDetail = datasetPublic;
    if (!datasetPublic.ok) throw new Error(`Dataset belum tampil di publik detail. status=${datasetPublic.status} err=${datasetPublic.error || ''}`);
    step('Dataset sudah tampil di publik detail');

    const bukuTitle = `E2E Buku Digital ${ts}`;
    const createBookRes = await api('POST', '/api/internal/publications', produsenLogin.cookie, {
      title: bukuTitle,
      type: 'digital_publication',
      description: 'Buku digital uji alur end-to-end.',
      organizationId: produsen.organizationId,
      year: '2026',
      fileUrl: 'https://example.com/e2e-buku-digital.pdf',
      status: 'Draft',
    });

    if (!createBookRes.ok || !createBookRes.json?.success) {
      throw new Error(`Gagal membuat buku digital draft: ${createBookRes.text}`);
    }

    const bukuSlug = createBookRes.json?.result?.slug;
    if (!bukuSlug) throw new Error('Slug buku digital tidak ditemukan dari response create.');
    step(`Draft buku digital dibuat: ${bukuSlug}`);

    const actions = [
      ['submit', produsenLogin.cookie],
      ['approve', walidataLogin.cookie],
      ['publish', walidataLogin.cookie],
    ];
    for (const [action, cookie] of actions) {
      const res = await api('PATCH', `/api/internal/publications/${bukuSlug}`, cookie, { action });
      if (!res.ok || !res.json?.success) throw new Error(`Gagal action buku ${action}: ${res.text}`);
      step(`Buku digital action ${action} sukses`);
    }

    const ckanShow = await fetch(`${ckanBase}/api/3/action/package_show?id=${encodeURIComponent(bukuSlug)}`);
    const ckanJson = await ckanShow.json();
    const extras = (ckanJson?.result?.extras || []).reduce((acc, cur) => { acc[cur.key] = cur.value; return acc; }, {});

    report.bukuDigital = {
      slug: bukuSlug,
      title: bukuTitle,
      ckanStatus: extras.status || null,
      ckanPrivate: ckanJson?.result?.private,
    };

    if ((extras.status || '').toLowerCase() !== 'published') {
      throw new Error(`Status buku digital di CKAN belum Published (aktual: ${extras.status || 'kosong'})`);
    }

    const bookPublic = await waitPublicContains(`/publikasi-buku-digital?q=${encodeURIComponent(String(ts))}`, bukuTitle, 300000, 6000);
    report.publicChecks.bukuDigitalCatalog = bookPublic;
    if (!bookPublic.ok) {
      throw new Error(`Buku digital belum tampil di publikasi publik. status=${bookPublic.status} err=${bookPublic.error || ''}`);
    }
    step('Buku digital sudah tampil di publikasi publik');

    console.log(JSON.stringify({ success: true, report }, null, 2));
  } finally {
    stopDevServer(child);
  }
}

main().catch((err) => {
  console.error('E2E_FLOW_FAILED');
  console.error(err?.stack || String(err));
  process.exit(1);
});
