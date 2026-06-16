import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath  = resolve(__dirname, 'post2.html');
const outDir    = resolve(__dirname, 'png');

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

for (let i = 1; i <= 5; i++) {
  // Isolate slide: hide everything else, pin slide to top-left
  await page.evaluate((id) => {
    document.body.style.cssText = 'margin:0;padding:0;background:#0A0A0A;display:block;';
    document.querySelectorAll('.slide, .slide-label').forEach(el => {
      el.style.display = 'none';
    });
    const target = document.getElementById(id);
    target.style.display  = 'block';
    target.style.position = 'absolute';
    target.style.top      = '0';
    target.style.left     = '0';
  }, `slide${i}`);

  await new Promise(r => setTimeout(r, 150));

  const outPath = `${outDir}/post2_slide${i}.png`;
  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
  });
  console.log(`✓ post2_slide${i}.png`);
}

await browser.close();
console.log('Done — 5 slides saved to public/slides/png/');
