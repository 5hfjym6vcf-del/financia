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
// Carré : Instagram recadre ensuite la couverture « à la une » en cercle,
// d'où un symbole tenu dans la zone centrale.
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

const noms = ['icone_bonus_etoile', 'icone_bonus_plus', 'icone_bonus_badge'];

for (const nom of noms) {
  await page.goto(`file://${resolve(__dirname, nom + '.html')}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({
    path: `${outDir}/${nom}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
  });
  console.log(`✓ ${nom}.png`);
}

// Aperçu de contrôle : la même icône réduite à 100 px, taille réelle d'affichage
// dans la barre des « à la une ». C'est là que se juge la lisibilité.
for (const nom of noms) {
  await page.setViewport({ width: 100, height: 100, deviceScaleFactor: 1 });
  await page.goto(`file://${resolve(__dirname, nom + '.html')}`, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: '.tuile{width:100px;height:100px}svg{width:100px;height:100px}' });
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({
    path: `${outDir}/${nom}_apercu100.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 100, height: 100 },
  });
  console.log(`✓ ${nom}_apercu100.png`);
}


// Recadrage circulaire : Instagram n'affiche des couvertures « à la une » que
// le disque inscrit. On rend la même icône masquée en cercle, pour vérifier que
// rien d'utile ne tombe hors champ.
for (const nom of noms) {
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`file://${resolve(__dirname, nom + '.html')}`, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: '.tuile{border-radius:50%;overflow:hidden}' });
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({ path: `${outDir}/${nom}_cercle.png`, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 }, omitBackground: true });
  console.log(`✓ ${nom}_cercle.png`);
}

await browser.close();
console.log('Done — 3 icônes + 3 aperçus 100 px dans public/slides/png/');
