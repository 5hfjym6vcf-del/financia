// ============================================================
// FINANCIA — page-socle.js
// Socle commun aux pages secondaires : i18n, ombre de la barre au scroll,
// menu mobile, année du pied de page.
//
// Ce code existait à l'identique dans ressources.js et avis.js, recopié
// d'une page à l'autre. Il est extrait ici pour que les nouvelles pages
// d'outils s'y branchent sans le dupliquer une troisième fois.
//
// Les pages qui embarquent déjà script.js (l'accueil, /simulateur) n'en ont
// pas besoin : il fait le même travail, en plus du reste.
// ============================================================

(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Traduit le HTML statique, révèle la page (anti-FOUC), branche le
  // sélecteur de langue. Doit passer avant tout le reste.
  if (window.FinanciaI18N) FinanciaI18N.initLang();

  const navbar = $('#navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  function fermer() {
    mobileMenu?.classList.remove('open');
    menuBtn?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
  menuBtn?.addEventListener('click', () => {
    const ouvert = mobileMenu?.classList.toggle('open');
    menuBtn.classList.toggle('open', ouvert);
    menuBtn.setAttribute('aria-expanded', String(ouvert));
  });
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', fermer));
  window.addEventListener('scroll', fermer, { passive: true });

  const an = $('#year');
  if (an) an.textContent = new Date().getFullYear();
})();
