// ============================================================
// FINANCIA — ressources.js
// Page "Ressources" : podcasts, livres et sites de référence.
//
// Ne contient que le socle commun aux pages secondaires (i18n, nav, menu
// mobile, année du pied de page). Le contenu de la page est entièrement
// statique : aucune donnée à charger, donc aucun appel réseau ici.
//
// Autonome, comme histoire.js et marches.js : script.js pilote des composants
// (simulateur, quiz, chat) qui n'existent pas sur cette page.
// ============================================================

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Traduit tout le HTML statique déjà présent, révèle la page (anti-FOUC),
// et branche le sélecteur de langue — doit s'exécuter avant tout le reste.
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
