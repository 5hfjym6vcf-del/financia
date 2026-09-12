// ============================================================
// FINANCIA — api/ebook-session.js
// Crée une session Stripe Checkout pour l'ebook premium.
//
// POURQUOI UNE FONCTION SERVEUR ET PAS UN APPEL DEPUIS LA PAGE
// Créer une session exige la clé SECRÈTE. Exposée au navigateur, elle
// permettrait à n'importe qui de créer des remboursements, de lire les
// clients et de vider le compte. Elle ne quitte donc jamais l'environnement
// serveur : ce fichier la lit dans process.env, la page ne la voit jamais.
//
// POURQUOI LE PRIX EST FIXÉ ICI, ET NON ENVOYÉ PAR LA PAGE
// Un montant transmis par le client est un montant modifiable par le client.
// On lirait alors des paiements à 0,01 €. Le prix vient exclusivement de
// EBOOK_PRIX_CENTIMES, variable d'environnement.
//
// PAS DE DÉPENDANCE stripe
// L'API REST suffit et évite d'ajouter un paquet au projet. Les échanges se
// font en application/x-www-form-urlencoded, comme l'attend Stripe.
// ============================================================

const STRIPE_API = 'https://api.stripe.com/v1';

// Construit un corps de requête au format attendu par Stripe, qui utilise
// une notation en crochets pour les structures imbriquées.
function encoder(obj, prefixe = '', sortie = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const cle = prefixe ? `${prefixe}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) encoder(v, cle, sortie);
    else if (Array.isArray(v)) v.forEach((el, i) => encoder(el, `${cle}[${i}]`, sortie));
    else sortie.append(cle, String(v));
  }
  return sortie;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const cle = process.env.STRIPE_SECRET_KEY;
  const prix = parseInt(process.env.EBOOK_PRIX_CENTIMES || '', 10);

  // Verrou serveur, indépendant de celui du navigateur. Même si quelqu'un
  // appelle cette route directement, rien ne part tant que la configuration
  // n'est pas complète côté Vercel.
  if (process.env.EBOOK_PAIEMENT_ACTIF !== 'true') {
    return res.status(503).json({ error: 'Le paiement n\'est pas encore ouvert.' });
  }
  if (!cle || !cle.startsWith('sk_')) {
    return res.status(500).json({ error: 'Configuration de paiement incomplète.' });
  }
  if (!Number.isInteger(prix) || prix <= 0) {
    return res.status(500).json({ error: 'Prix non configuré.' });
  }

  const origine = process.env.SITE_URL || 'https://financia.cloud';

  try {
    const corps = encoder({
      mode: 'payment',
      // Stripe renvoie l'identifiant de session dans l'URL de succès : c'est
      // lui qui servira ensuite à vérifier le paiement côté serveur avant de
      // libérer le PDF. Aucun secret ne transite par l'URL.
      success_url: `${origine}/guide?paiement=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origine}/guide?paiement=annule`,
      // L'adresse est collectée par Stripe : elle sert d'accusé et de preuve
      // d'achat, et évite de gérer un formulaire de notre côté.
      customer_creation: 'always',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: process.env.EBOOK_DEVISE || 'eur',
          unit_amount: prix,
          product_data: {
            name: 'La Recette Financière, version complète',
            description: 'Guide numérique au format PDF, téléchargement immédiat.',
          },
        },
      }],
      metadata: { produit: 'ebook-recette-financiere' },
      // Trace de la renonciation au droit de rétractation, cochée sur la page
      // avant d'arriver ici. Conservée avec le paiement, elle est la preuve
      // du consentement exigé par l'art. L221-28 13° du code de la
      // consommation en cas de contestation.
      payment_intent_data: {
        metadata: {
          renonciation_retractation: 'acceptee',
          renonciation_horodatage: new Date().toISOString(),
        },
      },
      locale: 'fr',
    });

    const r = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: corps,
    });
    const data = await r.json();

    if (!r.ok) {
      // On journalise le détail côté serveur, on ne le renvoie pas : un
      // message d'erreur Stripe peut contenir des informations de compte.
      console.error('[ebook-session] Stripe a refusé :', data?.error?.message);
      return res.status(502).json({ error: 'Création de la session impossible.' });
    }

    return res.status(200).json({ url: data.url, id: data.id });
  } catch (e) {
    console.error('[ebook-session] échec :', e.message);
    return res.status(500).json({ error: 'Erreur inattendue.' });
  }
}
