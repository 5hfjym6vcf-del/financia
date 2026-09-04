// ============================================================
// FINANCIA — build_recap_aout.js
// Génère les 10 slides du récap d'août 2026.
//
// Un seul gabarit, décliné en variantes de mise en page. Écrire dix fichiers à
// la main garantirait dix divergences de style ; ici la charte est définie une
// fois et chaque slide n'apporte que son contenu et son accent.
//
// Les chiffres sont ceux réellement publiés sur le compte en août, relevés
// dans les stories du mois. Rien n'est estimé ni arrondi.
// ============================================================

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Accents thématiques, pris dans la palette du site pour que les stories et
// les pages parlent la même langue. Le violet reste la base ; l'accent ne
// souligne qu'un élément par slide, sinon plus rien ne ressort.
const A = {
  violet:  '#7C3AED',
  clair:   '#9E75FF',
  marche:  '#22C55E', // résultats et cours
  site:    '#26C6C6', // nouveautés du site
  regle:   '#E9A23B', // réglementaire, flash info
  video:   '#E05C3A', // formats vidéo
  commu:   '#C4B5FD', // communauté
};

const TOTAL = 10;

function slide({ n, accent, badge, corps, variante = 'texte', fin = false }) {
  const pct = (n / TOTAL) * 100;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>recap_aout_slide${String(n).padStart(2, '0')}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;overflow:hidden;background:#000}
  body{font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}

  .slide{
    position:relative;width:1080px;height:1920px;overflow:hidden;
    background:#000;display:flex;flex-direction:column;
    padding:150px 88px 130px;
  }

  /* Fond : un halo coloré par l'accent du jour, plus une trame violette. Le
     dégradé n'est pas décoratif, il donne à chaque slide son identité tout en
     gardant le même noir de base. */
  .slide::before{
    content:'';position:absolute;inset:0;z-index:0;
    background:
      radial-gradient(1100px 900px at 78% -8%, ${accent}26 0%, transparent 62%),
      radial-gradient(900px 800px at 8% 104%, ${A.violet}1f 0%, transparent 60%);
  }
  .slide::after{
    content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
    background-image:
      linear-gradient(${A.violet}0d 1px,transparent 1px),
      linear-gradient(90deg,${A.violet}0d 1px,transparent 1px);
    background-size:90px 90px;
  }
  .slide>*{position:relative;z-index:1}

  /* Barre de progression : reprend le code visuel des stories Instagram, et
     dit d'un coup d'œil où l'on en est dans la série. */
  .prog{position:absolute;top:52px;left:88px;right:88px;height:5px;
    background:rgba(255,255,255,.13);border-radius:99px;z-index:2;overflow:hidden}
  .prog span{display:block;height:100%;width:${pct}%;border-radius:99px;
    background:linear-gradient(90deg,${A.violet},${accent})}

  .tete{position:absolute;top:88px;left:88px;right:88px;
    display:flex;align-items:center;justify-content:space-between;z-index:2}
  .logo{font-size:31px;font-weight:800;letter-spacing:1.6px;color:#fff}
  .logo i{font-style:normal;color:${A.violet}}
  .num{font-size:26px;font-weight:700;color:rgba(255,255,255,.34);letter-spacing:.5px}

  .pied{position:absolute;bottom:62px;left:0;right:0;text-align:center;
    font-size:25px;font-weight:500;color:rgba(255,255,255,.3);z-index:2}

  .badge{display:inline-flex;align-items:center;gap:12px;align-self:flex-start;
    background:${accent}22;border:1.5px solid ${accent}66;border-radius:999px;
    padding:13px 28px;font-size:24px;font-weight:800;letter-spacing:1.8px;
    text-transform:uppercase;color:${accent};margin-bottom:46px}

  h1{font-size:124px;font-weight:900;line-height:1;letter-spacing:-4px;color:#fff}
  /* Filet sous le titre de couverture : donne un point d'appui au regard
     là où une page centrée sans repère paraît flotter. */
  .filet{width:190px;height:7px;border-radius:99px;margin:46px auto 0;
    background:linear-gradient(90deg,${A.violet},${A.clair})}
  h2{font-size:72px;font-weight:900;line-height:1.1;letter-spacing:-2px;color:#fff}
  em{font-style:normal;color:${accent}}
  .lead{font-size:37px;font-weight:500;line-height:1.5;color:rgba(255,255,255,.72);margin-top:34px}
  .note{font-size:26px;font-weight:500;color:rgba(255,255,255,.4);margin-top:30px}

  /* Variante « chiffre » : la statistique occupe l'espace, le texte la sert. */
  .stat{font-size:210px;font-weight:900;line-height:.9;letter-spacing:-8px;
    color:${accent};margin:44px 0 6px}
  .stat-u{font-size:74px;font-weight:800;color:#fff;letter-spacing:-1px}
  .stat-l{font-size:34px;font-weight:600;color:rgba(255,255,255,.62);margin-top:22px}
  .delta{display:inline-block;margin-top:34px;background:${A.marche}1f;
    border:1.5px solid ${A.marche}59;border-radius:18px;padding:16px 30px;
    font-size:44px;font-weight:900;color:${A.marche}}

  /* Variante « cartes » : deux blocs de même poids. */
  .cartes{display:flex;flex-direction:column;gap:26px;margin-top:16px}
  .carte{background:rgba(255,255,255,.045);border:1.5px solid ${accent}3d;
    border-radius:30px;padding:38px 40px}
  .carte-t{font-size:44px;font-weight:800;color:#fff;letter-spacing:-1px}
  .carte-s{font-size:29px;font-weight:500;color:rgba(255,255,255,.62);margin-top:12px;line-height:1.45}
  .carte-i{font-size:46px;line-height:1;margin-bottom:18px;display:block}

  /* Variante « graphique » : barres proportionnelles, valeurs lisibles. */
  .graph{display:flex;align-items:flex-end;gap:26px;height:520px;margin-top:26px}
  .barre{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .barre b{font-size:44px;font-weight:900;color:#fff;margin-bottom:16px}
  .barre span{width:100%;border-radius:20px 20px 8px 8px;
    background:linear-gradient(180deg,${accent},${accent}55)}
  .barre i{font-style:normal;font-size:25px;font-weight:600;
    color:rgba(255,255,255,.5);margin-top:20px;text-align:center;line-height:1.3}

  /* Variante « liste » : trois faits, même rythme. */
  .liste{display:flex;flex-direction:column;gap:30px;margin-top:12px}
  .item{display:flex;gap:26px;align-items:flex-start}
  .item .p{flex-shrink:0;width:66px;height:66px;border-radius:20px;
    background:${accent}20;border:1.5px solid ${accent}59;
    display:flex;align-items:center;justify-content:center;font-size:31px}
  .item .t{font-size:38px;font-weight:800;color:#fff;line-height:1.25}
  .item .s{font-size:27px;font-weight:500;color:rgba(255,255,255,.58);margin-top:8px;line-height:1.4}

  .centre{align-items:center;text-align:center;justify-content:center}
  .centre .badge{align-self:center}
  .haut{justify-content:center}

  .logo-fin{font-size:112px;font-weight:900;letter-spacing:-3px;color:#fff}
  .logo-fin i{font-style:normal;color:${A.violet}}
  .site{margin-top:44px;font-size:44px;font-weight:800;color:${accent}}
</style></head>
<body>
<div class="slide ${fin || variante === 'couverture' ? 'centre' : 'haut'}">
  <div class="prog"><span></span></div>
  <div class="tete">
    <div class="logo">FINANCI<i>A</i></div>
    <div class="num">${n}/${TOTAL}</div>
  </div>
  ${badge ? `<div class="badge">${badge}</div>` : ''}
  ${corps}
  <div class="pied">@financia_cloud</div>
</div>
</body></html>`;
}

// ── Contenu ────────────────────────────────────────────────
// Chaque chiffre provient d'une story réellement publiée en août 2026 ou des
// relevés d'audience fournis. Aucune donnée n'est ajoutée.
const SLIDES = [
  { n: 1, accent: A.violet, variante: 'couverture', corps: `
    <h1>Récap<br><em>Août 2026</em></h1>
    <div class="filet"></div>
    <p class="lead">Le mois en un coup d'œil.</p>
    <p class="note">Marchés · Nouveautés du site · Communauté</p>` },

  { n: 2, accent: A.marche, badge: 'Résultats', corps: `
    <h2>Nvidia publie<br>son <em>2ᵉ trimestre</em></h2>
    <div class="stat">96<span class="stat-u"> Md$</span></div>
    <div class="stat-l">de chiffre d'affaires sur le trimestre</div>
    <div class="delta">+106 % sur un an</div>
    <p class="note">Publié le 27 août. À titre informatif.</p>` },

  { n: 3, accent: A.regle, badge: 'Flash info', corps: `
    <h2>Bercy veut sortir<br>les actions <em>américaines</em><br>du PEA</h2>
    <p class="lead">Le PEA a été créé en 1992 pour orienter l'épargne vers les entreprises européennes. Une mesure est envisagée pour refermer une faille.</p>
    <p class="note">Mesure envisagée, non adoptée. Publié le 22 août.</p>` },

  { n: 4, accent: A.site, badge: 'Nouveau sur le site', corps: `
    <h2>Deux sections<br><em>en plus</em></h2>
    <div class="cartes">
      <div class="carte">
        <span class="carte-i">📊</span>
        <div class="carte-t">Actions par secteur</div>
        <div class="carte-s">Défense, tech, santé, énergie. Un classement par activité, sans sélection.</div>
      </div>
      <div class="carte">
        <span class="carte-i">🎧</span>
        <div class="carte-t">Ressources</div>
        <div class="carte-s">Podcasts, livres et sites de référence pour apprendre en dehors du site.</div>
      </div>
    </div>` },

  { n: 5, accent: A.clair, badge: 'Communauté', corps: `
    <h2>Vous étiez<br><em>de plus en plus</em></h2>
    <div class="graph">
      <div class="barre"><b>30</b><span style="height:36%"></span><i>juin<br>juillet</i></div>
      <div class="barre"><b>46</b><span style="height:55%"></span><i>21<br>août</i></div>
      <div class="barre"><b>77</b><span style="height:93%"></span><i>27<br>août</i></div>
      <div class="barre"><b>83</b><span style="height:100%"></span><i>fin<br>août</i></div>
    </div>
    <p class="note">Utilisateurs actifs mesurés sur le site.</p>` },

  { n: 6, accent: A.video, badge: 'Nouveau format', corps: `
    <h2>Les <em>Itw bonus</em><br>sont lancées</h2>
    <p class="lead">Un format court, en complément des Flash info : on donne la parole à ceux qui apprennent en même temps que vous.</p>
    <p class="note">Ça s'étoffe à la rentrée.</p>` },

  { n: 7, accent: A.regle, badge: "Ce qu'on a suivi", corps: `
    <h2>Le reste<br>du <em>mois</em></h2>
    <div class="liste">
      <div class="item"><div class="p">💸</div><div>
        <div class="t">650 milliards $ envolés</div>
        <div class="s">Elon Musk, en six semaines. 3 août.</div></div></div>
      <div class="item"><div class="p">🤖</div><div>
        <div class="t">500 milliards $ pour l'IA</div>
        <div class="s">BlackRock, Goldman Sachs et Nvidia s'associent. 11 août.</div></div></div>
      <div class="item"><div class="p">🪙</div><div>
        <div class="t">Bitcoin passe 71 000 $</div>
        <div class="s">Après six semaines de stagnation. 21 août.</div></div></div>
    </div>` },

  { n: 8, accent: A.commu, badge: 'Réseaux', corps: `
    <h2>On grandit<br><em>ensemble</em></h2>
    <p class="lead">Instagram et TikTok continuent de progresser, mois après mois. Merci à celles et ceux qui partagent, commentent et posent des questions.</p>
    <p class="note">C'est vous qui faites avancer le projet.</p>` },

  { n: 9, accent: A.violet, badge: 'Septembre', corps: `
    <h2>La rentrée<br><em>arrive</em></h2>
    <div class="liste">
      <div class="item"><div class="p">🎬</div><div>
        <div class="t">Plus d'Itw bonus</div>
        <div class="s">Le format s'installe.</div></div></div>
      <div class="item"><div class="p">👥</div><div>
        <div class="t">Un espace communauté</div>
        <div class="s">En préparation sur le site.</div></div></div>
      <div class="item"><div class="p">📰</div><div>
        <div class="t">L'actu de la rentrée</div>
        <div class="s">Décryptée comme d'habitude.</div></div></div>
    </div>` },

  { n: 10, accent: A.violet, fin: true, corps: `
    <div class="logo-fin">Financi<i>a</i></div>
    <p class="lead">Apprendre la finance sans jargon,<br>et sans conseil personnalisé.</p>
    <div class="site">financia.cloud</div>
    <p class="note">Abonne-toi pour la suite.</p>` },
];

for (const s of SLIDES) {
  const nom = `recap_aout_slide${String(s.n).padStart(2, '0')}.html`;
  writeFileSync(resolve(__dirname, nom), slide(s));
}
console.log(`${SLIDES.length} slides générées`);
