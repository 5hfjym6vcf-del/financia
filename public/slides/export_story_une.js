import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath  = resolve(__dirname, 'story_une.html');
const outDir    = resolve(__dirname, 'png');

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

await page.evaluate(() => {
  document.body.style.cssText = 'margin:0;padding:0;background:#0A0A0A;display:block;';
  const story = document.getElementById('story');
  story.style.position = 'absolute';
  story.style.top = '0';
  story.style.left = '0';
});

await new Promise(r => setTimeout(r, 200));

const outPath = `${outDir}/story_une.png`;
await page.screenshot({
  path: outPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1080, height: 1920 },
});

console.log('✓ story_une.png');

await browser.close();
console.log('Done — story saved to public/slides/png/story_une.png');
