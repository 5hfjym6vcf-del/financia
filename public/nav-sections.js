// ============================================================
// FINANCIA — nav-sections.js
// Navigation séquentielle entre les sections du menu principal.
//
// Remplace les anciennes flèches adossées à window.history, qui dépendaient
// du chemin réellement parcouru par le visiteur : deux personnes sur la même
// page n'avaient pas les mêmes flèches, et le comportement variait selon le
// moteur. Ici la séquence est fixe, donc identique pour tout le monde et
// reproductible, en navigateur comme en application installée.
//
// Particularité de cette séquence : elle mélange des ancres de l'accueil et
// des pages à part entière, et elle ne suit pas l'ordre du document (Quiz est
// plus bas que Simulateur sur l'accueil, alors qu'il le précède au menu).
// Avancer peut donc remonter dans la page ou changer de page : c'est l'ordre
// du menu qui fait foi, pas la mise en page.
// ============================================================

(function () {
  const precedent = document.getElementById('navBack');
  const suivant   = document.getElementById('navForward');
  if (!precedent && !suivant) return;

  const ORDRE = [
    { cle: 'accueil',     ancre: 'apprendre' },
    { cle: 'quiz',        ancre: 'quiz' },
    { cle: 'ressources',  page: '/ressources' },
    { cle: 'simulateur',  ancre: 'simulateur' },
    { cle: 'chat',        ancre: 'chat' },
    { cle: 'marches',     page: '/marches' },
    { cle: 'actus',       ancre: 'actus' },
    { cle: 'temoignages', ancre: 'temoignages' },
    { cle: 'histoire',    page: '/histoire' },
    { cle: 'apropos',     ancre: 'apropos' },
    { cle: 'contact',     page: '/contact' },
  ];

  // Hauteur de la barre fixe : une section n'est considérée atteinte que
  // lorsqu'elle passe sous elle, sinon on la déclarerait courante alors que
  // son titre est encore caché.
  const OFFSET = 140;

  const chemin = () => (location.pathname.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1')) || '/';
  const surAccueil = () => chemin() === '/';

  /**
   * Position dans la séquence. Sur une page dédiée, c'est l'entrée qui lui
   * correspond. Sur l'accueil, c'est la dernière section d'ancre franchie,
   * déterminée par le défilement — et non par l'ordre du document, les deux
   * ne coïncidant pas.
   * Renvoie -1 sur une page hors séquence (Favoris), où les flèches n'ont
   * pas de position à représenter.
   */
  function position() {
    if (!surAccueil()) {
      return ORDRE.findIndex(e => e.page === chemin());
    }

    const presentes = ORDRE
      .map((e, i) => (e.ancre ? { i, el: document.getElementById(e.ancre) } : null))
      .filter(x => x && x.el)
      .sort((a, b) => a.el.offsetTop - b.el.offsetTop);

    if (!presentes.length) return 0;

    const seuil = window.scrollY + OFFSET;
    let courante = null;
    for (const p of presentes) if (p.el.offsetTop <= seuil) courante = p;

    // Au-dessus de toute section listée (héros, hub, palmarès…), on est au
    // début du parcours : la première entrée du menu.
    return courante ? courante.i : 0;
  }

  function aller(i) {
    const cible = ORDRE[i];
    if (!cible) return;

    if (cible.page) { location.href = cible.page; return; }

    if (!surAccueil()) { location.href = '/#' + cible.ancre; return; }

    const el = document.getElementById(cible.ancre);
    if (!el) return;

    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduit ? 'instant' : 'smooth', block: 'start' });

    // replaceState et non location.hash : ce dernier provoquerait un saut sec
    // qui annulerait le défilement doux. Et remplacer plutôt qu'empiler évite
    // que les flèches ne remplissent l'historique, dont on vient justement de
    // se détacher.
    try { history.replaceState(null, '', '#' + cible.ancre); } catch {}

    // Le défilement doux s'étale : sans ce rappel, les flèches garderaient
    // l'état de la section quittée.
    setTimeout(maj, 700);
  }

  function libelle(bouton, cleTexte, i) {
    const entree = ORDRE[i];
    if (!entree) return;
    let texte = FinanciaI18N.t(cleTexte);
    const nom = FinanciaI18N.t('nav.' + entree.cle);
    texte = texte.includes('{s}') ? texte.replace('{s}', nom) : `${texte} : ${nom}`;
    bouton.setAttribute('aria-label', texte);
    bouton.title = texte;
  }

  function maj() {
    const i = position();

    // Page hors séquence : rien à représenter, on masque plutôt que d'afficher
    // deux flèches sans destination.
    if (i < 0) {
      if (precedent) precedent.hidden = true;
      if (suivant) suivant.hidden = true;
      return;
    }

    if (precedent) {
      precedent.hidden = false;
      precedent.disabled = i === 0;
      if (i > 0) libelle(precedent, 'navSections.precedente', i - 1);
      else precedent.setAttribute('aria-label', FinanciaI18N.t('navSections.debut'));
    }
    if (suivant) {
      suivant.hidden = false;
      suivant.disabled = i === ORDRE.length - 1;
      if (i < ORDRE.length - 1) libelle(suivant, 'navSections.suivante', i + 1);
      else suivant.setAttribute('aria-label', FinanciaI18N.t('navSections.fin'));
    }
  }

  precedent?.addEventListener('click', () => { const i = position(); if (i > 0) aller(i - 1); });
  suivant?.addEventListener('click', () => { const i = position(); if (i >= 0 && i < ORDRE.length - 1) aller(i + 1); });

  // Sur l'accueil, la position dépend du défilement : elle doit suivre, sinon
  // les flèches représenteraient la section d'arrivée et non celle qu'on lit.
  let planifie = false;
  function auDefilement() {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(() => { planifie = false; maj(); });
  }

  // Filet de sécurité : l'état affiché dépend du défilement, et un événement
  // manqué laisserait une flèche grisée alors qu'elle a une destination. On
  // recalcule juste avant l'usage, pointerdown précédant le clic, de sorte
  // qu'un bouton réactivé à cet instant réponde quand même au clic qui suit.
  [precedent, suivant].forEach(b => {
    b?.addEventListener('pointerdown', maj);
    b?.addEventListener('focus', maj);
  });

  // Arrivée sur /#ancre depuis une autre page : le navigateur tente de
  // rejoindre le fragment avant que la page ne soit posée, et le contenu qui
  // se charge ensuite (actus, cours, images) décale tout. Le saut est perdu et
  // l'on reste en haut. Le défaut est antérieur à ces flèches et touche déjà
  // les liens du menu, mais la moitié de la séquence en dépend.
  //
  // On rattrape après stabilisation, et seulement si le navigateur n'a
  // manifestement pas sauté : au-delà de 50 px, l'utilisateur a fait défiler
  // lui-même et on ne lui reprend pas la main.
  function rattraperAncre() {
    if (!surAccueil() || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    if (window.scrollY > 50) return;
    if (el.getBoundingClientRect().top < 100) return;
    // 'instant' et non 'auto' : ce dernier hérite du scroll-behavior: smooth
    // posé sur html, et l'on veut ici un saut sec, pas une animation.
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    maj();
  }

  maj();
  if (surAccueil()) {
    window.addEventListener('load', () => { setTimeout(rattraperAncre, 350); });
    window.addEventListener('scroll', auDefilement, { passive: true });
    window.addEventListener('resize', auDefilement, { passive: true });
    // Les sections chargées après coup (actus, widget marchés) décalent les
    // positions : on recalcule une fois la page stabilisée.
    window.addEventListener('load', () => setTimeout(maj, 400));
  }
  window.addEventListener('hashchange', maj);
  FinanciaI18N.onLangChange(maj);
})();
