import { createClient } from '@supabase/supabase-js';

const URL_RE = /https?:\/\/|www\./i;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY manquant');
  return createClient(url, key);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  let supabase;
  try {
    supabase = getClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('avis')
      .select('id, prenom, note, texte, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { prenom, note, texte } = req.body || {};

    if (!prenom || !note || !texte)
      return res.status(400).json({ error: 'Prénom, note et avis sont obligatoires.' });
    if (typeof texte !== 'string' || texte.length > 200)
      return res.status(400).json({ error: 'Avis limité à 200 caractères.' });
    if (URL_RE.test(texte))
      return res.status(400).json({ error: 'Les liens ne sont pas autorisés dans les avis.' });

    const n = parseInt(note, 10);
    if (isNaN(n) || n < 1 || n > 5)
      return res.status(400).json({ error: 'Note invalide.' });

    const parts = String(prenom).trim().split(' ');
    const prenomAnon = (parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '')).slice(0, 30);

    const { data, error } = await supabase
      .from('avis')
      .insert({ prenom: prenomAnon, note: n, texte: texte.trim() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
