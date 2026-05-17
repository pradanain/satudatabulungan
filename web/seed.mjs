import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const baseUrl = process.env.CKAN_BASE_URL || "http://localhost:5000";
const apiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzb3NvQm9YNGtpUVkwSEx5YmMxNEpidHNJazBTcHFURGNQWUNKSXF3UnI4IiwiaWF0IjoxNzc5MDMxMDIzfQ._xDlNs-2-GlAUa--tliDL8_FqCu6ZYXlYWro8GlciuU";

async function action(name, payload = {}) {
  const tmpFile = join(tmpdir(), `ckan-payload-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(tmpFile, JSON.stringify(payload));
  try {
    const output = execFileSync("curl.exe", [
      "-s", "-X", "POST", `${baseUrl}/api/3/action/${name}`,
      "-H", `Authorization: ${apiKey}`,
      "-H", "Content-Type: application/json",
      "-d", `@${tmpFile}`
    ], { encoding: "utf8" });
    const d = JSON.parse(output);
    if (!d.success) throw new Error(`${name} failed: ${JSON.stringify(d.error)}`);
    return d.result;
  } finally {
    try { unlinkSync(tmpFile); } catch (e) {}
  }
}

async function ensureOrg() {
  try { return await action("organization_show", { id: "dkip-kabupaten-bulungan", include_extras: true }); }
  catch {
    return action("organization_create", {
      name: "dkip-kabupaten-bulungan", 
      title: "DKIP Kabupaten Bulungan",
      description: "DKIP",
    });
  }
}

async function run() {
  try {
    await ensureOrg();
    const data = readFileSync('infografis.json', 'utf8');
    const items = JSON.parse(data);
    
    console.log(`\n================================`);
    console.log(`Mulai seeding ${items.length} infografis...`);
    console.log(`================================`);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, '');
      const slug = `infografis-bulungan-${Math.random().toString(36).slice(2, 6)}-${safeTitle}`.slice(0, 95);
      
      console.log(`Seeding [${i+1}/${items.length}]: ${item.title}`);
      
      const payload = {
        name: slug,
        title: item.title,
        notes: `Infografis resmi mengenai ${item.title} Kabupaten Bulungan.\n\nSumber: ${item.postUrl}`,
        owner_org: "dkip-kabupaten-bulungan",
        private: false,
        tags: [{ name: "infografis" }, { name: "bulungan" }],
        extras: [
          { key: "content_type", value: "infografis" },
          { key: "topik", value: "Umum" },
          { key: "status", value: "Published" },
          { key: "thumbnail_url", value: item.imageUrl },
          { key: "post_url", value: item.postUrl },
          { key: "published_date_text", value: item.date }
        ]
      };
      
      try {
        await action("package_create", payload);
      } catch (e) {
        console.log(`Failed to seed ${item.title}:`, e.message);
      }
    }
    
    console.log("\nProses seeding selesai!");
  } catch (err) {
    console.error(err);
  }
}

run();
