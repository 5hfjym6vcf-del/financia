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

for (let i = 1; i <= 6; i++) {
  const htmlPath = resolve(__dirname, `story_flash_pea_slide${i}.html`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 250));

  // Garde-fou : le texte est plus dense que sur les stories habituelles, donc
  // on vérifie qu'aucun contenu ne dépasse du cadre 1080x1920.
  const overflow = await page.evaluate(() => {
    const slide = document.querySelector('.slide');
    const r = slide.getBoundingClientRect();
    return [...slide.querySelectorAll('.s-title, .s-sub, .s-text, .s-cta-hook, .s-figures')]
      .filter(el => {
        const e = el.getBoundingClientRect();
        return e.bottom > r.bottom - 100 || e.top < r.top + 180;
      })
      .map(el => el.className);
  });
  if (overflow.length) console.warn(`  /!\\ slide${i} : contenu trop proche des bords -> ${overflow.join(', ')}`);

  await page.screenshot({
    path: `${outDir}/story_flash_pea_slide${i}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ story_flash_pea_slide${i}.png`);
}

await browser.close();
console.log('Done — 6 slides saved to public/slides/png/');
