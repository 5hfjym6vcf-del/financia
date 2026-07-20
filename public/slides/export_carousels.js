import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CAROUSELS = [
  { folder: 'carousel1_mythe_riche', count: 6 },
  { folder: 'carousel2_epargner_investir', count: 6 },
  { folder: 'carousel3_dates_bourse', count: 7 },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

for (const { folder, count } of CAROUSELS) {
  const carouselDir = resolve(__dirname, folder);
  const outDir = resolve(carouselDir, 'png');
  mkdirSync(outDir, { recursive: true });

  for (let i = 1; i <= count; i++) {
    const htmlPath = resolve(carouselDir, `slide${i}.html`);
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 200));

    const outPath = resolve(outDir, `slide${i}.png`);
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });
    console.log(`✓ ${folder}/slide${i}.png`);
  }
}

await browser.close();
console.log('Done — 3 carrousels exportés dans public/slides/<carousel>/png/');
