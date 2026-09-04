// ============================================================
// FINANCIA — avis.js
// Page "Avis" : les retours laissés par les visiteurs, en lecture seule.
//
// Même source que le bloc de l'accueil : /api/avis, qui lit un Google Sheet
// public alimenté par un formulaire. Aucune écriture depuis le site, donc
// aucune donnée personnelle ne transite par ici.
//
// Autonome, comme ressources.js et marches.js : script.js pilote des
// composants (simulateur, quiz, chat) absents de cette page.
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Traduit le HTML statique, révèle la page (anti-FOUC) et branche le
// sélecteur de langue — doit s'exécuter avant tout le reste.
FinanciaI18N.initLang();

// ── Nav bar : ombre au scroll ──
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Menu mobile (identique au comportement de script.js) ──
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');

function closeMobileMenu() {
  mobileMenu?.classList.remove('open');
  menuBtn?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}
menuBtn?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('open');
  menuBtn.classList.toggle('open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
});
$$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMobileMenu));
window.addEventListener('scroll', closeMobileMenu, { passive: true });

// ── Footer : année ──
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Les avis ──
(function () {
  const grille = $('#avisGrid');
  const compte = $('#avisCompte');
  if (!grille) return;

  // La locale du navigateur ne convient pas : la page peut être lue en
  // espagnol depuis un appareil réglé en français. On suit la langue choisie.
  const locale = () => ({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ru: 'ru-RU', de: 'de-DE' })[FinanciaI18N.getLang?.()] || 'fr-FR';

  function etoiles(n) {
    if (!n) return '';
    // aria-label plutôt que les glyphes : un lecteur d'écran énoncerait
    // sinon « étoile noire, étoile noire… » cinq fois de suite.
    const label = FinanciaI18N.t('avisPage.noteAria').replace('{n}', n);
    return `<span class="avis-stars" role="img" aria-label="${label}">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
  }

  function date(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    try {
      return d.toLocaleDateString(locale(), { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  let dernier = [];

  function afficher(avis) {
    dernier = avis;
    grille.removeAttribute('aria-busy');

    if (!avis.length) {
      compte.hidden = true;
      grille.innerHTML = `
        <div class="avis-empty">
          <div class="avis-empty-emoji"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
          <div class="avis-empty-title">${FinanciaI18N.t('avis.emptyTitle')}</div>
          <div class="avis-empty-sub">${FinanciaI18N.t('avis.emptySub')}</div>
        </div>`;
      return;
    }

    // Singulier et pluriel : « 1 avis publié » et non « 1 avis publiés ».
    const cle = avis.length === 1 ? 'avisPage.compteUn' : 'avisPage.compte';
    compte.textContent = FinanciaI18N.t(cle).replace('{n}', avis.length);
    compte.hidden = false;

    // Le texte vient de /api/avis, qui échappe déjà &, < et > côté serveur.
    grille.innerHTML = avis.map(a => `
      <article class="avis-card">
        <div class="avis-card-top">
          <span class="avis-prenom">${a.prenom}</span>
          ${etoiles(a.note)}
        </div>
        <p class="avis-texte">${a.texte}</p>
        <span class="avis-date">${date(a.created_at)}</span>
      </article>
    `).join('');
  }

  function erreur() {
    grille.removeAttribute('aria-busy');
    compte.hidden = true;
    grille.innerHTML = `<div class="avis-empty"><div class="avis-empty-sub">${FinanciaI18N.t('avis.loadError')}</div></div>`;
  }

  fetch('/api/avis')
    .then(r => r.json())
    .then(d => afficher(Array.isArray(d) ? d : []))
    .catch(erreur);

  // Le compte et les dates sont formatés par la langue : ils doivent être
  // recalculés au changement, pas seulement traduits par applyTranslations.
  FinanciaI18N.onLangChange(() => { if (dernier.length || !grille.querySelector('.avis-squelette')) afficher(dernier); });
})();
