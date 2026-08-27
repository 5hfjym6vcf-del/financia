// ============================================================
// FINANCIA — analytics.js
// Mesure des sections en ancre de la page d'accueil.
//
// Apprendre, Simulateur, Chat IA, Quiz, Actus, Témoignages et À propos ne sont
// pas des pages mais des ancres : Google Analytics ne les voit donc pas, et
// seules /, /marches, /favoris, /histoire et /contact apparaissent dans les
// rapports. Deux événements comblent ce trou, qui ne répondent pas à la même
// question :
//
//   nav_ancre    — quelqu'un a cliqué pour s'y rendre : c'est l'intention.
//   section_vue  — la section est réellement restée à l'écran : c'est la
//                  consultation. Indispensable ici, l'accueil étant un long
//                  défilement où l'essentiel du trafic n'utilise jamais la nav.
//
// Le nom de la section voyage en paramètre. Rappel : dans GA4 un paramètre
// personnalisé reste invisible tant qu'il n'est pas déclaré en dimension
// personnalisée (Admin → Définitions personnalisées).
// ============================================================

(function () {
  // « installer » s'ajoute aux sept sections demandées : c'est l'entrée du
  // parcours d'installation de l'application, qu'il est utile de mesurer.
  const SECTIONS = [
    'apprendre', 'simulateur', 'chat', 'quiz',
    'actus', 'temoignages', 'apropos', 'installer',
  ];

  // Part de la section — ou de l'écran pour les sections plus hautes que lui —
  // qui doit être visible pour que la vue compte.
  const PART_VISIBLE = 0.5;
  // Un défilement rapide traverse toutes les sections : sans ce délai, la
  // mesure compterait des consultations qui n'ont pas eu lieu.
  const DUREE_MS = 2000;

  function envoyer(nom, section) {
    // gtag manque si le script Google est bloqué par une extension, ou pas
    // encore chargé. La mesure est secondaire : elle ne doit jamais lever.
    if (typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', nom, { section });
    } catch { /* la mesure ne casse jamais la page */ }
  }

  // ── Intention : clic sur un lien pointant vers une de ces sections ──
  // Délégation sur le document : couvre la barre de nav, le menu mobile, le
  // pied de page et les boutons internes, sur les cinq pages du site.
  document.addEventListener('click', e => {
    const lien = e.target.closest('a[href*="#"]');
    if (!lien) return;
    const cible = (lien.getAttribute('href') || '').split('#')[1];
    if (cible && SECTIONS.includes(cible)) envoyer('nav_ancre', cible);
  });

  // ── Consultation : la section reste à l'écran ──
  // Les sections n'existent que sur l'accueil ; ailleurs, rien à observer.
  const cibles = SECTIONS.map(id => document.getElementById(id)).filter(Boolean);
  if (!cibles.length || !('IntersectionObserver' in window)) return;

  const deja = new Set();
  const minuteurs = new Map();

  /**
   * Un simple ratio de visibilité ne suffirait pas : une section plus haute que
   * l'écran n'atteint jamais 50 % d'elle-même à l'image, et ne serait donc
   * jamais comptée. On rapporte la hauteur vue à la plus petite des deux —
   * section ou écran — ce qui traite du même coup les sections courtes.
   *
   * Isolée et exposée parce que c'est la seule règle non triviale du fichier,
   * et que l'observateur qui l'alimente ne peut pas s'exécuter hors d'un
   * navigateur affiché.
   */
  function estAssezVisible(entree, hauteurEcran) {
    if (!entree.isIntersecting) return false;
    const reference = Math.min(entree.boundingClientRect.height, hauteurEcran);
    if (reference <= 0) return false;
    return entree.intersectionRect.height >= reference * PART_VISIBLE;
  }

  window.FinanciaAnalytics = { estAssezVisible };

  const observateur = new IntersectionObserver(entrees => {
    entrees.forEach(entree => {
      const id = entree.target.id;
      if (deja.has(id)) return;

      const assezVisible = estAssezVisible(entree, window.innerHeight);

      if (assezVisible) {
        if (minuteurs.has(id)) return;
        minuteurs.set(id, setTimeout(() => {
          deja.add(id);
          minuteurs.delete(id);
          envoyer('section_vue', id);
          observateur.unobserve(entree.target);
        }, DUREE_MS));
      } else if (minuteurs.has(id)) {
        clearTimeout(minuteurs.get(id));
        minuteurs.delete(id);
      }
    });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });

  cibles.forEach(el => observateur.observe(el));
})();
