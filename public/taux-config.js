// ============================================================
// FINANCIA — taux-config.js
// Source unique des hypothèses du comparateur d'épargne.
//
// Un seul fichier, pour la même raison que partenaires-config.js : un taux
// écrit en dur dans le code est un taux qu'on oublie de mettre à jour. Le
// taux du Livret A change par arrêté, celui d'un compte espèces à la
// discrétion du courtier.
//
// DISTINCTION CAPITALE, portée par le champ `garanti` :
//   - Livret A : capital garanti par l'État, rendement connu à l'avance.
//   - Compte espèces : capital non garanti au sens boursier, mais taux connu.
//   - ETF : NI capital garanti, NI rendement connu. Le chiffre saisi est une
//     HYPOTHÈSE de l'utilisateur, pas une prévision de Financia.
// Le comparateur affiche cette différence à côté de chaque montant. Sans
// elle, mettre trois chiffres côte à côte suggérerait que le plus élevé est
// le meilleur, ce qui serait une recommandation déguisée.
// ============================================================

(function () {


  // ── Où mène le bouton « Découvrir l'offre » de chaque carte ───────────
  //
  //   ctaUrl      Lien d'affiliation définitif. Vide tant que la convention
  //               n'est pas signée. Quand il est renseigné, et seulement
  //               alors, la carte affiche la mention « Lien partenaire » :
  //               apposer cette mention sur un lien interne serait une
  //               fausse déclaration, aussi trompeuse que de l'omettre sur
  //               un lien rémunéré.
  //   ctaRepli    Destination tant que ctaUrl est vide. Interne, informative,
  //               sans rémunération : le bouton reste utile sans rien
  //               promettre.
  const SUPPORTS = [
    {
      id: 'livret-a',
      nom: 'Livret A',
      // Taux réglementé, fixé par arrêté. À revérifier à chaque révision.
      taux: 1.7,
      tauxModifiable: false,
      // Plafond de versement. Au-delà, les sommes ne rapportent rien sur ce
      // support : l'ignorer ferait mentir la comparaison sur les gros montants.
      plafond: 22950,
      // Exonéré d'impôt et de prélèvements sociaux.
      fiscalite: 0,
      garanti: true,
      note: 'Capital garanti par l\'État. Retrait possible à tout moment.',
      ctaUrl: '',
      ctaRepli: '/ressources#outils-quotidien',
      verifieLe: '2026-09-04',
    },
    {
      id: 'compte-especes',
      nom: 'Compte espèces rémunéré',
      // Varie d'un courtier à l'autre, et suit les taux directeurs.
      taux: 2.0,
      tauxModifiable: true,
      plafond: null,
      // Prélèvement forfaitaire unique : 12,8 % d'impôt + 17,2 % de
      // prélèvements sociaux.
      fiscalite: 30,
      garanti: true,
      note: 'Taux variable, révisable par l\'établissement à tout moment.',
      ctaUrl: '',
      ctaRepli: '/ressources#outils-quotidien',
      verifieLe: '2026-09-04',
    },
    {
      id: 'etf',
      nom: 'ETF actions (hypothèse)',
      // Valeur de départ modifiable, et présentée comme telle. Ce n'est pas
      // un rendement promis : les marchés actions ont connu des décennies
      // négatives comme des décennies à deux chiffres.
      taux: 6.0,
      tauxModifiable: true,
      plafond: null,
      // Dans un PEA détenu plus de cinq ans, seuls les 17,2 % de
      // prélèvements sociaux s'appliquent. Sur un compte-titres, 30 %.
      fiscalite: 17.2,
      garanti: false,
      note: 'Capital non garanti. La valeur peut baisser, y compris durablement.',
      ctaUrl: '',
      ctaRepli: '/ressources#outils-quotidien',
      verifieLe: '2026-09-04',
    },
  ];

  window.FinanciaTaux = {
    supports() { return SUPPORTS.map(s => ({ ...s })); },
    verifieLe() {
      return SUPPORTS.map(s => s.verifieLe).filter(Boolean).sort()[0] || '';
    },
  };

})();
