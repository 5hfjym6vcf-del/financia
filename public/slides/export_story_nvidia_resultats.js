// Story Instagram « Résultats Nvidia — la suite » — 4 slides.
// Fait suite à la story story_nvidia (« le résultat tombe ce soir ») publiée la
// veille : même charte Montserrat / fond noir / accent violet.
//
// Chiffres du T2 de l'exercice 2027, publiés le 26 août 2026 :
//   CA 96,2 Mds $ (+106 % sur un an) contre 92,2 Mds $ attendus par le consensus,
//   BPA GAAP dilué 2,46 $ contre 1,08 $ un an plus tôt, d'où « plus que doublé ».
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
    body: `<div class="hook">Les résultats sont <span class="accent">tombés hier soir</span>… 👀</div>`,
  },
  {
    // Le chiffre attendu est rappelé juste sous le chiffre réalisé : c'est l'écart
    // entre les deux qui fait l'information, pas le montant seul.
    // Le ticker nomme l'entreprise : la slide 1 est un teasing volontaire, mais un
    // « 96 Mds $ » sans sujet ne dit rien à qui n'a pas vu la story de la veille.
    name: 'slide2',
    body: `
      <div class="ticker">Nvidia · NVDA</div>
      <div class="bignum">96<span class="unit">Mds&nbsp;$</span></div>
      <div class="bignum-sub">de chiffre d'affaires sur le trimestre</div>
      <div class="growth">+106&nbsp;% sur un an</div>
      <div class="compare">Les analystes attendaient <strong>92&nbsp;Mds&nbsp;$</strong></div>`,
  },
  {
    name: 'slide3',
    body: `
      <div class="watermark">NVDA<br>NVDA<br>NVDA</div>
      <div class="content-wrap">
        <p class="body-text">Nvidia a <strong>largement dépassé</strong> les attentes : le <strong>bénéfice net</strong> a plus que doublé sur un an.</p>
      </div>`,
  },
  {
    name: 'slide4',
    body: `
      <p class="title">On te tenait au courant hier,<br>voilà la suite 📈</p>
      <div class="cta-pill">Abonne-toi à @financia_cloud</div>
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

  .ticker{margin-bottom:52px;display:inline-flex;align-items:center;
          background:rgba(124,58,237,.16);border:2px solid #7C3AED;border-radius:999px;
          padding:14px 38px;font-size:32px;font-weight:900;color:#c4b5fd;
          letter-spacing:3px;text-transform:uppercase}

  .bignum{font-size:220px;font-weight:900;color:#7C3AED;line-height:1;letter-spacing:-8px;
          display:flex;align-items:baseline;justify-content:center;gap:18px}
  .bignum .unit{font-size:76px;letter-spacing:-2px}
  .bignum-sub{font-size:38px;font-weight:600;color:rgba(255,255,255,.55);margin-top:20px;text-align:center}

  .growth{margin-top:38px;display:inline-flex;align-items:center;
          background:rgba(34,197,94,.14);border:2px solid rgba(74,222,128,.55);
          border-radius:999px;padding:14px 38px;
          font-size:40px;font-weight:900;color:#4ade80;letter-spacing:-1px}

  /* Séparé du bloc du haut par un trait : c'est la référence de comparaison,
     pas une deuxième donnée du même rang. */
  .compare{margin-top:64px;padding-top:44px;border-top:2px solid rgba(255,255,255,.1);
           font-size:40px;font-weight:600;color:rgba(255,255,255,.62);text-align:center;
           max-width:800px}
  .compare strong{color:#fff;font-weight:800}

  .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-8deg);
             font-size:128px;font-weight:900;color:rgba(255,255,255,.05);text-align:center;
             line-height:1.05;white-space:nowrap;z-index:0;user-select:none}
  .content-wrap{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}

  .title{font-size:56px;font-weight:800;color:#fff;text-align:center;letter-spacing:-1.5px;
         line-height:1.35;max-width:820px}
  .cta-pill{margin-top:64px;background:#7C3AED;border-radius:99px;padding:26px 54px;
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
    `<div class="num">${i + 1}/${SLIDES.length}</div>${s.body}`);
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({
    path: `${outDir}/story_nvidia_res_${s.name}.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  console.log(`✓ story_nvidia_res_${s.name}.png`);
}

await browser.close();
console.log(`Terminé — ${SLIDES.length} slides dans public/slides/png/`);
