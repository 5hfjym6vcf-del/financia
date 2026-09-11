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
// deviceScaleFactor 2 : les PNG sortent en 2160x2700, soit le double de la
// taille Instagram. La plateforme recompresse toujours ce qu'on lui envoie,
// et partir du double évite que le texte fin des slides 3 et 4 bave.
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });

for (let i = 1; i <= 6; i++) {
  const htmlPath = resolve(__dirname, `story_bce_slide${i}.html`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  // Montserrat vient de Google Fonts : sans cette attente, une slide peut
  // être capturée avec la police de repli et rompre la charte.
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 250));

  // Contrôle de débordement AVANT la capture. Un mot trop long qui sort de sa
  // carte, ou une icône plus haute que son cadre, ne se voit pas dans le code
  // et se repère mal sur un PNG de 2160 px qu'on regarde réduit. La machine
  // mesure, on ne relit pas.
  const debords = await page.evaluate(() => {
    const sortis = [];
    const cadre = document.querySelector('.slide').getBoundingClientRect();
    for (const el of document.querySelectorAll('.slide *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      // .halo et .grille debordent volontairement, et .slide les clippe.
      if (el.classList.contains('halo') || el.classList.contains('grille')) continue;
      // hors de la slide
      if (r.right > cadre.right + 1 || r.left < cadre.left - 1 ||
          r.bottom > cadre.bottom + 1 || r.top < cadre.top - 1) {
        sortis.push(`${el.className || el.tagName} sort de la slide`);
        continue;
      }
      // hors de son parent, quand celui-ci a une taille imposée
      const p = el.parentElement;
      // Les spans de texte rapportent une boite legerement plus large que
      // leur parent a cause du letter-spacing sur le dernier glyphe : faux
      // positif systematique, sans effet visible.
      if (el.tagName === 'SPAN' || el.tagName === 'B') continue;
      if (!p || p.classList.contains('slide')) continue;
      const rp = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      const borne = cs.width !== 'auto' && cs.overflow === 'visible';
      if (borne && (r.right > rp.right + 1 || r.bottom > rp.bottom + 1)) {
        sortis.push(`${el.className || el.tagName} déborde de .${p.className}`);
      }
    }
    return sortis;
  });
  if (debords.length) {
    console.log(`  ! slide ${i} : ${[...new Set(debords)].join(' | ')}`);
  }

  const outPath = `${outDir}/story_bce_slide${i}.png`;
  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });

  console.log(`  story_bce_slide${i}.png`);
}

await browser.close();
console.log('6 slides exportées dans public/slides/png/');
