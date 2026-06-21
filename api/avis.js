// In-memory store — persists while the function stays warm on Vercel.
const store = [];
let nextId = 1;

const URL_RE = /https?:\/\/|www\./i;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const recent = [...store].sort((a, b) => b.id - a.id).slice(0, 6);
    return res.status(200).json(recent);
  }

  if (req.method === 'POST') {
    const { prenom, note, texte } = req.body || {};

    if (!prenom || !note || !texte) {
      return res.status(400).json({ error: 'Prénom, note et avis sont obligatoires.' });
    }
    if (typeof texte !== 'string' || texte.length > 200) {
      return res.status(400).json({ error: 'Avis limité à 200 caractères.' });
    }
    if (URL_RE.test(texte)) {
      return res.status(400).json({ error: 'Les liens ne sont pas autorisés dans les avis.' });
    }
    const n = parseInt(note, 10);
    if (isNaN(n) || n < 1 || n > 5) {
      return res.status(400).json({ error: 'Note invalide.' });
    }

    // Anonymise: garde prénom + initiale nom si présent
    const parts = String(prenom).trim().split(' ');
    const prenomAnon = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');

    const avis = {
      id: nextId++,
      prenom: prenomAnon.slice(0, 30),
      note: n,
      texte: texte.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    store.push(avis);
    return res.status(201).json(avis);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
