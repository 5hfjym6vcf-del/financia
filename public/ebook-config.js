// ============================================================
// FINANCIA — ebook-config.js
// Source unique des paramètres de la page ebook.
//
// L'INTERRUPTEUR EST ICI, ET NULLE PART AILLEURS.
// Tant que PAIEMENT_ACTIF vaut false, aucun appel à Stripe n'est possible
// depuis le navigateur : le bouton est rendu désactivé et le module de
// paiement ne se branche pas. C'est volontairement un verrou de code et non
// un simple masquage CSS, qu'un visiteur pourrait contourner.
//
// AVANT DE PASSER À true, TROIS CONDITIONS
//   1. La relecture juridique du contenu de l'ebook est faite.
//   2. Le compte Stripe existe et sa vérification d'identité est validée.
//   3. CLE_PUBLIQUE et PRIX_CENTIMES sont renseignés ci-dessous, et les
//      variables d'environnement STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET
//      sont posées côté Vercel.
// ============================================================

(function () {

  // ── Interrupteur général ──────────────────────────────────────────────
  const PAIEMENT_ACTIF = false;

  // ── Stripe ────────────────────────────────────────────────────────────
  // Clé PUBLIABLE uniquement (pk_test_… ou pk_live_…). Elle est conçue pour
  // être exposée au navigateur. La clé secrète (sk_…) ne doit JAMAIS
  // apparaître dans ce fichier ni dans aucun fichier de public/ : elle vit
  // exclusivement dans les variables d'environnement Vercel, lues par les
  // fonctions de api/.
  const CLE_PUBLIQUE = '';

  // ── Prix ──────────────────────────────────────────────────────────────
  // En centimes, comme l'attend Stripe. 1490 = 14,90 €.
  // À renseigner par le porteur du projet, avec la mention de TVA qui
  // correspond à son statut (voir MENTION_TVA plus bas).
  const PRIX_CENTIMES = null;
  const DEVISE = 'eur';

  // Une micro-entreprise sous le seuil de franchise affiche « TVA non
  // applicable, art. 293 B du CGI ». Une structure assujettie affiche un
  // prix TTC et le taux. Laisser vide tant que le statut n'est pas arrêté :
  // afficher la mauvaise mention est une irrégularité de facturation.
  const MENTION_TVA = '';

  function prixFormate() {
    if (PRIX_CENTIMES == null) return null;
    return (PRIX_CENTIMES / 100).toLocaleString('fr-FR', {
      style: 'currency', currency: DEVISE.toUpperCase(),
    });
  }

  // Le paiement n'est proposé que si TOUT est réuni. Un prix manquant ou une
  // clé vide suffit à garder le bouton désactivé, même si l'interrupteur a
  // été basculé par erreur.
  function estVendable() {
    return PAIEMENT_ACTIF
      && typeof CLE_PUBLIQUE === 'string' && CLE_PUBLIQUE.startsWith('pk_')
      && Number.isInteger(PRIX_CENTIMES) && PRIX_CENTIMES > 0;
  }

  // Raison précise du blocage, affichée en clair sur la page plutôt qu'un
  // bouton qui ne répond pas sans explication.
  function raisonIndisponible() {
    if (!PAIEMENT_ACTIF) return 'attente';
    if (!CLE_PUBLIQUE.startsWith('pk_')) return 'cle';
    if (!Number.isInteger(PRIX_CENTIMES) || PRIX_CENTIMES <= 0) return 'prix';
    return null;
  }

  window.FinanciaEbook = {
    PAIEMENT_ACTIF, CLE_PUBLIQUE, PRIX_CENTIMES, DEVISE, MENTION_TVA,
    prixFormate, estVendable, raisonIndisponible,
  };
})();
