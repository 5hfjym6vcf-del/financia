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

const htmlPath = resolve(__dirname, 'story_maj_ete.html');
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
// Laisse Inter finir de se charger : sans cette pause, la capture peut partir
// sur la police de repli et casser les hauteurs de ligne.
await page.evaluateHandle('document.fonts.ready');
await new Promise(r => setTimeout(r, 300));

const outPath = `${outDir}/story_maj_ete.png`;
await page.screenshot({
  path: outPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1080, height: 1920 },
});

console.log(`✓ story_maj_ete.png`);

await browser.close();
console.log('Done — 1 story saved to public/slides/png/');
