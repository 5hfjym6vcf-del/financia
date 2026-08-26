// Story Instagram « Résultats Nvidia » — 6 slides.
// Reprend la charte de la série story_actu8 / story_bitcoin71k :
// Montserrat, fond noir avec dégradé radial, accent violet.
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'png');
mkdirSync(outDir, { recursive: true });

const SLIDES = [
  {
    name: 'slide1',
    body: `<div class="hook">Le résultat le plus attendu de la semaine <span class="accent">tombe ce soir</span> 👀</div>`,
  },
  {
    name: 'slide2',
    body: `
      <div class="bignum">+17 %</div>
      <div class="bignum-sub">sur un an</div>
      <p class="body-text" style="margin-top:74px">Nvidia publie ses <strong>résultats trimestriels</strong> ce soir.</p>`,
  },
  {
    name: 'slide3',
    body: `<p class="body-text">Le marché est à l'affût : un bon chiffre peut faire <strong>s'envoler</strong> l'action, un chiffre décevant peut la faire <strong>chuter fort</strong>.</p>`,
  },
  {
    name: 'slide4',
    body: `
      <div class="watermark">NVDA<br>NVDA<br>NVDA</div>
      <div class="content-wrap">
        <p class="body-text">Nvidia <strong>pèse énormément</strong> sur les indices. Ses résultats peuvent influencer tout le marché tech, pas seulement son propre titre.</p>
      </div>`,
  },
  {
    // Renvoi vers les classements du site. Nvidia y est effectivement en tête
    // des capitalisations : la promesse est vérifiable, pas décorative.
    name: 'slide5',
    body: `
      <div class="rank-badge">N°1 mondial</div>
      <p class="body-text" style="margin-top:40px">Nvidia est la <strong>plus grosse capitalisation</strong> du classement Financia.</p>
      <p class="body-text" style="font-size:38px;margin-top:44px">Va voir comment elle bouge après les résultats, dans la rubrique <strong>Palmarès</strong>.</p>
      <div class="cta-pill">🔗 financia.cloud</div>`,
  },
  {
    name: 'slide6',
    body: `
      <p class="title">Abonne-toi à @financia_cloud pour suivre comment ça tourne 📈</p>
      <div class="footer5">
        <div class="footer5-brand">
          <div class="footer5-logo">FINANCIA</div>
          <div class="footer5-link">🔗 Lien en bio</div>
        </div>
      </div>`,
  },
];

// La coquille est chargée une seule fois : recharger la feuille Google Fonts
// à chaque diapositive faisait expirer Puppeteer.
const shell = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:radial-gradient(circle at 50% 0%, #121014 0%, #000000 65%);
       font-family:'Montserrat',sans-serif;position:relative;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       padding:200px 100px 160px}

  .num{position:absolute;top:64px;right:70px;font-size:22px;font-weight:600;color:rgba(255,255,255,.28);z-index:2}

  .hook{font-size:80px;font-weight:900;color:#fff;text-align:center;line-height:1.18;
        letter-spacing:-2px;max-width:880px}
  .hook .accent{color:#7C3AED}

  .body-text{font-size:44px;font-weight:600;color:rgba(255,255,255,.88);text-align:center;
             line-height:1.5;max-width:840px}
  .body-text strong{color:#c4b5fd;font-weight:800}

  .bignum{font-size:220px;font-weight:900;color:#7C3AED;line-height:1;letter-spacing:-8px}
  .bignum-sub{font-size:38px;font-weight:600;color:rgba(255,255,255,.55);margin-top:14px}

  .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-8deg);
             font-size:128px;font-weight:900;color:rgba(255,255,255,.05);text-align:center;
             line-height:1.05;white-space:nowrap;z-index:0;user-select:none}
  .content-wrap{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}

  .title{font-size:48px;font-weight:800;color:#fff;text-align:center;letter-spacing:-1px;
         line-height:1.4;max-width:780px}
  .rank-badge{display:inline-flex;align-items:center;background:rgba(124,58,237,.16);
              border:2px solid #7C3AED;border-radius:999px;padding:16px 40px;
              font-size:34px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase}
  .cta-pill{margin-top:56px;background:#7C3AED;border-radius:99px;padding:26px 54px;
            font-size:36px;font-weight:800;color:#fff;box-shadow:0 20px 60px rgba(124,58,237,.42)}

  .footer5{position:absolute;bottom:50px;left:0;right:0;display:flex;flex-direction:column;
           align-items:center;gap:14px}
  .footer5-brand{display:flex;align-items:center;gap:16px}
  .footer5-logo{font-size:24px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:2px}
  .footer5-link{font-size:19px;font-weight:600;color:#c4b5fd}
</style></head><body></body></html>`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.setContent(shell, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

for (let i = 0; i < SLIDES.length; i++) {
  const s = SLIDES[i];
  await page.evaluate(html => { document.body.innerHTML = html; },
    `<div class="num">${i + 1}/6</div>${s.body}`);
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({
    path: `${outDir}/story_nvidia_${s.name}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ story_nvidia_${s.name}.png`);
}

await browser.close();
console.log('Terminé — 6 slides dans public/slides/png/');
