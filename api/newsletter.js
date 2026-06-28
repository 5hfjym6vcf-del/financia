export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!apiKey || !listId) {
    console.error('[newsletter] MAILCHIMP_API_KEY ou MAILCHIMP_LIST_ID manquant');
    return res.status(500).json({ error: 'Configuration newsletter manquante.' });
  }

  // Data center is the suffix after the last dash in the API key (e.g. "us14")
  const dc = apiKey.split('-').pop();
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        status: 'subscribed',
        tags: ['financia-web'],
      }),
    });

    const data = await r.json();

    if (r.ok) {
      return res.status(200).json({ ok: true });
    }

    // Already subscribed → treat as success
    if (data.title === 'Member Exists') {
      return res.status(200).json({ ok: true, already: true });
    }

    console.error('[newsletter] Mailchimp error:', data.title, data.detail);
    return res.status(400).json({ error: data.detail || 'Erreur lors de l\'inscription.' });
  } catch (e) {
    console.error('[newsletter] Fetch failed:', e.message);
    return res.status(500).json({ error: 'Erreur réseau.' });
  }
}
