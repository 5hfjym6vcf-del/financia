import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir    = resolve(__dirname, 'png');

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

const fiches = ['pea', 'assurancevie', 'crypto', 'scpi'];

for (const fiche of fiches) {
  for (let i = 1; i <= 2; i++) {
    const htmlPath = resolve(__dirname, `infos_${fiche}_slide${i}.html`);
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 200));

    const outPath = `${outDir}/infos_${fiche}_slide${i}.png`;
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });
    console.log(`✓ infos_${fiche}_slide${i}.png`);
  }
}

await browser.close();
console.log('Done — 8 slides (4 fiches × 2) saved to public/slides/png/');
