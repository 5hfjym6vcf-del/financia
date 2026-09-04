import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir    = resolve(__dirname, 'png');
mkdirSync(outDir, { recursive: true });

const TOTAL = 10;
const noms = Array.from({ length: TOTAL }, (_, i) => `recap_aout_slide${String(i + 1).padStart(2, '0')}`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

for (const nom of noms) {
  await page.goto(`file://${resolve(__dirname, nom + '.html')}`, { waitUntil: 'networkidle0' });
  // Montserrat doit être posée avant la capture : sans cette attente, la
  // première slide part parfois avec la police de repli et les hauteurs de
  // ligne diffèrent du reste de la série.
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({
    path: `${outDir}/${nom}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ ${nom}.png`);
}

// ── Planche-contact ────────────────────────────────────────
// Les dix slides côte à côte, pour juger l'enchaînement plutôt que chaque
// image isolément : c'est la succession qui se regarde en story, pas la slide.
const vignettes = noms.map((n, i) => `
  <figure>
    <img src="file://${outDir}/${n}.png" />
    <figcaption>${i + 1}</figcaption>
  </figure>`).join('');

const planche = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0f;font-family:'Montserrat',sans-serif;padding:34px}
  .grille{display:grid;grid-template-columns:repeat(5,1fr);gap:26px}
  figure{position:relative}
  img{width:100%;display:block;border-radius:10px;border:1px solid rgba(124,58,237,.35)}
  figcaption{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.72);
    color:#fff;font-size:15px;font-weight:800;border-radius:7px;padding:3px 9px}
</style></head><body><div class="grille">${vignettes}</div></body></html>`;

const planchePath = resolve(__dirname, 'planche_recap_aout.html');
writeFileSync(planchePath, planche);

await page.setViewport({ width: 1700, height: 1400, deviceScaleFactor: 1 });
await page.goto(`file://${planchePath}`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 500));
const h = await page.evaluate(() => document.body.scrollHeight);
await page.setViewport({ width: 1700, height: Math.ceil(h), deviceScaleFactor: 1 });
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${outDir}/planche_recap_aout.png`, type: 'png' });
console.log('✓ planche_recap_aout.png');

await browser.close();
console.log(`Terminé — ${TOTAL} slides + la planche dans public/slides/png/`);
