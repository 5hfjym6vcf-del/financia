// ============================================================
// FINANCIA — api/ebook-telechargement.js
// Sert le PDF premium, uniquement à qui l'a payé.
//
// LE PDF N'EST PAS DANS public/
// Tout fichier de public/ est servi à qui en connaît l'adresse. Un PDF payant
// posé là serait téléchargeable sans passer par le paiement, et l'URL
// circulerait en quelques heures. Il vit donc dans prive/, hors du dossier
// public, et seule cette fonction peut le lire.
//
// COMMENT L'ACCÈS EST VÉRIFIÉ
// La page de succès reçoit un session_id de Stripe. Cette fonction interroge
// Stripe pour savoir si CETTE session est réellement payée. Aucune confiance
// n'est accordée au paramètre lui-même : un identifiant inventé ou recopié
// d'ailleurs ne passera pas, et un identifiant valide mais impayé non plus.
//
// POURQUOI PAS UN JETON SIGNÉ DE NOTRE CÔTÉ
// Il faudrait le stocker ou le faire expirer, donc gérer un état. Interroger
// Stripe à chaque demande évite toute base de données et garde une seule
// source de vérité, celle qui encaisse.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';

const STRIPE_API = 'https://api.stripe.com/v1';

// Chemin hors de public/. À déposer par le porteur du projet une fois la
// relecture juridique faite.
const FICHIER = path.join(process.cwd(), 'prive', 'la-recette-financiere.pdf');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const sessionId = String(req.query.session_id || '');
  // Filtre de forme avant tout appel réseau : évite d'envoyer chez Stripe
  // n'importe quelle chaîne reçue, et coupe court aux tentatives d'injection
  // dans l'URL.
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Référence de commande invalide.' });
  }

  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle || !cle.startsWith('sk_')) {
    return res.status(500).json({ error: 'Configuration de paiement incomplète.' });
  }

  try {
    const r = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${cle}` },
    });
    const s = await r.json();

    if (!r.ok) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }
    if (s.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Paiement non confirmé.' });
    }
    // Empêche qu'une session payée pour un autre produit ouvre ce fichier,
    // le jour où le site en vendra plusieurs.
    if (s.metadata?.produit !== 'ebook-recette-financiere') {
      return res.status(403).json({ error: 'Cette commande ne concerne pas ce guide.' });
    }

    if (!fs.existsSync(FICHIER)) {
      console.error('[ebook-telechargement] fichier absent :', FICHIER);
      return res.status(503).json({
        error: "Le guide n'est pas encore disponible au téléchargement. " +
               'Ton paiement est bien enregistré, écris-nous à financiacloud@gmail.com.',
      });
    }

    const donnees = fs.readFileSync(FICHIER);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      'attachment; filename="financia-la-recette-financiere.pdf"');
    res.setHeader('Content-Length', donnees.length);
    // Jamais de cache partagé sur un fichier payant.
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(donnees);
  } catch (e) {
    console.error('[ebook-telechargement] échec :', e.message);
    return res.status(500).json({ error: 'Erreur inattendue.' });
  }
}
