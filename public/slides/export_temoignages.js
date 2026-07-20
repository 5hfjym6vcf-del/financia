import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

// Pour un nouveau témoignage : dupliquer temoignage1_slideN.html en
// temoignage{N}_slideN.html, éditer le bloc CONTENT en tête de chaque
// fichier, puis changer uniquement ce numéro avant de relancer le script.
// ID numérique (1, 2, ...) ou suffixe spécial ('_fondateur') selon les fichiers.
const TESTIMONIAL_ID = '_fondateur';
const SLIDE_COUNT = 3;

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir    = resolve(__dirname, 'png');

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

for (let i = 1; i <= SLIDE_COUNT; i++) {
  const name = `temoignage${TESTIMONIAL_ID}_slide${i}`;
  const htmlPath = resolve(__dirname, `${name}.html`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 200));

  const outPath = `${outDir}/${name}.png`;
  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ ${name}.png`);
}

await browser.close();
console.log(`Done — ${SLIDE_COUNT} slides saved to public/slides/png/`);
