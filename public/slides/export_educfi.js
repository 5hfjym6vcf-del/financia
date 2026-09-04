import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'png');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

for (let i = 1; i <= 5; i++) {
  await page.goto(`file://${resolve(__dirname, `educfi_slide${i}.html`)}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: `${outDir}/educfi_slide${i}.png`, type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  console.log(`✓ educfi_slide${i}.png`);
}
await browser.close();
