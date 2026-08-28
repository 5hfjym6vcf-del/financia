// ============================================================
// FINANCIA — api/secteurs.js
// Sociétés emblématiques regroupées par secteur d'activité.
//
// Endpoint distinct de /api/marches, et non un ajout à celui-ci : les deux
// listes cumulées feraient 33 appels Yahoo à chaque rafraîchissement, sur une
// source sans clé qui limite le débit. Séparer permet aussi un cache plus long
// ici — un classement sectoriel n'a pas besoin de la fraîcheur des indices.
//
// Présentation strictement classificatoire : aucune sélection, aucun
// classement, aucune notation. Les sociétés sont citées parce qu'elles sont
// représentatives de leur secteur, pas parce qu'elles seraient à acheter.
// ============================================================

let cache = null;
let cacheAt = 0;
const CACHE_MS = 15 * 60 * 1000;
const CACHE_CONTROL = 's-maxage=900, stale-while-revalidate=1800';

// EDF ne figure pas dans la liste : renationalisée en 2023, elle est sortie de
// la cote et son symbole renvoie une erreur. SpaceX non plus, la société
// n'ayant jamais été introduite en Bourse — les deux sont signalées comme non
// cotées côté affichage plutôt que passées sous silence.
const SECTEURS = [
  {
    cle: 'defense',
    societes: [
      { cle: 'thales', symbol: 'HO.PA', nom: 'Thales' },
      { cle: 'dassault', symbol: 'AM.PA', nom: 'Dassault Aviation' },
      { cle: 'safran', symbol: 'SAF.PA', nom: 'Safran' },
      { cle: 'palantir', symbol: 'PLTR', nom: 'Palantir' },
      { cle: 'lockheed', symbol: 'LMT', nom: 'Lockheed Martin' },
    ],
  },
  {
    cle: 'tech',
    societes: [
      { cle: 'nvidia', symbol: 'NVDA', nom: 'NVIDIA' },
      { cle: 'apple', symbol: 'AAPL', nom: 'Apple' },
      { cle: 'microsoft', symbol: 'MSFT', nom: 'Microsoft' },
      { cle: 'alphabet', symbol: 'GOOGL', nom: 'Alphabet' },
      { cle: 'spacex', symbol: null, nom: 'SpaceX' },
    ],
  },
  {
    cle: 'sante',
    societes: [
      { cle: 'sanofi', symbol: 'SAN.PA', nom: 'Sanofi' },
      { cle: 'novo', symbol: 'NVO', nom: 'Novo Nordisk' },
      { cle: 'jnj', symbol: 'JNJ', nom: 'Johnson & Johnson' },
      { cle: 'pfizer', symbol: 'PFE', nom: 'Pfizer' },
    ],
  },
  {
    cle: 'energie',
    societes: [
      { cle: 'total', symbol: 'TTE.PA', nom: 'TotalEnergies' },
      { cle: 'schneider', symbol: 'SU.PA', nom: 'Schneider Electric' },
      { cle: 'edf', symbol: null, nom: 'EDF' },
    ],
  },
];

async function fetchCours(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);

  const meta = (await r.json())?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('cours absent');

  // Les valeurs londoniennes se cotent en pence : sans conversion, un prix
  // ressortirait cent fois trop élevé. Aucune de la liste actuelle n'est
  // concernée, mais la règle doit accompagner le code qui lit Yahoo.
  const pence = meta.currency === 'GBp' || meta.currency === 'GBX';
  const diviseur = pence ? 100 : 1;
  const precedent = meta.chartPreviousClose ?? meta.previousClose;

  return {
    price: meta.regularMarketPrice / diviseur,
    currency: pence ? 'GBP' : meta.currency,
    changePct: typeof precedent === 'number' && precedent
      ? ((meta.regularMarketPrice - precedent) / precedent) * 100
      : null,
  };
}

async function fetchSecteurs() {
  const aInterroger = SECTEURS.flatMap(s => s.societes.filter(x => x.symbol));
  const resultats = await Promise.allSettled(aInterroger.map(s => fetchCours(s.symbol)));

  const cours = {};
  aInterroger.forEach((s, i) => {
    const r = resultats[i];
    if (r.status === 'fulfilled') cours[s.cle] = r.value;
    else console.error(`[secteurs] ${s.cle} (${s.symbol}) :`, r.reason?.message);
  });

  const secteurs = SECTEURS.map(s => ({
    cle: s.cle,
    societes: s.societes.map(x => ({
      cle: x.cle,
      nom: x.nom,
      ticker: x.symbol,
      // Une société non cotée est renvoyée telle quelle, avec la mention : la
      // faire disparaître laisserait croire qu'elle s'échange en Bourse.
      cotee: Boolean(x.symbol),
      ...(cours[x.cle] || {}),
    })),
  }));

  const servis = Object.keys(cours).length;
  if (!servis) throw new Error('aucun cours disponible');
  return { secteurs, coursServis: servis, coursAttendus: aInterroger.length };
}

export default async function handler(req, res) {
  const now = Date.now();

  if (cache && now - cacheAt < CACHE_MS) {
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  try {
    cache = await fetchSecteurs();
    cacheAt = now;
    console.log(`[secteurs] ${cache.coursServis}/${cache.coursAttendus} cours obtenus`);
    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json(cache);
  } catch (e) {
    console.error('[secteurs] Échec :', e.message);
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(502).json({ error: e.message });
  }
}
