#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = (process.argv[2] || process.env.CKAN_BASE_URL || process.env.NEXT_PUBLIC_CKAN_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const scriptDir = dirname(fileURLToPath(import.meta.url));

function resolveApiKey() {
  const fromEnv = process.env.CKAN_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const helper = resolve(scriptDir, "ensure-ckan-token.mjs");
  const container = process.env.CKAN_CONTAINER_NAME?.trim() || "portal_ckan";
  const token = execFileSync(process.execPath, [helper, "--format", "token", "--container", container], { encoding: "utf8" }).trim();
  if (!token) throw new Error("Gagal mendapatkan CKAN_API_KEY otomatis.");
  return token;
}

const apiKey = resolveApiKey();
const DISTRICTS = [
  "Tanjung Selor",
  "Tanjung Palas",
  "Tanjung Palas Barat",
  "Tanjung Palas Utara",
  "Tanjung Palas Timur",
  "Tanjung Palas Tengah",
  "Sekatak",
  "Peso",
  "Peso Hilir",
  "Bunyu",
];

const ORGS = [
  ["dkip-kabupaten-bulungan", "DKIP Kabupaten Bulungan", "dkip@bulungan.go.id", "https://diskominfo.bulungan.go.id"],
  ["bappeda-litbang-kabupaten-bulungan", "Bappeda Litbang Kabupaten Bulungan", "bappeda@bulungan.go.id", "https://bappeda.bulungan.go.id"],
  ["bps-kabupaten-bulungan", "BPS Kabupaten Bulungan", "bps6502@bps.go.id", "https://bulungankab.bps.go.id"],
  ["dinas-kesehatan-kabupaten-bulungan", "Dinas Kesehatan Kabupaten Bulungan", "dinkes@bulungan.go.id", "https://dinkes.bulungan.go.id"],
  ["dinas-pendidikan-kabupaten-bulungan", "Dinas Pendidikan Kabupaten Bulungan", "disdik@bulungan.go.id", "https://disdik.bulungan.go.id"],
  ["dinas-kependudukan-dan-pencatatan-sipil-bulungan", "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Bulungan", "dukcapil@bulungan.go.id", "https://dukcapil.bulungan.go.id"],
  ["dinas-pekerjaan-umum-dan-penataan-ruang-bulungan", "Dinas PUPR Kabupaten Bulungan", "pupr@bulungan.go.id", "https://pupr.bulungan.go.id"],
  ["dinas-pertanian-kabupaten-bulungan", "Dinas Pertanian Kabupaten Bulungan", "pertanian@bulungan.go.id", "https://pertanian.bulungan.go.id"],
  ["dinas-perhubungan-kabupaten-bulungan", "Dinas Perhubungan Kabupaten Bulungan", "dishub@bulungan.go.id", "https://dishub.bulungan.go.id"],
  ["dinas-sosial-kabupaten-bulungan", "Dinas Sosial Kabupaten Bulungan", "dinsos@bulungan.go.id", "https://dinsos.bulungan.go.id"],
  ["dinas-koperasi-dan-ukm-kabupaten-bulungan", "Dinas Koperasi dan UKM Kabupaten Bulungan", "diskopukm@bulungan.go.id", "https://diskopukm.bulungan.go.id"],
];

const ACCOUNTS = [
  ["admin-bulungan", "Admin Portal", "admin@bulungan.go.id", "AdminBulungan#2026", "admin", "dkip-kabupaten-bulungan"],
  ["walidata-dkip", "Walidata DKIP", "walidata.dkip@bulungan.go.id", "WalidataDKIP#2026", "walidata", "dkip-kabupaten-bulungan"],
  ["walidata-bappeda", "Walidata Bappeda", "walidata.bappeda@bulungan.go.id", "WalidataBappeda#2026", "walidata", "bappeda-litbang-kabupaten-bulungan"],
  ["operator-kesehatan", "Operator Dinkes", "operator.kesehatan@bulungan.go.id", "OperatorDinkes#2026", "operator_opd", "dinas-kesehatan-kabupaten-bulungan"],
  ["operator-pendidikan", "Operator Disdik", "operator.pendidikan@bulungan.go.id", "OperatorDisdik#2026", "operator_opd", "dinas-pendidikan-kabupaten-bulungan"],
  ["operator-dukcapil", "Operator Dukcapil", "operator.dukcapil@bulungan.go.id", "OperatorDukcapil#2026", "operator_opd", "dinas-kependudukan-dan-pencatatan-sipil-bulungan"],
];

const PERMISSIONS = {
  admin: ["manage_all_organizations", "manage_all_datasets", "manage_all_accounts", "validate_dataset", "curate_dataset", "publish_dataset", "upload_dataset", "upload_infografis", "upload_buku"],
  walidata: ["validate_dataset", "curate_dataset", "publish_dataset", "upload_dataset", "upload_infografis", "upload_buku"],
  operator_opd: ["manage_own_dataset", "upload_dataset", "upload_infografis", "upload_buku"],
};

function csv(columns, rows) {
  const esc = (v) => {
    const t = `${v ?? ""}`;
    if (t.includes(",") || t.includes("\n") || t.includes('"')) return `"${t.replace(/"/g, '""')}"`;
    return t;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n");
}

const pop = {
  "Tanjung Selor": [58240, 59120, 60035], "Tanjung Palas": [18550, 18890, 19110], "Tanjung Palas Barat": [13480, 13620, 13785],
  "Tanjung Palas Utara": [12840, 12970, 13120], "Tanjung Palas Timur": [14960, 15120, 15290], "Tanjung Palas Tengah": [11740, 11860, 11995],
  Sekatak: [24220, 24610, 25040], Peso: [10680, 10810, 10970], "Peso Hilir": [8940, 9030, 9175], Bunyu: [12510, 12680, 12830],
};

const DATASETS = [
  {
    name: "jumlah-penduduk-per-kecamatan-bulungan-2023-2025", owner: "dinas-kependudukan-dan-pencatatan-sipil-bulungan", topic: "Kependudukan", year: "2025", period: "2023-2025", tags: ["kependudukan", "kecamatan", "bulungan"],
    title: "Jumlah Penduduk per Kecamatan Kabupaten Bulungan 2023-2025",
    notes: "Data penduduk per kecamatan hasil konsolidasi Dukcapil.",
    rows: DISTRICTS.map((k) => ({ kecamatan: k, tahun_2023: pop[k][0], tahun_2024: pop[k][1], tahun_2025: pop[k][2] })),
  },
  {
    name: "jumlah-sekolah-per-kecamatan-bulungan-2025", owner: "dinas-pendidikan-kabupaten-bulungan", topic: "Pendidikan", year: "2025", period: "2025", tags: ["pendidikan", "kecamatan", "sekolah"],
    title: "Jumlah Sekolah per Kecamatan Kabupaten Bulungan 2025", notes: "Jumlah SD, SMP, SMA/SMK per kecamatan.",
    rows: [
      ["Tanjung Selor",27,12,8],["Tanjung Palas",15,7,3],["Tanjung Palas Barat",11,5,2],["Tanjung Palas Utara",10,4,2],["Tanjung Palas Timur",12,5,2],
      ["Tanjung Palas Tengah",9,4,1],["Sekatak",20,8,3],["Peso",8,3,1],["Peso Hilir",7,3,1],["Bunyu",11,4,2],
    ].map(([k,sd,smp,sma])=>({kecamatan:k,sd,smp,sma_smk:sma,total:sd+smp+sma})),
  },
  {
    name: "fasilitas-kesehatan-per-kecamatan-bulungan-2025", owner: "dinas-kesehatan-kabupaten-bulungan", topic: "Kesehatan", year: "2025", period: "2025", tags: ["kesehatan", "kecamatan", "faskes"],
    title: "Fasilitas Kesehatan per Kecamatan Kabupaten Bulungan 2025", notes: "Puskesmas, pustu, klinik, praktik dokter.",
    rows: [
      ["Tanjung Selor",3,8,9,15],["Tanjung Palas",2,5,2,4],["Tanjung Palas Barat",1,3,1,2],["Tanjung Palas Utara",1,3,1,2],["Tanjung Palas Timur",1,4,1,2],
      ["Tanjung Palas Tengah",1,3,1,1],["Sekatak",2,6,1,2],["Peso",1,2,1,1],["Peso Hilir",1,2,1,1],["Bunyu",1,3,2,3],
    ].map(([k,pk,ps,kl,dok])=>({kecamatan:k,puskesmas:pk,pustu:ps,klinik:kl,praktik_dokter:dok,total:pk+ps+kl+dok})),
  },
  {
    name: "rumah-tangga-miskin-per-kecamatan-bulungan-2022-2025", owner: "dinas-sosial-kabupaten-bulungan", topic: "Sosial", year: "2025", period: "2022-2025", tags: ["kemiskinan", "kecamatan", "sosial"],
    title: "Rumah Tangga Miskin per Kecamatan Kabupaten Bulungan 2022-2025", notes: "RT miskin terverifikasi DTKS.",
    rows: [
      ["Tanjung Selor",1825,1760,1690,1625,6.8],["Tanjung Palas",910,884,852,821,8.4],["Tanjung Palas Barat",688,670,649,629,9.1],["Tanjung Palas Utara",655,640,621,604,8.9],["Tanjung Palas Timur",742,723,701,683,8.7],
      ["Tanjung Palas Tengah",581,565,548,532,8.6],["Sekatak",1284,1233,1188,1140,10.1],["Peso",496,482,468,451,9.7],["Peso Hilir",412,401,388,374,9.3],["Bunyu",521,507,491,477,7.6],
    ].map(([k,a,b,c,d,p])=>({kecamatan:k,rt_miskin_2022:a,rt_miskin_2023:b,rt_miskin_2024:c,rt_miskin_2025:d,persen_2025:p})),
  },
  {
    name: "kondisi-jalan-kabupaten-per-kecamatan-2025", owner: "dinas-pekerjaan-umum-dan-penataan-ruang-bulungan", topic: "Infrastruktur", year: "2025", period: "2025", tags: ["jalan", "infrastruktur", "kecamatan"],
    title: "Kondisi Jalan Kabupaten per Kecamatan 2025", notes: "Panjang jalan mantap, rusak ringan, rusak berat.",
    rows: [["Tanjung Selor",122.4,21.5,7.2],["Tanjung Palas",86.1,19.3,8.4],["Tanjung Palas Barat",64.7,16.4,6.8],["Tanjung Palas Utara",59.8,14.8,5.6],["Tanjung Palas Timur",73.4,15.1,6.1],["Tanjung Palas Tengah",52.6,12.2,5.1],["Sekatak",133.2,37.6,16.4],["Peso",47.5,13.2,5.9],["Peso Hilir",39.6,10.8,4.5],["Bunyu",44.1,9.9,3.7]].map(([k,m,rr,rb])=>({kecamatan:k,mantap_km:m,rusak_ringan_km:rr,rusak_berat_km:rb,total_km:(m+rr+rb).toFixed(1)})),
  },
  {
    name: "produksi-pertanian-per-kecamatan-bulungan-2024-2025", owner: "dinas-pertanian-kabupaten-bulungan", topic: "Pertanian", year: "2025", period: "2024-2025", tags: ["pertanian", "kecamatan", "produksi"],
    title: "Produksi Pertanian per Kecamatan Kabupaten Bulungan 2024-2025", notes: "Produksi padi, jagung, hortikultura.",
    rows: [["Tanjung Selor",6120,6280,1490,880],["Tanjung Palas",5230,5365,1285,745],["Tanjung Palas Barat",4320,4440,1010,620],["Tanjung Palas Utara",4185,4302,980,606],["Tanjung Palas Timur",4460,4580,1095,642],["Tanjung Palas Tengah",3675,3778,855,540],["Sekatak",7020,7195,1655,940],["Peso",2850,2935,640,410],["Peso Hilir",2410,2488,580,375],["Bunyu",2595,2660,602,388]].map(([k,p24,p25,j,h])=>({kecamatan:k,padi_2024_ton:p24,padi_2025_ton:p25,jagung_2025_ton:j,hortikultura_2025_ton:h})),
  },
  {
    name: "jumlah-umkm-aktif-per-kecamatan-bulungan-2024-2025", owner: "dinas-koperasi-dan-ukm-kabupaten-bulungan", topic: "Ekonomi", year: "2025", period: "2024-2025", tags: ["umkm", "kecamatan", "ekonomi"],
    title: "Jumlah UMKM Aktif per Kecamatan Kabupaten Bulungan 2024-2025", notes: "UMKM aktif terdaftar.",
    rows: [["Tanjung Selor",1890,2015,6.6],["Tanjung Palas",640,689,7.7],["Tanjung Palas Barat",520,553,6.3],["Tanjung Palas Utara",490,520,6.1],["Tanjung Palas Timur",560,596,6.4],["Tanjung Palas Tengah",455,483,6.2],["Sekatak",720,764,6.1],["Peso",328,348,6.1],["Peso Hilir",295,313,6.1],["Bunyu",402,429,6.7]].map(([k,a,b,p])=>({kecamatan:k,umkm_2024:a,umkm_2025:b,pertumbuhan_persen:p})),
  },
  {
    name: "layanan-adminduk-per-kecamatan-bulungan-2025", owner: "dinas-kependudukan-dan-pencatatan-sipil-bulungan", topic: "Pelayanan Publik", year: "2025", period: "2025", tags: ["adminduk", "kecamatan", "layanan"],
    title: "Layanan Administrasi Kependudukan per Kecamatan 2025", notes: "Layanan KTP-el, KK, akta.",
    rows: [["Tanjung Selor",11240,4250,1340,285],["Tanjung Palas",3880,1495,492,121],["Tanjung Palas Barat",2985,1120,376,96],["Tanjung Palas Utara",2860,1088,365,92],["Tanjung Palas Timur",3240,1195,401,101],["Tanjung Palas Tengah",2540,962,321,82],["Sekatak",5015,1924,622,159],["Peso",2145,801,259,63],["Peso Hilir",1885,726,235,57],["Bunyu",2368,901,285,68]].map(([k,a,b,c,d])=>({kecamatan:k,ktp_el:a,kk:b,akta_lahir:c,akta_mati:d,total_layanan:a+b+c+d})),
  },
];

const INFOGRAFIS = [
  "Statistik Penduduk Kabupaten Bulungan 2025",
  "Sebaran Fasilitas Kesehatan per Kecamatan 2025",
  "Jumlah Sekolah per Kecamatan 2025",
  "Pertumbuhan Ekonomi Daerah 2025",
  "Statistik Layanan Publik 2025",
  "Indeks Pembangunan Manusia Bulungan 2025",
  "Data Kemiskinan Daerah 2025",
];

const BOOKS = [
  "Kabupaten Bulungan Dalam Angka 2025",
  "Statistik Sektoral Kabupaten Bulungan 2025",
  "Rencana Pembangunan Daerah Kabupaten Bulungan 2025-2029",
  "Profil Daerah Kabupaten Bulungan 2025",
  "Indikator Makro Kabupaten Bulungan 2025",
  "Laporan Kinerja Pemerintah Daerah Kabupaten Bulungan 2025",
];

async function action(name, payload = {}) {
  const r = await fetch(`${baseUrl}/api/3/action/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: apiKey },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.success !== true) throw new Error(`${name} failed: ${JSON.stringify(d?.error || `${r.status} ${r.statusText}`)}`);
  return d.result;
}

async function multipart(name, formData) {
  const r = await fetch(`${baseUrl}/api/3/action/${name}`, { method: "POST", headers: { Accept: "application/json", Authorization: apiKey }, body: formData });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.success !== true) throw new Error(`${name} failed: ${JSON.stringify(d?.error || `${r.status} ${r.statusText}`)}`);
  return d.result;
}

async function ensureOrg([name, title, email, website]) {
  try { return await action("organization_show", { id: name, include_extras: true, include_users: false, include_groups: false, include_dataset_count: true }); }
  catch {
    return action("organization_create", {
      name, title,
      description: `Organisasi perangkat daerah Kabupaten Bulungan: ${title}.`,
      extras: [
        { key: "email", value: email },
        { key: "website", value: website },
        { key: "address", value: "Tanjung Selor, Kabupaten Bulungan" },
        { key: "phone", value: "(0552) 20000" },
        { key: "source_url", value: website },
      ],
    });
  }
}

async function ensureUser([username, fullName, email, password]) {
  try { return await action("user_show", { id: username }); }
  catch { return action("user_create", { name: username, email, password, fullname: fullName }); }
}

async function addMember(org, username, role) {
  try { await action("organization_member_create", { id: org, username, role }); } catch {}
}

async function ensurePackage(def, contentType = "dataset") {
  let pkg;
  try { pkg = await action("package_show", { id: def.name }); }
  catch {
    pkg = await action("package_create", {
      name: def.name,
      title: def.title,
      notes: def.notes,
      owner_org: def.owner,
      private: false,
      tags: (def.tags || []).map((name) => ({ name })),
      extras: [
        { key: "content_type", value: contentType },
        { key: "topik", value: def.topic || "Umum" },
        { key: "tahun_data", value: def.year || "2025" },
        { key: "periode", value: def.period || "2025" },
        { key: "frekuensi_pembaruan", value: "Tahunan" },
        { key: "status", value: "Published" },
        ...(def.extraEntries || []),
      ],
      resources: [],
    });
  }

  const existing = new Set((pkg.resources || []).map((r) => r.name));
  for (const res of def.resources || []) {
    if (existing.has(res.name)) continue;
    const fd = new FormData();
    fd.set("package_id", pkg.id);
    fd.set("name", res.name);
    fd.set("description", res.description);
    fd.set("format", res.format);
    fd.set("upload", new Blob([res.content], { type: res.format === "JSON" ? "application/json" : res.format === "PDF" ? "application/pdf" : "text/csv" }), res.name);
    await multipart("resource_create", fd);
  }

  return pkg;
}

function buildDatasetResources(def) {
  const first = def.rows[0] || {};
  const columns = Object.keys(first);
  const csvContent = csv(columns, def.rows);
  return [
    { name: `${def.name}.csv`, format: "CSV", description: `${def.title} format CSV.`, content: csvContent },
    { name: `${def.name}.json`, format: "JSON", description: `${def.title} format JSON.`, content: JSON.stringify(def.rows, null, 2) },
  ];
}

try {
  const orgBySlug = new Map();
  for (const org of ORGS) {
    const ensured = await ensureOrg(org);
    orgBySlug.set(org[0], ensured);
  }

  for (const account of ACCOUNTS) {
    await ensureUser(account);
    const role = account[4] === "admin" ? "admin" : account[4] === "walidata" ? "editor" : "member";
    await addMember(account[5], account[0], role);
  }

  const seeded = [];

  for (const base of DATASETS) {
    const def = { ...base, resources: buildDatasetResources(base) };
    const pkg = await ensurePackage(def, "dataset");
    seeded.push(pkg.name);
  }

  for (const [idx, title] of INFOGRAFIS.entries()) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
    const pkg = await ensurePackage(
      {
        name: `infografis-bulungan-${String(idx + 1).padStart(2, "0")}-${slug}`,
        title,
        notes: `Infografis resmi DKIP Bulungan: ${title}.`,
        owner: "dkip-kabupaten-bulungan",
        topic: "Infografis",
        year: "2025",
        period: "2025",
        tags: ["infografis", "dkip", "bulungan"],
        extraEntries: [{ key: "thumbnail_url", value: `https://diskominfo.bulungan.go.id/wp-content/uploads/2025/${String(idx + 1).padStart(2, "0")}/infografis-${idx + 1}.jpg` }],
        resources: [{ name: `${slug}.json`, format: "JSON", description: "Metadata infografis.", content: JSON.stringify({ title, source: "DKIP Kabupaten Bulungan" }, null, 2) }],
      },
      "infografis",
    );
    seeded.push(pkg.name);
  }

  for (const [idx, title] of BOOKS.entries()) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
    const pkg = await ensurePackage(
      {
        name: `publikasi-bulungan-${String(idx + 1).padStart(2, "0")}-${slug}`,
        title,
        notes: `Publikasi resmi Bappeda: ${title}.`,
        owner: "bappeda-litbang-kabupaten-bulungan",
        topic: "Publikasi",
        year: "2025",
        period: "2025",
        tags: ["publikasi", "bappeda", "bulungan"],
        extraEntries: [
          { key: "tahun_terbit", value: "2025" },
          { key: "thumbnail_url", value: "https://bappeda.bulungan.go.id/assets/images/publikasi-thumbnail-default.png" },
        ],
        resources: [{ name: `${slug}.pdf`, format: "PDF", description: "Dokumen publikasi dummy.", content: `${title}\nPublikasi Bappeda Litbang Kabupaten Bulungan\nTahun 2025` }],
      },
      "publikasi",
    );
    seeded.push(pkg.name);
  }

  const accountRows = ACCOUNTS.map(([username, fullName, email, password, role, orgSlug], i) => ({
    id: `acct-${String(i + 1).padStart(3, "0")}`,
    username: email,
    password,
    name: fullName,
    email,
    phone: `0811-5200-${String(i + 1).padStart(3, "0")}`,
    role,
    title: role === "admin" ? "Administrator Portal" : role === "walidata" ? "Walidata Daerah" : "Operator Organisasi",
    organizationId: orgBySlug.get(orgSlug)?.id || "",
    organizationName: orgBySlug.get(orgSlug)?.title || "",
    status: "Aktif",
    permissions: PERMISSIONS[role],
  }));

  const accountPkg = await ensurePackage(
    {
      name: "portal-akun-role-kabupaten-bulungan",
      title: "Portal Akun dan Role Kabupaten Bulungan",
      notes: "Dataset internal akun, role, dan permission untuk dashboard Portal Satu Data.",
      owner: "dkip-kabupaten-bulungan",
      topic: "Internal",
      year: "2026",
      period: "2026",
      tags: ["internal", "akun", "role", "permission"],
      extraEntries: [{ key: "portal_accounts_json", value: JSON.stringify(accountRows) }],
      resources: [{ name: "portal-akun-role-bulungan.json", format: "JSON", description: "Daftar akun-role.", content: JSON.stringify(accountRows, null, 2) }],
    },
    "accounts",
  );
  seeded.push(accountPkg.name);

  const total = await action("package_search", { rows: 1, start: 0 });

  console.log("CKAN sample seed: OK");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Organizations ensured: ${ORGS.length}`);
  console.log(`Accounts ensured: ${ACCOUNTS.length}`);
  console.log(`Packages ensured: ${seeded.length}`);
  console.log(`Dataset count now: ${Number(total?.count ?? 0)}`);
  console.log(`Mandatory district coverage: ${DISTRICTS.join(", ")}`);
} catch (error) {
  console.error("CKAN sample seed: FAILED");
  console.error(`Base URL: ${baseUrl}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

