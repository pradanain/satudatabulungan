import { chromium } from '@playwright/test';
import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const baseUrl = process.env.CKAN_BASE_URL || "http://localhost:5000";
const scriptDir = dirname(fileURLToPath(import.meta.url));

function resolveApiKey() {
  const fromEnv = process.env.CKAN_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const helper = resolve(scriptDir, "../scripts/ensure-ckan-token.mjs");
  const container = process.env.CKAN_CONTAINER_NAME?.trim() || "portal_ckan";
  try {
    const token = execFileSync(process.execPath, [helper, "--format", "token", "--container", container], { encoding: "utf8" }).trim();
    if (token) return token;
  } catch (e) {}
  return "default-key";
}
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJxSHF2elJVNnQ4dEh6dkNxcXY5TDJCWG81SzRPbEZFWm81M1hjZ182N3RNIiwiaWF0IjoxNzc4NTcyMTc3fQ.2MZHhzIBt_KiJTCmKF2XJUJGY811OG5QPvvmJvizwpM';

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

async function scrapeInfografis() {
  console.log("=========================================================================");
  console.log("Membuka browser... MOHON SELESAIKAN CAPTCHA CLOUDFLARE JIKA MUNCUL!");
  console.log("=========================================================================");
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  
  let allItems = [];
  
  for (let i = 1; i <= 4; i++) {
    const url = `https://diskominfo.bulungan.go.id/wp/infografis/page/${i}/`;
    console.log(`\nNavigasi ke ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`Menunggu halaman termuat (Selesaikan Captcha jika perlu)...`);
      
      // Wait for items to appear, this handles waiting for Cloudflare to be solved manually
      await page.waitForSelector('.rt-grid-item', { timeout: 120000 });
      
      // Give it extra time for the page to stabilize in case of redirects
      await page.waitForTimeout(5000);
      
      // Ensure we're on the right page and not in a transitional state
      await page.waitForSelector('.rt-grid-item', { timeout: 10000 });
    } catch (e) {
      console.log('Error navigasi atau timeout menunggu elemen:', e.message);
      continue;
    }
    
    try {
      // Evaluate in page
      const items = await page.evaluate(() => {
        const results = [];
        const blocks = document.querySelectorAll('.rt-grid-item');
        blocks.forEach(block => {
          const titleNode = block.querySelector('.entry-title a');
          const linkNode = block.querySelector('a.tpg-post-link');
          const imageNode = block.querySelector('img');
          const dateNode = block.querySelector('.post-meta-tags .date a');
          
          const title = titleNode ? titleNode.innerText.trim() : (linkNode ? linkNode.innerText.trim() : 'Infografis');
          const postUrl = linkNode ? linkNode.href : '';
          let imageUrl = '';
          if (imageNode) {
              imageUrl = imageNode.getAttribute('data-src') || imageNode.getAttribute('data-lazy-src') || imageNode.getAttribute('src') || '';
          }
          const date = dateNode ? dateNode.innerText.trim() : '';
          
          if (title && imageUrl) {
            results.push({ title, postUrl, imageUrl, date });
          }
        });
        return results;
      });
      
      console.log(`Berhasil mengekstrak ${items.length} infografis dari halaman ${i}`);
      allItems = allItems.concat(items);
    } catch (err) {
       console.log("Error saat mengekstrak halaman:", err.message);
    }
  }
  
  await browser.close();
  return allItems;
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
    const items = await scrapeInfografis(); writeFileSync('infografis.json', JSON.stringify(items, null, 2));
    console.log(`\n================================`);
    console.log(`Total infografis diekstrak: ${items.length}`);
    console.log(`================================`);
    
    if (items.length === 0) {
      console.log("Tidak ada data yang diekstrak. Proses dihentikan.");
      return;
    }

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
    
    console.log("\nProses pengambilan dan seeding selesai!");
  } catch (err) {
    console.error(err);
  }
}

run();
