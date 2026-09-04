// ============================================================
// FINANCIA — nav-plus.js
// Menu déroulant « Plus » de la barre de navigation.
//
// Chargé par toutes les pages : la barre est dupliquée dans chaque fichier
// HTML, mais son comportement ne doit exister qu'à un seul endroit.
//
// Le déroulant remplace cinq liens à plat (Actus, Témoignages, Histoire,
// À propos, Contact) et en accueille deux qui n'étaient jusqu'ici que dans
// le menu mobile : Avis et Mes favoris. La barre passe de douze entrées à
// sept, et rien ne devient inatteignable.
//
// Un menu déroulant qui ne s'ouvre qu'à la souris est inutilisable au
// clavier et au lecteur d'écran. D'où : aria-expanded tenu à jour, Échap
// qui referme en rendant le focus au bouton, flèches pour parcourir les
// entrées, et fermeture au clic extérieur.
// ============================================================

(function () {
  const bouton = document.getElementById('navPlusBtn');
  const menu = document.getElementById('navPlusMenu');
  if (!bouton || !menu) return;

  const entrees = () => [...menu.querySelectorAll('a')];

  function ouvert() {
    return bouton.getAttribute('aria-expanded') === 'true';
  }

  function ouvrir() {
    menu.hidden = false;
    bouton.setAttribute('aria-expanded', 'true');
  }

  function fermer(rendreLeFocus) {
    menu.hidden = true;
    bouton.setAttribute('aria-expanded', 'false');
    if (rendreLeFocus) bouton.focus();
  }

  bouton.addEventListener('click', (e) => {
    e.stopPropagation();
    ouvert() ? fermer(false) : ouvrir();
  });

  // Clic à l'extérieur. On écoute sur le document plutôt que sur un voile :
  // un voile intercepterait le premier clic destiné à la page.
  document.addEventListener('click', (e) => {
    if (!ouvert()) return;
    if (menu.contains(e.target) || bouton.contains(e.target)) return;
    fermer(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ouvert()) {
      e.preventDefault();
      fermer(true);
    }
  });

  // Flèches : depuis le bouton, Bas ouvre et va à la première entrée ;
  // dans le menu, Bas et Haut circulent.
  bouton.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!ouvert()) ouvrir();
      entrees()[0]?.focus();
    }
  });

  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const liste = entrees();
    const i = liste.indexOf(document.activeElement);
    const pas = e.key === 'ArrowDown' ? 1 : -1;
    liste[(i + pas + liste.length) % liste.length]?.focus();
  });

  // Le focus quitte le composant par Tab : on referme, sinon le menu reste
  // ouvert derrière la navigation clavier. Le report est nécessaire, le focus
  // n'ayant pas encore atteint sa destination au moment du focusout.
  menu.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!ouvert()) return;
      const a = document.activeElement;
      if (!menu.contains(a) && a !== bouton) fermer(false);
    }, 0);
  });

  // Le menu burger et le déroulant occupent la même zone : les laisser
  // ouverts ensemble superpose deux panneaux.
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    if (ouvert()) fermer(false);
  });
})();
