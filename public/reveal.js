// ============================================================
// FINANCIA — reveal.js
// Apparition douce des sections quand on arrive dessus.
//
// Reprend le mécanisme déjà éprouvé sur la page Histoire, qui n'en disposait
// pas ailleurs : l'accueil arrivait d'un bloc. Aucune écoute du défilement,
// tout repose sur IntersectionObserver et une transition CSS — le coût à
// l'exécution est nul, y compris sur mobile.
//
// Le hero est volontairement exclu : il est au-dessus de la ligne de flottaison
// et le faire apparaître retarderait le premier contenu visible.
// ============================================================

(function () {
  const cibles = document.querySelectorAll('section.section');
  if (!cibles.length) return;

  const montrer = el => el.classList.add('est-visible');

  // Deux cas où l'animation ne doit pas exister : le visiteur a demandé moins
  // de mouvement, ou son navigateur ne sait pas observer. Dans les deux cas on
  // affiche tout immédiatement — jamais de contenu bloqué en invisible.
  const moinsDeMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (moinsDeMouvement || typeof IntersectionObserver === 'undefined') {
    cibles.forEach(montrer);
    return;
  }

  const observateur = new IntersectionObserver(entrees => {
    entrees.forEach(entree => {
      if (!entree.isIntersecting) return;
      montrer(entree.target);
      // Une section révélée n'a plus rien à dire : on cesse de l'observer
      // plutôt que de garder douze abonnements actifs pendant toute la visite.
      observateur.unobserve(entree.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -60px 0px' });

  cibles.forEach(el => {
    el.classList.add('a-reveler');
    observateur.observe(el);
  });

  // Filet de sécurité. Le pire défaut possible ici serait du contenu resté
  // invisible : masquer d'abord pour révéler ensuite ne vaut que si la
  // révélation arrive à coup sûr. Or il existe des contextes où l'observateur
  // ne rapporte rien — un document que le navigateur considère masqué, par
  // exemple. Passé deux secondes, tout s'affiche, animation ou non.
  setTimeout(() => {
    cibles.forEach(el => {
      if (!el.classList.contains('est-visible')) montrer(el);
    });
    observateur.disconnect();
  }, 2000);
})();
