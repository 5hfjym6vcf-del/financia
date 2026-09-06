// ============================================================
// FINANCIA — partenaires-config.js
// Source unique des données partenaires. Rien d'autre dans le site ne
// contient de nom de courtier, de barème de frais ni de prime.
//
// POURQUOI UN SEUL FICHIER
// Les mêmes données alimentent quatre emplacements : le bloc sous le
// simulateur, le comparateur d'épargne, le tableau de /ressources et les
// encadrés dans les contenus pédagogiques. Dupliquer un barème de frais à
// quatre endroits, c'est se garantir qu'un jour trois seront périmés.
//
// TANT QUE `actif` VAUT false, AUCUN BLOC N'EST RENDU.
// C'est volontaire : le site est en ligne, et une carte partenaire à moitié
// remplie est une allégation commerciale. Passer `actif` à true ne suffit
// d'ailleurs pas — chaque partenaire doit être complet au sens de
// estUtilisable() ci-dessous, sinon il est ignoré et signalé en console.
//
// CE QU'IL NE FAUT PAS ÉCRIRE ICI
// Aucun chiffre qui ne figure pas noir sur blanc dans le contrat de la régie
// ou sur la page tarifaire publique du partenaire, à la date de `verifieLe`.
// Une prime inventée ou périmée est une pratique commerciale trompeuse
// (art. L.121-2 du code de la consommation), pas une approximation.
// ============================================================

(function () {

  // ── Interrupteur général ──────────────────────────────────────────────
  // À passer à true une fois les conventions signées ET les données
  // ci-dessous renseignées. Un seul endroit à changer pour tout allumer,
  // et un seul à rebasculer si une convention prend fin.
  const ACTIF = false;

  // ── Les partenaires ───────────────────────────────────────────────────
  //
  // Champs obligatoires (sans eux la fiche est ignorée) :
  //   id, nom, url, verifieLe
  //
  // Champs factuels, affichés tels quels. Laisser la chaîne vide plutôt que
  // d'approximer : une cellule vide se lit « non communiqué », une cellule
  // fausse se lit comme une information.
  //
  //   categories   Où la fiche peut apparaître. Valeurs possibles :
  //                'bourse'          courtiers PEA/CTO
  //                'gestion-pilotee' mandats, robo-advisors
  //                'neobanque'       comptes courants
  //                'epargne'         livrets, comptes espèces rémunérés
  //   comptes      true / false / null. null = non vérifié, la case reste
  //                vide au lieu d'afficher une croix qui serait un jugement.
  //   fraisOrdre   Frais de courtage, texte exact du barème public.
  //   fraisGestion Frais annuels de gestion ou de tenue de compte.
  //   depotMin     Dépôt minimum à l'ouverture.
  //   depositaire  Établissement teneur de compte, et pays.
  //   fait         UN fait distinctif, vérifiable, non promotionnel.
  //                « Ordres à 1 € jusqu'à 500 € » : oui.
  //                « Le meilleur courtier du marché » : non.
  //   prime        Prime de bienvenue. Vide tant qu'elle n'est pas au
  //                contrat. Si elle est conditionnée, écrire la condition.
  //   url          Site public de l'établissement. Toujours renseigné.
  //   urlAffiliee  Lien rémunéré, vide tant qu'aucune convention n'est
  //                signée. C'est LUI, et lui seul, qui déclenche la mention
  //                « Lien affilié » et le rel="sponsored". Une fiche sans
  //                urlAffiliee reste affichable : c'est alors une simple
  //                référence, sans rémunération à déclarer.
  //   verifieLe    Date de vérification des chiffres, format AAAA-MM-JJ.
  //                Affichée sous le tableau. Au-delà de PEREMPTION_JOURS,
  //                la fiche est masquée automatiquement.
  //
  // Le gabarit ci-dessous est commenté : il documente la forme sans rien
  // publier. Décommenter et remplir au moment de la signature.
  const PARTENAIRES = [
    // {
    //   id: 'exemple',
    //   nom: '',
    //   categories: ['bourse'],
    //   comptes: { pea: null, cto: null, per: null, av: null },
    //   fraisOrdre: '',
    //   fraisGestion: '',
    //   depotMin: '',
    //   depositaire: '',
    //   fait: '',
    //   prime: '',
    //   url: '',
    //   urlAffiliee: '',
    //   verifieLe: '',
    // },
  ];

  // Un barème de frais bouge. Passé ce délai sans revérification, la fiche
  // disparaît d'elle-même plutôt que d'afficher un chiffre périmé.
  const PEREMPTION_JOURS = 120;

  // ── Contrôle de complétude ────────────────────────────────────────────

  const OBLIGATOIRES = ['id', 'nom', 'url', 'verifieLe'];

  function joursDepuis(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return Infinity;
    return (Date.now() - d.getTime()) / 86400000;
  }

  function estUtilisable(p) {
    const manquants = OBLIGATOIRES.filter(c => !p[c] || String(p[c]).trim() === '');
    if (manquants.length) {
      console.warn(`[partenaires] « ${p.id || '(sans id)'} » ignoré : champ(s) manquant(s) — ${manquants.join(', ')}`);
      return false;
    }
    const age = joursDepuis(p.verifieLe);
    if (age > PEREMPTION_JOURS) {
      console.warn(`[partenaires] « ${p.id} » ignoré : données vérifiées il y a ${Math.round(age)} jours (limite ${PEREMPTION_JOURS}).`);
      return false;
    }
    return true;
  }

  const utilisables = ACTIF ? PARTENAIRES.filter(estUtilisable) : [];

  // ── API publique ──────────────────────────────────────────────────────

  window.FinanciaPartenaires = {
    /** Y a-t-il au moins une fiche publiable ? Les modules d'affichage
     *  appellent ceci en premier et ne rendent rien si c'est faux. */
    estActif() {
      return utilisables.length > 0;
    },

    /** Fiches d'une catégorie, dans l'ordre du fichier — jamais trié par
     *  un critère de qualité, ce qui constituerait un classement. */
    pour(categorie, max = 3) {
      return utilisables
        .filter(p => Array.isArray(p.categories) && p.categories.includes(categorie))
        .slice(0, max);
    },

    /** Toutes les fiches publiables, pour le tableau comparatif. */
    toutes() {
      return utilisables.slice();
    },

    /** Date de vérification la plus ancienne parmi les fiches affichées :
     *  c'est elle qu'on annonce sous un tableau, pas la plus récente. */
    verifieLe(fiches = utilisables) {
      const dates = fiches.map(p => p.verifieLe).filter(Boolean).sort();
      return dates[0] || '';
    },

    PEREMPTION_JOURS,
  };

})();
