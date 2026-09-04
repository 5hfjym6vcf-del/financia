// ============================================================
// FINANCIA — consentement.js
// Bandeau de consentement aux mesures d'audience.
//
// Le refus par défaut n'est PAS posé ici : il l'est en tête de chaque page,
// dans un script en ligne exécuté avant le chargement de gtag.js. Un module
// différé arriverait trop tard, et des mesures partiraient avant tout choix.
// Ce fichier ne gère que l'affichage du bandeau et la mise à jour du choix.
//
// Deux exigences de la CNIL guident la conception :
//  - refuser doit être aussi simple qu'accepter, donc deux boutons de même
//    poids visuel, et pas de croix qui vaudrait acceptation ;
//  - le choix doit pouvoir être changé, d'où le lien permanent dans le pied
//    de page qui rouvre le bandeau.
//
// Les préférences de langue et les favoris ne sont pas concernés : ils restent
// sur l'appareil, ne sont transmis à personne, et relèvent du fonctionnement
// demandé par l'utilisateur. Ils n'exigent donc pas de consentement.
// ============================================================

(function () {
  const CLE = 'financia.consentement';
  const VERSION = 1;

  // localStorage lève en navigation privée sur certains navigateurs. Un
  // bandeau de consentement ne doit jamais faire tomber la page.
  function lire() {
    try {
      const brut = localStorage.getItem(CLE);
      if (!brut) return null;
      const o = JSON.parse(brut);
      return o && o.v === VERSION ? o : null;
    } catch { return null; }
  }
  function ecrire(choix) {
    try {
      localStorage.setItem(CLE, JSON.stringify({ v: VERSION, choix, le: new Date().toISOString() }));
    } catch {}
  }

  function appliquer(choix) {
    // Consent Mode v2. Les signaux publicitaires suivent le même choix que la
    // mesure d'audience depuis l'ouverture des campagnes Google Ads : sans
    // ad_storage, les conversions ne remontent qu'en mode modélisé, très
    // largement sous-comptées. Le refus, lui, refuse tout.
    if (typeof window.gtag === 'function') {
      const etat = choix === 'accepte' ? 'granted' : 'denied';
      window.gtag('consent', 'update', {
        analytics_storage: etat,
        ad_storage: etat,
        ad_user_data: etat,
        ad_personalization: etat,
      });
    }
  }

  function construire() {
    const t = (c) => (window.FinanciaI18N ? FinanciaI18N.t(c) : '');
    const el = document.createElement('div');
    el.className = 'consent';
    el.id = 'consentBanner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', t('consent.titre') || 'Mesure d’audience');
    el.innerHTML = `
      <div class="consent-inner">
        <div class="consent-txt">
          <strong data-i18n="consent.titre">Mesure d'audience</strong>
          <p data-i18n="consent.texte">Financia utilise Google Analytics et Google Ads pour mesurer son audience et l'efficacité de ses campagnes.</p>
          <a href="/confidentialite" data-i18n="consent.enSavoirPlus">Politique de confidentialité</a>
        </div>
        <div class="consent-actions">
          <button type="button" class="consent-btn consent-refuser" data-consent="refuse" data-i18n="consent.refuser">Refuser</button>
          <button type="button" class="consent-btn consent-accepter" data-consent="accepte" data-i18n="consent.accepter">Accepter</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    if (window.FinanciaI18N) FinanciaI18N.applyTranslations(el);

    el.querySelectorAll('[data-consent]').forEach(b => {
      b.addEventListener('click', () => {
        const choix = b.dataset.consent;
        ecrire(choix);
        appliquer(choix);
        el.remove();
      });
    });
    // L'entrée est désormais une animation CSS jouée à l'insertion. Rien à
    // déclencher ici : un bandeau légalement requis ne doit pas dépendre d'un
    // requestAnimationFrame, qui ne se déclenche pas dans tous les contextes.
  }

  function ouvrir() {
    if (document.getElementById('consentBanner')) return;
    construire();
  }

  const etat = lire();
  if (!etat) ouvrir();

  // Lien permanent du pied de page : c'est ce qui rend le choix révocable,
  // condition sans laquelle un consentement n'est pas valide.
  document.addEventListener('click', (e) => {
    const lien = e.target.closest('[data-consent-rouvrir]');
    if (!lien) return;
    e.preventDefault();
    try { localStorage.removeItem(CLE); } catch {}
    ouvrir();
  });

  window.FinanciaConsentement = { lire, ouvrir };
})();
