// Story Instagram « Financia devient une app » — 6 slides, format pub produit.
// Fond noir uni, accent violet, Montserrat gras, visuel dominant.
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'png');
mkdirSync(outDir, { recursive: true });

const VIOLET = '#7C3AED';

// L'icône de l'app, reconstruite en HTML pour pouvoir la mettre à l'échelle
// et lui appliquer un halo sans dépendre du PNG.
const appIcon = (size, glow) => `
  <div class="app-icon" style="
    width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.23)}px;
    ${glow ? `box-shadow:0 0 ${Math.round(size * 0.55)}px rgba(124,58,237,.65), 0 0 ${Math.round(size * 1.1)}px rgba(124,58,237,.28);` : ''}
    border:1px solid rgba(255,255,255,.09);">
    <span style="font-size:${Math.round(size * 0.54)}px;line-height:1;font-weight:800;color:#fff;letter-spacing:${-size * 0.016}px">F</span>
    <span style="width:${Math.round(size * 0.3)}px;height:${Math.round(size * 0.05)}px;border-radius:99px;background:${VIOLET};margin-top:${Math.round(size * 0.07)}px"></span>
  </div>`;

const SLIDES = [
  {
    name: 'slide1',
    body: `
      ${appIcon(420, true)}
      <h1 class="title" style="margin-top:110px">Financia devient<br>une app 📲</h1>`,
  },
  {
    name: 'slide2',
    body: `
      <div class="prompt">
        <div class="prompt-row">
          <div class="ring">${appIcon(112, false)}</div>
          <div class="prompt-txt">
            <div class="prompt-name">Financia</div>
            <div class="prompt-url">financia.cloud</div>
          </div>
        </div>
        <div class="prompt-actions">
          <span class="btn-ghost">Annuler</span>
          <span class="btn-solid">Installer</span>
        </div>
      </div>
      <div class="pointer">☝️</div>
      <h2 class="title" style="margin-top:40px">Installe-la en un clic</h2>`,
  },
  {
    name: 'slide3',
    body: `
      <div class="duo">
        <div class="wordmark">Financi<span class="accent">a</span></div>
        <div class="duo-sep"></div>
        ${appIcon(200, true)}
      </div>
      <h2 class="title" style="margin-top:110px">Même Financia.<br>Nouveau format.</h2>`,
  },
  {
    name: 'slide4',
    body: `
      <div class="compare">
        <div class="compare-row struck">
          <span class="compare-ico">🌐</span>
          <span class="compare-lbl">Ouvrir le navigateur, taper l'adresse…</span>
        </div>
        <div class="compare-arrow">↓</div>
        <div class="compare-row live">
          ${appIcon(96, false)}
          <span class="compare-lbl strong">Un appui. C'est ouvert.</span>
        </div>
      </div>
      <h2 class="title" style="margin-top:100px">Accès plus rapide,<br>sans passer par le navigateur</h2>`,
  },
  {
    name: 'slide5',
    body: `
      <div class="bignum">27</div>
      <div class="bignum-sub">mises à jour depuis fin juillet</div>
      <h2 class="title" style="margin-top:96px">Le site évolue<br>chaque semaine 🔧</h2>`,
  },
  {
    name: 'slide6',
    body: `
      ${appIcon(240, true)}
      <h2 class="title" style="margin-top:90px">Installe Financia</h2>
      <div class="cta-pill">🔗 financia.cloud</div>
      <div class="cta-hint">lien en story 👇</div>`,
  },
];

// La coquille (police + styles) est chargée une seule fois : recharger la
// feuille Google Fonts à chaque diapositive faisait expirer Puppeteer.
const shell = () => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:#000;font-family:'Montserrat',sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       padding:220px 90px 190px;position:relative}

  .num{position:absolute;top:64px;right:70px;font-size:24px;font-weight:600;color:rgba(255,255,255,.28)}
  .foot{position:absolute;bottom:60px;left:0;right:0;text-align:center;font-size:27px;font-weight:600;color:rgba(255,255,255,.34)}

  .app-icon{background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}

  .title{font-size:64px;font-weight:900;color:#fff;text-align:center;line-height:1.16;letter-spacing:-1.6px;max-width:860px}

  /* Slide 2 — fausse fenêtre d'installation */
  .prompt{width:820px;background:#141419;border:1px solid rgba(255,255,255,.12);border-radius:36px;padding:52px 56px;
          box-shadow:0 40px 120px rgba(0,0,0,.7)}
  .prompt-row{display:flex;align-items:center;gap:34px}
  .ring{padding:14px;border-radius:38px;border:4px solid ${VIOLET};box-shadow:0 0 60px rgba(124,58,237,.55)}
  .prompt-name{font-size:44px;font-weight:800;color:#fff;line-height:1.1}
  .prompt-url{font-size:30px;font-weight:500;color:rgba(255,255,255,.45);margin-top:8px}
  .prompt-actions{display:flex;justify-content:flex-end;align-items:center;gap:22px;margin-top:52px}
  .btn-ghost{font-size:30px;font-weight:600;color:rgba(255,255,255,.5);padding:18px 30px}
  .btn-solid{font-size:30px;font-weight:800;color:#fff;background:${VIOLET};border-radius:99px;padding:20px 46px}
  .pointer{font-size:76px;margin-top:34px}

  /* Slide 3 — les deux logos côte à côte */
  .duo{display:flex;align-items:center;gap:56px}
  .wordmark{font-size:88px;font-weight:900;color:#fff;letter-spacing:-2.5px}
  .wordmark .accent{color:${VIOLET}}
  .duo-sep{width:3px;height:120px;background:rgba(255,255,255,.16)}

  /* Slide 4 — avant / après */
  .compare{display:flex;flex-direction:column;align-items:center;gap:30px;width:100%}
  .compare-row{display:flex;align-items:center;gap:28px;background:#111116;border:1px solid rgba(255,255,255,.1);
               border-radius:28px;padding:34px 40px;width:100%;max-width:840px}
  .compare-row.live{border-color:rgba(124,58,237,.5);background:rgba(124,58,237,.08)}
  .compare-ico{font-size:52px}
  .compare-lbl{font-size:34px;font-weight:600;color:rgba(255,255,255,.6);line-height:1.35}
  .compare-lbl.strong{color:#fff;font-weight:800}
  .struck .compare-lbl{text-decoration:line-through;text-decoration-color:rgba(255,255,255,.35)}
  .compare-arrow{font-size:52px;color:${VIOLET};font-weight:900}

  /* Slide 5 — le chiffre */
  .bignum{font-size:280px;font-weight:900;color:${VIOLET};line-height:1;letter-spacing:-10px}
  .bignum-sub{font-size:38px;font-weight:600;color:rgba(255,255,255,.62);margin-top:18px;text-align:center}

  /* Slide 6 — appel à l'action */
  .cta-pill{margin-top:52px;background:${VIOLET};border-radius:99px;padding:30px 60px;font-size:40px;font-weight:800;color:#fff;
            box-shadow:0 24px 70px rgba(124,58,237,.45)}
  .cta-hint{margin-top:26px;font-size:30px;font-weight:500;color:rgba(255,255,255,.45)}
</style></head><body></body></html>`;

const bodyOf = (body, n) => `
  <div class="num">${n}/6</div>
  ${body}
  <div class="foot">@financia_cloud</div>`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const p = await browser.newPage();
await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

await p.setContent(shell(), { waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);

for (let i = 0; i < SLIDES.length; i++) {
  const s = SLIDES[i];
  await p.evaluate(html => { document.body.innerHTML = html; }, bodyOf(s.body, i + 1));
  await new Promise(r => setTimeout(r, 200));
  await p.screenshot({
    path: `${outDir}/story_pwa_${s.name}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ story_pwa_${s.name}.png`);
}

await browser.close();
console.log('Terminé — 6 slides dans public/slides/png/');
