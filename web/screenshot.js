const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const baseUrl = 'http://localhost:3000';
  const outDir = 'C:/Projects/satudatabulungan/docs/images';

  const takeScreenshot = async (path, filename) => {
    console.log(`Navigating to ${path}...`);
    try {
        await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000); 
        await page.screenshot({ path: `${outDir}/${filename}`, fullPage: false });
        console.log(`Saved ${filename}`);
    } catch(err) {
        console.error(`Failed to capture ${path}`, err);
    }
  };

  await takeScreenshot('/tentang/profil-sdi', 'tentang.png');

  await browser.close();
})();
