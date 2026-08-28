// ============================================================
// FINANCIA — hero-courbe.js
// Branche la carte du hero sur de vraies données de marché.
//
// La carte existait déjà, mais tout y était inventé : courbe aux coordonnées
// écrites à la main, valeur de 6 917 €, badge de +13,5 %, répartition 70/20/10.
// Elle affiche désormais l'ETF MSCI World, tiré de /api/marches comme le reste
// du site — pas de nouvelle source, pas d'appel supplémentaire, le serveur
// gardant déjà ces données cinq minutes en cache.
//
// Sur la nature des données : ce sont 31 clôtures quotidiennes sur un mois,
// différées. Le point à l'extrémité pulse pour signaler que la carte est
// connectée à une source, jamais pour laisser croire à un flux à la seconde —
// d'où la mention « 30 jours · différé » sous la courbe plutôt qu'un « live ».
// ============================================================

(function () {
  const carte = document.getElementById('heroMarche');
  if (!carte) return;

  const ACTIF = 'msciWorld';
  const L = 280, H = 80;      // repère du SVG, inchangé
  const MARGE_H = 10;         // pour que le tracé ne colle pas aux bords

  const trait = document.getElementById('heroChartPath');
  const remplissage = document.getElementById('heroCourbeFill');
  const point = document.getElementById('heroCourbePoint');
  const prixEl = document.getElementById('heroMarchePrix');
  const varEl = document.getElementById('heroMarcheVar');
  const nomEl = document.getElementById('heroMarcheNom');

  const moinsDeMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chemins(history) {
    const valeurs = history.map(p => p.value);
    const min = Math.min(...valeurs);
    const max = Math.max(...valeurs);
    // Une série parfaitement plate diviserait par zéro : on la centre.
    const amplitude = max - min || 1;

    const pts = valeurs.map((v, i) => {
      const x = (i / (valeurs.length - 1 || 1)) * L;
      const y = MARGE_H + (1 - (v - min) / amplitude) * (H - MARGE_H * 2);
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    });

    const ligne = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x},${y}`).join(' ');
    const aire = `${ligne} L ${L},${H} L 0,${H} Z`;
    return { ligne, aire, dernier: pts[pts.length - 1] };
  }

  function dessiner(ligne) {
    trait.setAttribute('d', ligne);
    if (moinsDeMouvement) return;

    // Tracé de gauche à droite : le trait est d'abord entièrement « en pointillé
    // hors champ », puis ramené à zéro. getTotalLength donne la longueur exacte,
    // sans quoi le tracé finirait trop tôt ou trop tard selon la forme.
    const longueur = trait.getTotalLength();
    trait.style.transition = 'none';
    trait.style.strokeDasharray = `${longueur}`;
    trait.style.strokeDashoffset = `${longueur}`;
    // Forcer un calcul de style entre les deux, sinon le navigateur regroupe
    // les deux écritures et aucune transition ne se produit.
    void trait.getBoundingClientRect();
    trait.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
    trait.style.strokeDashoffset = '0';
  }

  let prixAffiche = null;
  function majPrix(valeur, devise) {
    let texte;
    try {
      texte = new Intl.NumberFormat(FinanciaI18N.getLang() === 'en' ? 'en-US' : 'fr-FR', {
        style: 'currency', currency: devise, maximumFractionDigits: valeur >= 1000 ? 0 : 2,
      }).format(valeur);
    } catch { texte = `${valeur.toFixed(2)} ${devise}`; }

    if (texte === prixAffiche) return;
    // Fondu plutôt qu'un remplacement sec : la valeur ne doit pas sauter sous
    // les yeux du visiteur quand la donnée est rafraîchie.
    if (prixAffiche === null || moinsDeMouvement) {
      prixEl.textContent = texte;
    } else {
      prixEl.classList.add('pc-value-change');
      setTimeout(() => {
        prixEl.textContent = texte;
        prixEl.classList.remove('pc-value-change');
      }, 180);
    }
    prixAffiche = texte;
  }

  // Le séparateur décimal suit la langue : « 1,24 % » en français, « 1.24 % »
  // en anglais. Le reste du site emploie encore toFixed, qui impose le point ;
  // la vitrine, elle, ne peut pas se permettre cet anglicisme.
  function pourcentage(v) {
    const lang = FinanciaI18N.getLang();
    const loc = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'fr-FR';
    try {
      return new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always' }).format(v) + ' %';
    } catch { return `${v >= 0 ? '+' : ''}${v.toFixed(2)} %`; }
  }

  function appliquer(actif) {
    if (!actif || !Array.isArray(actif.history) || actif.history.length < 2) return;

    const { ligne, aire, dernier } = chemins(actif.history);
    remplissage.setAttribute('d', aire);
    dessiner(ligne);

    point.setAttribute('cx', dernier[0]);
    point.setAttribute('cy', dernier[1]);
    point.classList.add('est-actif');

    majPrix(actif.price, actif.currency);

    const hausse = actif.changePct >= 0;
    varEl.textContent = pourcentage(actif.changePct);
    varEl.classList.toggle('positive', hausse);
    varEl.classList.toggle('negative', !hausse);

    if (nomEl) nomEl.textContent = FinanciaI18N.t(`marches.assets.${ACTIF}.name`);
    carte.classList.add('est-reel');
  }

  async function charger() {
    try {
      const r = await fetch('/api/marches');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      appliquer(d?.assets?.[ACTIF]);
    } catch (e) {
      // La carte garde alors sa courbe de repli, sans prix ni badge : le hero
      // n'est jamais vide, et rien de faux n'est affiché.
      console.error('[hero] Données de marché indisponibles :', e.message);
    }
  }

  charger();
  // Même rythme que la page Marchés : le cache serveur dure cinq minutes, aller
  // plus vite ne rapporterait aucune donnée nouvelle.
  setInterval(charger, 5 * 60 * 1000);
  FinanciaI18N.onLangChange(() => {
    prixAffiche = null;
    charger();
  });
})();
