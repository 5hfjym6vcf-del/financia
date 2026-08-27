// ============================================================
// FINANCIA — api/actus.js
// Flux d'actualités de la page d'accueil et du bloc « L'actu de tes favoris ».
//
// Source : NewsAPI, en remplacement d'Alpha Vantage.
//
// Alpha Vantage honorait bien sort=LATEST — les articles revenaient en ordre
// strictement décroissant — mais n'avait tout simplement plus rien de récent
// pour ces sujets : le plus frais des douze datait de quatre mois et demi, le
// plus ancien de janvier 2021, et aucun n'avait moins de trois jours. Filtrer
// par date sur cette source n'aurait pas rafraîchi la section, elle l'aurait
// vidée. NewsAPI publie en continu et en français, ce qui épargne au passage
// une traduction pour la majorité des visiteurs.
//
// La forme renvoyée reste celle d'Alpha Vantage (feed[] avec time_published et
// topics[]) : tout le code d'affichage, partagé entre l'accueil et la page des
// favoris, fonctionne sans modification.
// ============================================================

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30 * 60 * 1000;
const CACHE_CONTROL = 's-maxage=1800, stale-while-revalidate=3600';

// Au-delà, ce n'est plus de l'actualité. Le seuil est volontairement lisible :
// c'est le réglage qu'il faudra desserrer si la source ne fournit pas assez.
const FRAICHEUR_HEURES = 72;

// Une requête large : les articles sont ensuite rangés par thème ci-dessous,
// et mieux vaut trier trop d'articles que d'en manquer.
const REQUETE = [
  'bourse', 'actions', 'investissement', '"marchés financiers"', 'CAC 40',
  'crypto', 'bitcoin', 'ethereum',
  'pétrole', 'inflation', 'BCE', 'Fed', 'taux directeurs',
].join(' OR ');

// Les thèmes du sélecteur « L'actu qu'il te faut ». NewsAPI ne classe pas les
// articles, contrairement à Alpha Vantage : on retrouve le sujet par mots-clés,
// dans le titre et le chapô. Les termes anglais sont inclus, la presse
// économique francophone les employant couramment.
const THEMES = {
  blockchain: [
    'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'stablecoin',
    'token', 'nft', 'binance', 'coinbase', 'monnaie numérique',
  ],
  energy_transportation: [
    'pétrole', 'petrole', 'brent', 'baril', 'opep', 'gaz', 'énergie', 'energie',
    'électricité', 'or', 'cuivre', 'matières premières', 'lithium', 'uranium',
  ],
  financial_markets: [
    'bourse', 'action', 'cac 40', 'nasdaq', 's&p', 'dow jones', 'indice',
    'etf', 'marché', 'cotation', 'dividende', 'obligation', 'wall street',
    'introduction en bourse', 'capitalisation',
  ],
};

export function horodatage(iso) {
  // Alpha Vantage émettait AAAAMMJJTHHMMSS, et tout l'affichage lit ce format.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T` +
         `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

// Une simple recherche de sous-chaîne serait piégeuse : « or » se trouve dans
// trésor, record, majoration. On borne donc chaque terme par des positions qui
// ne sont pas des lettres, ce qui laisse passer « l'or » et « or, » sans
// attraper les mots qui le contiennent.
const bornes = new Map();
function contient(texte, motCle) {
  if (!bornes.has(motCle)) {
    const echappe = motCle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    bornes.set(motCle, new RegExp(`(?<!\\p{L})${echappe}(?!\\p{L})`, 'iu'));
  }
  return bornes.get(motCle).test(texte);
}

export function sujets(article) {
  const texte = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  const trouves = [];

  for (const [sujet, motsCles] of Object.entries(THEMES)) {
    const touches = motsCles.filter(m => contient(texte, m)).length;
    if (!touches) continue;
    // Le score sert à classer les articles au sein d'un thème : plus un article
    // emploie le vocabulaire du sujet, plus il remonte. Plafonné à 1, et au
    // moins 0,4 pour rester au-dessus du seuil de pertinence côté affichage.
    trouves.push({ topic: sujet, relevance_score: String(Math.min(1, 0.4 + touches * 0.2)) });
  }

  // Un article financier qui n'emploie aucun terme reconnu reste une actu de
  // marché : le classer là vaut mieux que de le faire disparaître du « Tout ».
  if (!trouves.length) trouves.push({ topic: 'financial_markets', relevance_score: '0.3' });
  return trouves;
}

async function fetchActus(key) {
  const depuis = new Date(Date.now() - FRAICHEUR_HEURES * 3600 * 1000);

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', REQUETE);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '50');
  // La fenêtre est demandée à la source plutôt que filtrée après coup : inutile
  // de faire transiter des articles qu'on jetterait.
  url.searchParams.set('from', depuis.toISOString().slice(0, 19));

  const r = await fetch(url.toString(), { headers: { 'X-Api-Key': key } });
  const data = await r.json();

  if (!r.ok || data.status !== 'ok') {
    throw new Error(data.message || `NewsAPI HTTP ${r.status}`);
  }

  const limite = depuis.getTime();
  const vus = new Set();

  const feed = (data.articles || [])
    .filter(a => a.title && a.url && a.publishedAt)
    // Le même sujet ressort souvent chez plusieurs reprises de dépêche.
    .filter(a => { const c = a.title.toLowerCase(); if (vus.has(c)) return false; vus.add(c); return true; })
    // Deuxième garde après le paramètre from : une source qui l'ignorerait ne
    // doit pas pouvoir réintroduire de vieux articles.
    .filter(a => new Date(a.publishedAt).getTime() >= limite)
    .slice(0, 20)
    .map(a => ({
      title: a.title,
      url: a.url,
      source: a.source?.name || '',
      time_published: horodatage(a.publishedAt),
      topics: sujets(a),
    }))
    .filter(a => a.time_published);

  return { feed, items: String(feed.length), fraicheurHeures: FRAICHEUR_HEURES };
}

export default async function handler(req, res) {
  const now = Date.now();

  if (cache && now - cacheAt < CACHE_MS) {
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.error('[actus] NEWS_API_KEY manquante');
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' });
  }

  try {
    const frais = await fetchActus(key);
    console.log(`[actus] ${frais.feed.length} articles de moins de ${FRAICHEUR_HEURES} h`);
    cache = frais;
    cacheAt = now;
    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(cache);
  } catch (e) {
    console.error('[actus] Échec NewsAPI :', e.message);
    // Le dernier flux connu vaut mieux qu'une section en erreur, à condition
    // qu'il soit signalé comme tel. Sans cache, c'est une vraie panne.
    if (cache) return res.status(200).json({ ...cache, stale: true });
    return res.status(502).json({ error: e.message });
  }
}
