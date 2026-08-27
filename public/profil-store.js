// ============================================================
// FINANCIA — profil-store.js
// Préférences personnelles du visiteur (favoris, zones suivies).
//
// Tout est stocké sur l'appareil, dans localStorage. Aucun compte, aucun
// email, aucune base : le site ne collecte volontairement aucune donnée
// personnelle, et cette fonctionnalité ne devait pas être la première
// exception. En contrepartie les favoris ne suivent pas d'un appareil à
// l'autre — un « code de reprise » pourra être branché ici plus tard sans
// toucher au reste du code, puisque personne n'écrit dans le stockage en
// dehors de ce module.
//
// Exposé en global (window.FinanciaProfil), comme FinanciaI18N : les pages
// chargent des scripts classiques, sans bundler ni modules ES.
// ============================================================

(function () {
  const CLE = 'financia.profil';

  // Versionné dès le départ : le jour où la forme stockée change, on saura
  // distinguer un objet ancien d'un objet courant au lieu de deviner.
  const VERSION = 1;

  const VIDE = { v: VERSION, favoris: [], zones: [], notices: [], maj: null };

  // Un abonné est une fonction rappelée à chaque modification. Sert à garder
  // plusieurs vues d'une même page synchronisées (les cartes de Marchés
  // aujourd'hui, la page profil ensuite) sans qu'elles se connaissent.
  const abonnes = new Set();

  // Le stockage n'est pas toujours accessible : navigation privée sur
  // certains navigateurs, cookies tiers bloqués, quota plein. Aucun de ces
  // cas ne doit casser la page — on retombe alors sur un profil en mémoire,
  // qui vit le temps de l'onglet.
  let secours = null;

  function lire() {
    if (secours) return secours;
    try {
      const brut = localStorage.getItem(CLE);
      if (!brut) return { ...VIDE };
      const objet = JSON.parse(brut);
      // Un objet d'une version inconnue (plus récente, ou corrompu) est
      // ignoré plutôt que fusionné de force : mieux vaut repartir de zéro
      // que d'afficher des favoris à moitié valides.
      if (!objet || objet.v !== VERSION) return { ...VIDE };
      return {
        v: VERSION,
        favoris: Array.isArray(objet.favoris) ? objet.favoris.filter(k => typeof k === 'string') : [],
        zones: Array.isArray(objet.zones) ? objet.zones.filter(k => typeof k === 'string') : [],
        notices: Array.isArray(objet.notices) ? objet.notices.filter(k => typeof k === 'string') : [],
        maj: typeof objet.maj === 'string' ? objet.maj : null,
      };
    } catch {
      return { ...VIDE };
    }
  }

  function ecrire(profil) {
    profil.maj = new Date().toISOString();
    try {
      localStorage.setItem(CLE, JSON.stringify(profil));
      secours = null;
    } catch {
      secours = profil;
    }
    abonnes.forEach(fn => {
      // Un abonné qui échoue ne doit pas empêcher les suivants d'être notifiés.
      try { fn(profil); } catch (e) { console.error('[profil] abonné en erreur', e); }
    });
    return profil;
  }

  const API = {
    /** Copie du profil courant. Modifier l'objet renvoyé n'affecte rien. */
    lire() {
      const p = lire();
      return { ...p, favoris: [...p.favoris], zones: [...p.zones], notices: [...p.notices] };
    },

    favoris() { return [...lire().favoris]; },
    zones() { return [...lire().zones]; },

    estFavori(cle) { return lire().favoris.includes(cle); },
    nbFavoris() { return lire().favoris.length; },

    /** Ajoute ou retire un favori. Renvoie le nouvel état pour cette clé. */
    basculerFavori(cle) {
      const p = lire();
      const i = p.favoris.indexOf(cle);
      if (i === -1) p.favoris.push(cle);
      else p.favoris.splice(i, 1);
      ecrire(p);
      return i === -1;
    },

    /* Messages ponctuels déjà écartés par le visiteur. Stockés au même endroit
       que le reste : si le navigateur efface tout, l'avis réapparaît, ce qui
       est exactement le comportement voulu — la mise en garde redevient utile
       au moment précis où le risque qu'elle décrit s'est réalisé. */
    noticeEcartee(id) { return lire().notices.includes(id); },

    ecarterNotice(id) {
      const p = lire();
      if (!p.notices.includes(id)) { p.notices.push(id); ecrire(p); }
    },

    estZoneSuivie(cle) { return lire().zones.includes(cle); },

    basculerZone(cle) {
      const p = lire();
      const i = p.zones.indexOf(cle);
      if (i === -1) p.zones.push(cle);
      else p.zones.splice(i, 1);
      ecrire(p);
      return i === -1;
    },

    /** Efface tout. Le visiteur reste maître de ses données, y compris pour les supprimer. */
    reinitialiser() {
      secours = null;
      try { localStorage.removeItem(CLE); } catch { /* rien à faire */ }
      abonnes.forEach(fn => { try { fn({ ...VIDE }); } catch { /* ignoré */ } });
    },

    /** S'abonne aux changements. Renvoie la fonction de désabonnement. */
    surChangement(fn) {
      abonnes.add(fn);
      return () => abonnes.delete(fn);
    },

    /** Vrai si les préférences ne survivront pas à la fermeture de l'onglet. */
    estEphemere() { return secours !== null; },
  };

  // Deux onglets ouverts sur le site doivent rester cohérents : l'événement
  // "storage" ne se déclenche que dans les AUTRES onglets, ce qui en fait
  // exactement le signal recherché.
  window.addEventListener('storage', e => {
    if (e.key !== CLE) return;
    const p = lire();
    abonnes.forEach(fn => { try { fn(p); } catch { /* ignoré */ } });
  });

  window.FinanciaProfil = API;
})();
