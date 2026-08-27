// ============================================================
// FINANCIA — ui-erreur.js
// État d'erreur avec bouton « Réessayer ».
//
// Jusqu'ici, un chargement raté affichait un message sans la moindre action
// possible : la nouvelle tentative automatique n'arrive qu'au bout de cinq
// minutes, et rien ne le dit. En navigateur ce n'est pas grave, on recharge la
// page ; installée, l'application n'a plus ce bouton — même privation que la
// flèche retour.
//
// Partagé par les trois endroits qui peuvent échouer : la grille de Marchés,
// celle de Mes favoris, et le flux d'actualités de l'accueil.
// ============================================================

(function () {
  const API = {
    /**
     * Remplit `conteneur` avec le message d'erreur et un bouton qui rappelle
     * `relancer`. Celui-ci peut être asynchrone ; s'il aboutit, l'appelant
     * redessine le conteneur et le bouton disparaît de lui-même.
     */
    afficher(conteneur, cleTexte, relancer) {
      if (!conteneur) return;

      conteneur.innerHTML = `
        <div class="ui-erreur">
          <p class="ui-erreur-txt">${FinanciaI18N.t(cleTexte)}</p>
          <button type="button" class="ui-erreur-btn">${FinanciaI18N.t('commun.reessayer')}</button>
        </div>`;

      const btn = conteneur.querySelector('.ui-erreur-btn');
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = FinanciaI18N.t('commun.reessaiEnCours');
        try {
          await relancer();
        } finally {
          // Si la tentative a réussi, l'appelant a remplacé le contenu du
          // conteneur et ce bouton n'est plus dans le document : le remettre
          // en état n'aurait aucun sens. S'il y est encore, l'erreur persiste
          // et il faut pouvoir réessayer une fois de plus.
          if (btn.isConnected) {
            btn.disabled = false;
            btn.textContent = FinanciaI18N.t('commun.reessayer');
          }
        }
      });
    },
  };

  window.FinanciaErreur = API;
})();
