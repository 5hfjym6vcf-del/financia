// In-memory store — persists while the function stays warm on Vercel.
// Pre-seeded with example reviews.
const store = [
  {
    id: 1,
    prenom: 'Thomas P.',
    note: 5,
    texte: 'Financia m\'a enfin permis de comprendre le PEA et les ETF sans me perdre dans du jargon. Le quiz personnalisé est vraiment utile pour savoir par où commencer.',
    date: '2026-06-10',
  },
  {
    id: 2,
    prenom: 'Camille R.',
    note: 5,
    texte: 'Le simulateur est top ! J\'ai pu voir concrètement ce que 100€/mois sur 20 ans peuvent devenir. Ça m\'a convaincu de commencer tout de suite.',
    date: '2026-06-12',
  },
  {
    id: 3,
    prenom: 'Lucas M.',
    note: 4,
    texte: 'Site clair et pédagogique. J\'aurais aimé encore plus de contenu sur la fiscalité, mais pour débuter c\'est vraiment bien fait.',
    date: '2026-06-14',
  },
  {
    id: 4,
    prenom: 'Inès B.',
    note: 5,
    texte: 'Enfin un site qui parle finance aux jeunes sans condescendance. J\'ai appris plus en 30 minutes ici qu\'en 3 ans de fac éco.',
    date: '2026-06-15',
  },
  {
    id: 5,
    prenom: 'Antoine V.',
    note: 4,
    texte: 'Le chat IA répond bien aux questions basiques. Très pratique pour comprendre la différence entre PEA et CTO. Je recommande à tous mes amis.',
    date: '2026-06-17',
  },
  {
    id: 6,
    prenom: 'Manon D.',
    note: 5,
    texte: 'Gratuit, sans pub, sans bullshit. Exactement ce qu\'il manquait pour les 20-30 ans qui veulent apprendre à investir sérieusement.',
    date: '2026-06-19',
  },
];
let nextId = 7;

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
