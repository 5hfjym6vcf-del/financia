// ============================================================
// FINANCIA — api/resultats.js
// Calendrier des publications de résultats de la semaine en cours.
//
// Source : endpoint EARNINGS_CALENDAR d'Alpha Vantage, déjà utilisé pour les
// actualités. Yahoo Finance ne convient pas ici : son module quoteSummary,
// seul à exposer les dates de résultats, exige désormais un jeton et renvoie
// un 401.
//
// Périmètre : grandes valeurs américaines uniquement. Le calendrier
// d'Alpha Vantage ne couvre pas la Bourse de Paris — aucun ticker .PA sur les
// 1 597 sociétés renvoyées — et seules 5 valeurs du CAC 40 y figurent via leur
// cotation américaine. Annoncer un calendrier CAC 40 serait donc trompeur.
// ============================================================

// 12 h : le calendrier ne bouge quasiment pas dans la journée. À ce rythme,
// deux appels quotidiens, sur un quota gratuit de 25 dont les actualités
// consomment déjà 8.
let cache = null;
let cacheAt = 0;
const CACHE_MS = 12 * 60 * 60 * 1000;
const CACHE_CONTROL = 's-maxage=43200, stale-while-revalidate=86400';

// Le flux brut mêle grandes capitalisations et micro-caps inconnues : 115
// publications pour la seule semaine en cours, dont l'essentiel n'évoque rien
// à un lecteur débutant. On restreint donc aux valeurs identifiables.
const GRANDES_VALEURS = new Set([
  'AAPL','MSFT','NVDA','GOOG','GOOGL','AMZN','META','TSLA','BRK.B','AVGO','LLY','JPM','V','MA','UNH','XOM',
  'JNJ','PG','COST','HD','MRK','ABBV','CVX','ADBE','CRM','NFLX','AMD','PEP','KO','WMT','BAC','TMO','ACN',
  'MCD','CSCO','LIN','ABT','DHR','INTC','VZ','TXN','DIS','WFC','PM','INTU','AMGN','COP','IBM','QCOM','NOW',
  'CAT','GE','NKE','SPGI','UBER','BA','HON','RTX','UNP','GS','LOW','ELV','BKNG','SBUX','MS','BLK','DE','LMT',
  'PLD','MDT','AXP','SYK','TJX','ADP','GILD','MDLZ','CVS','VRTX','ADI','C','REGN','ZTS','CB','MMC','SCHW',
  'PGR','SO','DUK','BSX','MU','PYPL','EQIX','ITW','APD','CL','SHW','CME','MO','NOC','GD','FDX','TGT','MCK',
  'ORCL','SNOW','PANW','CRWD','SQ','SHOP','ABNB','COIN','RIVN','LCID','F','GM','DAL','UAL','MAR','HLT','EBAY',
  'ETSY','ROKU','SPOT','PINS','SNAP','ZM','DOCU','TWLO','DDOG','NET','MDB','TEAM','WDAY','DASH','LYFT','PLTR',
  'SMCI','ARM','DELL','HPQ','WBD','PARA','LUV','CCL','RCL','NCLH','CMG','YUM','DPZ','KHC','GIS','K','HSY',
  'STZ','TAP','EL','LULU','RL','GPS','M','KSS','BBY','DG','DLTR','ROST','ORLY','AZO','TSCO','ULTA',
]);

// Le calendrier ne regarde que vers l'avant : il démarre à la date du jour.
// Aucun mois passé n'est donc disponible, quelle que soit la valeur d'horizon.
const HORIZONS = ['12month', '6month', '3month'];

// Les noms arrivent tout en majuscules et gonflés de suffixes juridiques.
// « ADVANCED MICRO DEVICES INCORPORATED » devient « Advanced Micro Devices ».
// Quelques marques s'écrivent avec une casse interne qu'aucune règle ne
// devine : on les liste plutôt que de produire « Crowdstrike » ou « Ebay ».
const CASSE_EXACTE = {
  HP: 'HP', IBM: 'IBM', AMD: 'AMD', GE: 'GE', GM: 'GM', UPS: 'UPS', CVS: 'CVS', PNC: 'PNC',
  CROWDSTRIKE: 'CrowdStrike', EBAY: 'eBay', PAYPAL: 'PayPal', YOUTUBE: 'YouTube',
  MCDONALD: 'McDonald', MCKESSON: 'McKesson', IPHONE: 'iPhone', NVIDIA: 'NVIDIA',
  TJX: 'TJX', ADP: 'ADP', SPGI: 'S&P Global', ORLY: "O'Reilly",
};

function nettoyerNom(brut) {
  const sansSuffixe = brut
    .replace(/\b(INCORPORATED|CORPORATION|COMPANY|LIMITED|HOLDINGS?|GROUP|INC|CORP|CO|LTD|PLC|SA|NV|AG)\b\.?/gi, '')
    .replace(/[,\s]+$/, '')
    .trim();

  return (sansSuffixe || brut)
    .split(/\s+/)
    .map(mot => {
      const exact = CASSE_EXACTE[mot.toUpperCase().replace(/[^A-Z&']/g, '')];
      if (exact) return exact;
      // Pas de règle sur la longueur : la source étant intégralement en
      // capitales, un test « mot court tout en majuscules » retiendrait aussi
      // « BUY » dans Best Buy. Seule la liste ci-dessus fait exception.
      // Pas de majuscule après une apostrophe, sinon « Kohl's » devient « Kohl'S ».
      return mot.toLowerCase().replace(/(^|[\s\-])([a-zà-ÿ])/g, (_, sep, c) => sep + c.toUpperCase());
    })
    .join(' ');
}

function parseCsv(texte) {
  return texte.trim().split('\n').map(l => l.split(','));
}

// Alpha Vantage refuse certains horizons selon la clé : on tente le plus
// large et on retombe sur un plus court plutôt que de renvoyer une erreur.
async function fetchCalendrier(key) {
  let derniereErreur = null;
  for (const horizon of HORIZONS) {
    const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=${horizon}&apikey=${key}`;
    const r = await fetch(url);
    if (!r.ok) { derniereErreur = new Error(`Alpha Vantage HTTP ${r.status}`); continue; }
    const texte = await r.text();

    // Un horizon refusé renvoie l'en-tête CSV attendu, suivi du mot
    // « Information » éclaté sur les colonnes ("I,n,f,o,r,m,a"). Vérifier
    // l'en-tête ne suffit donc pas : on exige de vraies dates dans le corps.
    const lignes = parseCsv(texte);
    const datesValides = lignes.slice(1).filter(c => /^\d{4}-\d{2}-\d{2}$/.test((c[2] || '').trim()));
    if (datesValides.length < 10) {
      derniereErreur = new Error(`horizon ${horizon} sans données exploitables`);
      continue;
    }
    return { texte, horizon };
  }
  throw derniereErreur || new Error('Aucun horizon exploitable');
}

async function fetchResultats() {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) throw new Error('ALPHAVANTAGE_API_KEY manquante');

  const { texte, horizon } = await fetchCalendrier(key);
  const [, ...corps] = parseCsv(texte);

  const evenements = corps
    .map(c => ({
      symbole: (c[0] || '').trim(),
      nom: (c[1] || '').trim(),
      date: (c[2] || '').trim(),
      estimation: c[4] ? parseFloat(c[4]) : null,
      devise: (c[5] || 'USD').trim(),
      moment: (c[6] || '').trim(), // pre-market / post-market
    }))
    .filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date))
    .filter(e => GRANDES_VALEURS.has(e.symbole))
    .map(e => ({ ...e, nom: nettoyerNom(e.nom) }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.symbole.localeCompare(b.symbole));

  if (!evenements.length) throw new Error('Aucune publication exploitable');

  // Regroupé par mois puis par jour : c'est la forme qu'attend la navigation
  // mois par mois côté affichage.
  const parMois = {};
  evenements.forEach(e => {
    const mois = e.date.slice(0, 7);
    const jours = (parMois[mois] = parMois[mois] || {});
    (jours[e.date] = jours[e.date] || []).push(e);
  });

  const mois = Object.keys(parMois).sort().map(cle => ({
    mois: cle,
    total: Object.values(parMois[cle]).reduce((n, j) => n + j.length, 0),
    jours: Object.keys(parMois[cle]).sort().map(date => ({ date, evenements: parMois[cle][date] })),
  }));

  return {
    horizon,
    debut: evenements[0].date,
    fin: evenements[evenements.length - 1].date,
    total: evenements.length,
    mois,
  };
}

export default async function handler(req, res) {
  const now = Date.now();

  if (!cache || now - cacheAt >= CACHE_MS) {
    try {
      cache = await fetchResultats();
      cacheAt = now;
    } catch (e) {
      console.error('[resultats]', e.message);
      if (cache) {
        res.setHeader('Cache-Control', CACHE_CONTROL);
        return res.status(200).json({ ...cache, stale: true });
      }
      return res.status(502).json({ error: e.message });
    }
  }

  res.setHeader('Cache-Control', CACHE_CONTROL);
  return res.status(200).json(cache);
}
