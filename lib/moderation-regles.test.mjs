// Banc d'essai de la passe déterministe. Se lance avec `node lib/moderation-regles.test.mjs`.
//
// Deux familles de cas, et la seconde compte plus que la première : un filtre
// qui bloque du contenu légitime est pire qu'un filtre trop laxiste, parce que
// personne ne s'en aperçoit. Les avis réellement publiés sur le site servent
// donc de référence : ils doivent tous passer.

import { analyser } from './moderation-regles.js';

const CAS = [
  // ── Doivent passer sans être signalés ───────────────────────
  ['rien', "Étant un jeune étudiant avec de l'argent gagné pendant l'été à placer, j'ai pu mieux comprendre les risques et points clés de l'investissement.", 'avis réel n°1'],
  ['rien', "Site complet qui m'a permis de mieux comprendre les enjeux autour de la finance et de l'investissement. Merci pour votre travail.", 'avis réel n°2'],
  ['rien', "J'ai découvert les ETF grâce au PEA, et le simulateur du CTO m'a aidé à comprendre la différence.", 'vocabulaire financier en capitales'],
  ['rien', "Les frais de ce fonds sont de 0,3 % par an, contre 1,5 % pour un fonds classique.", 'pourcentages, pas des montants'],
  ['rien', "Le krach de 1929 a effacé 89 % de la valeur du Dow Jones en trois ans.", 'chiffres historiques'],
  ['rien', "Je ne comprends pas la différence entre un ETF capitalisant et distribuant, quelqu'un peut expliquer ?", 'question de débutant'],
  ['rien', "Le PEA est plafonné à 150 000 € de versements.", 'montant pédagogique, pas personnel'],
  ['rien', "En 2021 le bitcoin a atteint 69 000 $ avant de retomber.", 'montant historique'],
  ['rien', "Notre IA est conçue pour l'éducation financière.", "« conçue » ne doit pas déclencher l'insulte"],

  ['rien', "J'ai ouvert un PEA et place une partie de mon épargne dessus.", 'présent de narration, pas un impératif'],

  // ── Doivent être rejetés ────────────────────────────────────
  ['rejeter', "Inscris-toi ici https://super-crypto.xyz/ref=PAOLO42 tu auras 50 % de bonus", 'lien de parrainage'],
  ['rejeter', "Va voir bit.ly/gains-rapides c'est le meilleur", 'lien raccourci sans protocole'],
  ['rejeter', "Contacte-moi sur telegram @tradermaster pour mes signaux", 'passage en messagerie privée'],
  ['rejeter', "Écris-moi à jean.dupont@gmail.com je t'explique ma méthode", 'adresse email'],
  ['rejeter', "Appelle le 06 12 34 56 78 pour rejoindre le groupe", 'numéro de téléphone'],
  ['rejeter', "Rendement garanti de 12 % par mois, sans risque, argent facile", 'promesse de rendement'],

  // ── Doivent partir en relecture ─────────────────────────────
  ['attente', "Achète des actions Nvidia maintenant, c'est le moment", 'injonction d\'achat'],
  ['attente', "J'ai mis 5000 € sur un ETF World le mois dernier", 'montant personnel'],
  ['attente', "Franchement ta question est débile, renseigne-toi", 'moquerie'],
  ['attente', "Fonce sur le DOGE et le SHIB, ça va x10", 'promotion de tickers'],
  ['attente', "Le Livret A est sans risque, avec un taux fixé par l'État.", 'formule exacte ici, mais tournure type du démarchage : relecture'],
];

let ok = 0, ko = 0;
const echecs = [];

for (const [attendu, texte, libelle] of CAS) {
  const r = analyser(texte);
  if (r.verdict === attendu) { ok++; continue; }
  ko++;
  echecs.push({ libelle, attendu, obtenu: r.verdict, motifs: r.motifs.map(m => m.code).join(', ') || '—', texte: texte.slice(0, 60) });
}

console.log(`\n  ${ok}/${CAS.length} cas conformes\n`);
if (echecs.length) {
  console.log('  ÉCHECS :');
  for (const e of echecs) {
    console.log(`   - ${e.libelle}`);
    console.log(`     attendu ${e.attendu}, obtenu ${e.obtenu}  [${e.motifs}]`);
    console.log(`     « ${e.texte} »`);
  }
  process.exitCode = 1;
} else {
  console.log('  Aucun faux positif sur les avis réels, aucun contournement sur les cas hostiles.');
}
