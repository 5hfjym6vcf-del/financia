// ============================================================
// FINANCIA — lib/moderation-regles.js
// Première passe de modération, entièrement déterministe.
//
// Aucune dépendance, aucun appel réseau, aucun quota : ce module tourne
// partout et ne peut pas tomber. Il attrape ce qui se reconnaît à coup sûr,
// c'est-à-dire l'essentiel du spam, et laisse au modèle de langage la seule
// question qu'une règle fixe ne sait pas trancher : « est-ce que ça ressemble
// à un conseil personnalisé ? »
//
// Placé dans lib/ et non dans api/ : sur Vercel, tout fichier de api/ devient
// une route HTTP, et ce module n'en est pas une.
//
// Les codes de règle renvoient à la charte publiée sur /communaute :
//   1. aucun conseil personnalisé entre membres
//   2. aucun lien de parrainage, aucune promotion de token ou de plateforme
//   3. pas de montants ni de situation personnelle
//   5. pas de moquerie
// (la règle 4, « chaque message est relu », décrit le processus, pas le texte)
// ============================================================

// Sigles financiers courants, à ne jamais confondre avec un ticker promu.
// Sans cette liste, « J'ai découvert les ETF grâce au PEA » serait signalé
// comme de la promotion : le faux positif le plus probable sur ce site.
const SIGLES_LEGITIMES = new Set([
  'ETF', 'PEA', 'CTO', 'AV', 'PER', 'SICAV', 'OPCVM', 'SCPI', 'CAC', 'SBF',
  'MSCI', 'SP', 'DAX', 'FTSE', 'SMI', 'IA', 'PIB', 'BCE', 'FED', 'AMF', 'ACPR',
  'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'TVA', 'PFU', 'CSG', 'CRDS', 'RSA',
  'OK', 'TOP', 'MERCI', 'BRAVO', 'PS', 'NB', 'CV', 'QCM', 'FAQ', 'URL',
]);

// Chaque entrée : un motif, la règle de la charte, et la gravité.
// « bloquant » = reconnaissable sans jugement, on rejette.
// « suspect »  = besoin d'un regard, on met en attente.
const MOTIFS = [
  // ── Règle 2 : liens et promotion ──────────────────────────
  {
    code: 'lien_parrainage',
    regle: 2,
    gravite: 'bloquant',
    // Les paramètres de parrainage sont explicites : c'est le seul cas où un
    // lien est certainement intéressé, indépendamment du domaine.
    motif: /\b(?:ref|refer|referral|parrain|parrainage|invite|invitation|aff|affiliate)[=/][\w-]{3,}/i,
  },
  {
    code: 'lien',
    regle: 2,
    gravite: 'bloquant',
    // Tout lien, y compris sans protocole (« bit.ly/xxx », « site .com »).
    motif: /(?:https?:\/\/|www\.)\S+|\b[\w-]{2,}\.(?:com|net|org|io|fr|be|ch|ca|co|xyz|link|me|ly|gg|to|app|site|shop)\b(?:\/\S*)?/i,
  },
  {
    code: 'contact_email',
    regle: 2,
    gravite: 'bloquant',
    motif: /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i,
  },
  {
    code: 'contact_telephone',
    regle: 2,
    gravite: 'bloquant',
    // Au moins neuf chiffres, séparateurs tolérés : évite d'attraper une année
    // ou un pourcentage.
    motif: /(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){9,}\d/,
  },
  {
    code: 'messagerie_privee',
    regle: 2,
    gravite: 'bloquant',
    // Le passage en messagerie privée est le préalable de presque toutes les
    // arnaques à l'investissement.
    motif: /\b(?:telegram|whatsapp|snap(?:chat)?|discord|signal|dm|mp)\b[\s:]*[@+]?[\w.-]{3,}|\b(?:écris|ecris|contacte|rejoins)[- ]moi\b/i,
  },
  {
    code: 'demarchage',
    regle: 2,
    gravite: 'bloquant',
    // Formules ouvertement racoleuses, sans usage légitime possible.
    motif: /\b(?:argent\s+facile|devenir\s+riche\s+(?:vite|rapidement)|100\s*%\s*(?:s[ûu]r|garanti)|profits?\s+garantis?)\b/i,
  },
  {
    code: 'promesse_rendement',
    regle: 2,
    gravite: 'suspect',
    // « Sans risque » est parfois exact : le Livret A l'est, et le quiz du site
    // pose justement la question. Suspect et non bloquant, donc, sinon le
    // filtre rejetterait du contenu pédagogique juste.
    motif: /\b(?:gains?|rendements?|b[ée]n[ée]fices?)\s+(?:garantis?|assur[ée]s?|s[ûu]rs?)\b|\bsans\s+risque\b/i,
  },

  // ── Règle 1 : conseil personnalisé ────────────────────────
  {
    code: 'injonction_achat',
    regle: 1,
    gravite: 'suspect',
    // Un impératif d'achat ou de vente. Suspect et non bloquant : « achète des
    // ETF plutôt que des actions » relève de l'explication maladroite, pas
    // forcément du conseil. C'est au relecteur de trancher.
    // La rétro-assertion écarte la première personne : « j'investis dans un
    // ETF » raconte une expérience, « investis dans un ETF » enjoint. Sans
    // elle, tout témoignage au présent serait mis en attente.
    // Le verbe doit ouvrir une phrase. Sans cette contrainte, « j'ai ouvert un
    // PEA et place une partie de mon épargne » — un témoignage au présent de
    // narration — était lu comme une injonction.
    motif: /(?:^|[.!?;:\n]\s*)(?:ach[èe]te|achetez|vends|vendez|investis|investissez|place|placez|mets|mettez)\s+(?:tout|tous|ton|ta|tes|votre|vos|des|du|de|le|la|les|un|une|dans|sur|en)\b/i,
  },

  // ── Règle 3 : montants et situation personnelle ───────────
  {
    code: 'montant',
    regle: 3,
    gravite: 'suspect',
    // Un montant avec devise, mais seulement rapporté à soi : la règle 3 vise
    // la situation personnelle, pas les chiffres. Sans cette condition, le
    // filtre signalait l'histoire du Bitcoin et le plafond du PEA.
    contexte: /\b(?:j'ai|j'|je|mon|ma|mes|moi|perso)\b/i,
    // Les pourcentages sont volontairement exclus :
    // « des frais de 0,3 % » est une information utile, pas une confidence.
    // Deux branches séparées : « \b » ne peut pas s'ancrer après « € », qui
    // n'est pas un caractère de mot, alors qu'il reste nécessaire après
    // « euros » pour ne pas mordre à l'intérieur d'un mot.
    motif: /\b\d[\d\s.,]{0,12}\s*(?:k\s*)?[€$£]|\b\d[\d\s.,]{0,12}\s*(?:euros?|dollars?|livres?)\b|[€$£]\s*\d/i,
  },

  // ── Règle 5 : moquerie ────────────────────────────────────
  {
    code: 'insulte',
    regle: 5,
    gravite: 'suspect',
    // La garde finale n'est pas décorative : « ç » n'étant pas un caractère de
    // mot en JS, \b trouvait une frontière au milieu de « conçue » et signalait
    // la FAQ du site comme une insulte.
    motif: /\b(?:con(?:ne|nard|nasse)?s?|débile|debile|abruti|crétin|cretin|idiot|imbécile|imbecile|nul\s+à\s+chier|ferme\s+ta\s+gueule|ta\s+gueule|nique|enculé|encule|salope)(?![\wàâäçéèêëîïôöùûüÿ])/i,
  },
];

/**
 * Analyse un texte et renvoie le verdict de la passe déterministe.
 *
 * @param {string} texte
 * @returns {{verdict: 'rejeter'|'attente'|'rien', motifs: Array<{code:string,regle:number,extrait:string}>}}
 *
 * `rien` ne veut pas dire « publiable » : cela veut dire qu'aucune règle fixe
 * ne s'applique et que la décision revient à l'étape suivante.
 */
export function analyser(texte) {
  const t = String(texte || '');
  const motifs = [];
  let bloquant = false;

  for (const m of MOTIFS) {
    const trouve = t.match(m.motif);
    if (!trouve) continue;
    // Certains motifs n'ont de sens que dans un contexte donné : un montant
    // n'engage que s'il est rapporté à celui qui écrit.
    if (m.contexte && !m.contexte.test(t)) continue;
    if (m.gravite === 'bloquant') bloquant = true;
    motifs.push({ code: m.code, regle: m.regle, extrait: trouve[0].trim().slice(0, 60) });
  }

  // Promotion de ticker : traitée à part, une expression régulière seule
  // signalerait tous les sigles financiers du vocabulaire du site.
  const tickers = tickersPromus(t);
  if (tickers.length) {
    motifs.push({ code: 'ticker_promu', regle: 2, extrait: tickers.join(', ').slice(0, 60) });
  }

  const verdict = bloquant ? 'rejeter' : motifs.length ? 'attente' : 'rien';
  return { verdict, motifs };
}

/**
 * Sigles en capitales de 2 à 6 lettres, hors vocabulaire financier courant, et
 * seulement s'ils sont accompagnés d'un verbe de promotion. Un ticker cité pour
 * illustrer n'est pas une promotion ; c'est l'incitation qui l'est.
 */
function tickersPromus(t) {
  const promotion = /\b(?:ach[èe]te|achetez|prends|prenez|mise[zr]?|misez|fonce[zr]?|pump|moon|x\d+|to\s+the\s+moon)\b/i;
  if (!promotion.test(t)) return [];
  const candidats = t.match(/\b[A-Z]{2,6}\b/g) || [];
  return [...new Set(candidats.filter(c => !SIGLES_LEGITIMES.has(c)))];
}

export const _interne = { MOTIFS, SIGLES_LEGITIMES, tickersPromus };
