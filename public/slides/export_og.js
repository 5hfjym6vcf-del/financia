// Génère l'image de partage (Open Graph / Twitter Card) au format attendu
// par LinkedIn, X et Facebook : 1200x630, ratio 1.91:1.
//
// L'ancienne image était le logo carré en 2000x2000 sur fond transparent :
// rogné ou encadré selon le réseau, et le fond transparent tombait en blanc
// ou en noir de façon imprévisible.
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await p.goto(`file://${resolve(__dirname, 'og-source.html')}`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 300));
await p.screenshot({
  path: resolve(__dirname, '../images/og-financia.png'),
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await b.close();
console.log('og-financia.png généré');
