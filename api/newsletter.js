export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  const apiKey    = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const listId    = process.env.MAILJET_LIST_ID;

  if (!apiKey || !secretKey || !listId) {
    console.error('[newsletter] Variables Mailjet manquantes');
    return res.status(500).json({ error: 'Configuration newsletter manquante.' });
  }

  const url = `https://api.mailjet.com/v3/REST/contactslist/${listId}/managecontact`;
  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        Email: email.toLowerCase().trim(),
        Action: 'addnoforce',
      }),
    });

    const data = await r.json();

    if (r.ok) {
      // Check if contact was already on the list
      const action = data.Data?.[0]?.Action;
      if (action === 'none') {
        return res.status(200).json({ ok: true, already: true });
      }
      return res.status(200).json({ ok: true });
    }

    const errMsg = data.ErrorMessage || data.Message || 'Erreur lors de l\'inscription.';
    console.error('[newsletter] Mailjet error:', r.status, errMsg);
    return res.status(400).json({ error: errMsg });
  } catch (e) {
    console.error('[newsletter] Fetch failed:', e.message);
    return res.status(500).json({ error: 'Erreur réseau.' });
  }
}
