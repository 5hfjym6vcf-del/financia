// ============================================================
// FINANCIA — conversion.js
// Déclenchement de l'événement de conversion Google Ads.
//
// POURQUOI CE FICHIER PLUTÔT QU'UNE LIGNE DANS LE <head>
//
// Placé dans le bloc gtag global, gtag('event', 'conversion', …) part à
// CHAQUE page vue, pour chaque visiteur. Google Ads enregistre alors une
// conversion par affichage : taux de conversion à 100 %, Smart Bidding
// aveugle, et enchères payées sur des clics qui ne convertissent pas.
// C'est le contraire de ce qu'on cherche à mesurer.
//
// Une conversion se déclenche sur une ACTION. Ce module écoute les trois
// qui ont un sens sur Financia, et n'envoie l'événement qu'une fois par
// session et par action.
//
// À AJUSTER SELON L'OBJECTIF DE LA CAMPAGNE
// Si la campagne vise l'inscription à la lettre d'information, garder
// 'newsletter' seul. Si elle vise l'ouverture de compte partenaire,
// garder 'partenaire'. Mélanger des actions de valeur très différente
// dans une même conversion brouille l'optimisation.
// ============================================================

(function () {
  const ID = 'AW-18423213452/A2yxCJjYKowcEIzb79BE';

  // Une même action ne doit compter qu'une fois par session : sans cela,
  // trois clics sur un lien partenaire remonteraient comme trois
  // conversions.
  const CLE = 'financia.conversions';
  function dejaEnvoyee(action) {
    try {
      return (JSON.parse(sessionStorage.getItem(CLE) || '[]')).includes(action);
    } catch { return false; }
  }
  function memoriser(action) {
    try {
      const l = JSON.parse(sessionStorage.getItem(CLE) || '[]');
      l.push(action);
      sessionStorage.setItem(CLE, JSON.stringify(l));
    } catch {}
  }

  function convertir(action) {
    if (typeof window.gtag !== 'function') return;
    if (dejaEnvoyee(action)) return;
    memoriser(action);
    window.gtag('event', 'conversion', { send_to: ID, action_source: action });
  }

  // ── 1. Inscription à la lettre d'information ──
  // On écoute la réussite réelle, pas le clic : un envoi qui échoue n'est
  // pas une conversion.
  document.addEventListener('financia:newsletter-ok', () => convertir('newsletter'));

  // ── 2. Clic sur un lien partenaire ──
  // C'est la conversion qui a une valeur monétaire directe.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[rel~="sponsored"]');
    if (a) convertir('partenaire');
  });

  // ── 3. Quiz terminé ──
  // Signal d'engagement : le visiteur est allé au bout d'un parcours.
  document.addEventListener('financia:quiz-termine', () => convertir('quiz'));

  // Exposé pour les cas non couverts ci-dessus.
  window.FinanciaConversion = { convertir };
})();
