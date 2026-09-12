// ============================================================
// FINANCIA — api/ebook-webhook.js
// Reçoit les notifications de Stripe et confirme le paiement.
//
// POURQUOI VÉRIFIER LA SIGNATURE
// Cette URL est publique. Sans vérification, n'importe qui pourrait envoyer
// un faux « paiement confirmé » et débloquer le téléchargement gratuitement.
// Stripe signe chaque envoi avec un secret partagé ; on recalcule la
// signature et on compare en temps constant.
//
// POURQUOI LE CORPS BRUT
// La signature porte sur les octets exacts reçus. Si le corps est parsé en
// JSON puis re-sérialisé, un espace ou un ordre de clé qui change suffit à
// invalider la signature. D'où la désactivation du bodyParser de Vercel.
//
// CE QUE CE WEBHOOK NE FAIT PAS
// Il ne délivre pas le PDF. Le déblocage passe par api/ebook-telechargement,
// qui interroge Stripe au moment du clic. C'est plus robuste : un webhook
// perdu ou rejoué ne prive personne de son achat, et rien n'a besoin d'être
// stocké entre les deux.
// ============================================================

import crypto from 'node:crypto';

export const config = { api: { bodyParser: false } };

function lireCorpsBrut(req) {
  return new Promise((resoudre, rejeter) => {
    const morceaux = [];
    req.on('data', (c) => morceaux.push(c));
    req.on('end', () => resoudre(Buffer.concat(morceaux)));
    req.on('error', rejeter);
  });
}

// Reproduit le schéma de signature de Stripe : en-tête « t=…,v1=… », la
// valeur signée étant « timestamp.corps ».
function signatureValide(brut, enTete, secret, toleranceSecondes = 300) {
  if (!enTete || !secret) return false;
  const parts = Object.fromEntries(
    enTete.split(',').map((p) => p.split('=')).filter((p) => p.length === 2)
  );
  const t = parts.t;
  const recue = parts.v1;
  if (!t || !recue) return false;

  // Fenêtre temporelle : sans elle, une requête interceptée resterait
  // rejouable indéfiniment.
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10));
  if (!Number.isFinite(age) || age > toleranceSecondes) return false;

  const attendue = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${brut.toString('utf8')}`, 'utf8')
    .digest('hex');

  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(recue, 'utf8');
  // timingSafeEqual exige des longueurs égales et compare sans fuite de
  // temps, ce qu'une comparaison par === ne garantit pas.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[ebook-webhook] STRIPE_WEBHOOK_SECRET absent');
    return res.status(500).end();
  }

  let brut;
  try {
    brut = await lireCorpsBrut(req);
  } catch {
    return res.status(400).end();
  }

  if (!signatureValide(brut, req.headers['stripe-signature'], secret)) {
    console.warn('[ebook-webhook] signature invalide, envoi ignoré');
    return res.status(400).json({ error: 'Signature invalide' });
  }

  let evenement;
  try {
    evenement = JSON.parse(brut.toString('utf8'));
  } catch {
    return res.status(400).end();
  }

  if (evenement.type === 'checkout.session.completed') {
    const s = evenement.data?.object || {};
    if (s.payment_status === 'paid') {
      // Pas de base de données sur ce projet : la trace utile est le journal
      // Vercel, et Stripe reste la source de vérité interrogée au moment du
      // téléchargement. On n'enregistre aucune donnée personnelle ici.
      console.log('[ebook-webhook] paiement confirmé, session', s.id);
    }
  }

  // Toujours 200 sur un envoi authentique, même pour un type d'événement
  // qu'on n'exploite pas : un code d'erreur ferait réessayer Stripe en
  // boucle et finirait par désactiver l'endpoint.
  return res.status(200).json({ recu: true });
}
