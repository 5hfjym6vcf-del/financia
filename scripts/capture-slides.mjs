import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath  = resolve(__dirname, '../public/slides/post1.html');
const outDir    = resolve(__dirname, '../public/slides/png');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

for (let i = 1; i <= 5; i++) {
  // Isolate this slide: hide everything else, reset body layout
  await page.evaluate((id) => {
    document.body.style.cssText =
      'margin:0;padding:0;background:#000;display:block;';

    // Hide all .slide divs and .slide-label paragraphs
    document.querySelectorAll('.slide, .slide-label').forEach(el => {
      el.style.display = 'none';
    });

    // Show only the target slide, positioned at origin
    const target = document.getElementById(id);
    target.style.display  = 'block';
    target.style.position = 'absolute';
    target.style.top      = '0';
    target.style.left     = '0';
  }, `slide${i}`);

  // Clip exactly to the 1080×1080 slide — no browser chrome, no body gaps
  await page.screenshot({
    path: `${outDir}/slide${i}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
  });

  console.log(`✓ slide${i}.png`);
}

await browser.close();
console.log(`Done — 5 slides saved to public/slides/png/`);
