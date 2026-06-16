import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../public/slides/post1.html');
const outDir  = resolve(__dirname, '../public/slides');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();

// 1080×1080 viewport so each slide fills exactly one screen
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

for (let i = 1; i <= 5; i++) {
  const outPath = `${outDir}/slide${i}.png`;
  await page.evaluate((id) => {
    document.getElementById(id).scrollIntoView({ block: 'start' });
  }, `slide${i}`);

  // Small pause to let scroll settle and fonts render
  await new Promise(r => setTimeout(r, 200));

  const el = await page.$(`#slide${i}`);
  await el.screenshot({ path: outPath, type: 'png' });

  console.log(`✓ slide${i}.png`);
}

await browser.close();
console.log('Done — 5 slides saved to public/slides/');
